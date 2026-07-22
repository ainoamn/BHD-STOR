import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { CartItemDto, CartTotalsDto } from './dto/cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items', 'items.product', 'items.product.store'],
    });

    if (!cart) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      cart = this.cartRepository.create({
        userId,
        user,
        items: [],
        couponCode: null,
        discountAmount: 0,
        taxAmount: 0,
        shipping: 0,
        subtotal: 0,
        total: 0,
        currency: 'OMR',
        itemCount: 0,
      });

      cart = await this.cartRepository.save(cart);
    }

    return cart;
  }

  async addItem(userId: string, dto: CartItemDto): Promise<Cart> {
    const cart = await this.getCart(userId);

    const product = await this.productRepository.findOne({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID "${dto.productId}" not found`);
    }

    const available = Number(product.stock ?? 0);
    if (available < dto.quantity) {
      throw new BadRequestException(
        `Insufficient inventory. Available: ${available}, Requested: ${dto.quantity}`,
      );
    }

    const existingItem = cart.items?.find(
      (item) =>
        item.productId === dto.productId &&
        JSON.stringify(item.variantAttributes || {}) ===
          JSON.stringify(dto.variantAttributes || {}),
    );

    if (existingItem) {
      existingItem.quantity += dto.quantity;
      existingItem.unitPrice = Number(product.price);
      existingItem.recalculateTotal();
      await this.cartItemRepository.save(existingItem);
    } else {
      const cartItem = this.cartItemRepository.create({
        cart,
        cartId: cart.id,
        product,
        productId: product.id,
        quantity: dto.quantity,
        unitPrice: Number(product.price),
        total: Number(product.price) * dto.quantity,
        variantAttributes: dto.variantAttributes || {},
      });

      if (!cart.items) cart.items = [];
      cart.items.push(cartItem);
      await this.cartItemRepository.save(cartItem);
    }

    await this.updateCartTotals(cart);
    return this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, quantity: number): Promise<Cart> {
    if (quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    const cart = await this.getCart(userId);
    const item = cart.items?.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    const available = Number(item.product?.stock ?? 0);
    if (item.product && available < quantity) {
      throw new BadRequestException(`Insufficient inventory. Available: ${available}`);
    }

    item.quantity = quantity;
    item.recalculateTotal();
    await this.cartItemRepository.save(item);
    await this.updateCartTotals(cart);
    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string): Promise<Cart> {
    const cart = await this.getCart(userId);
    const item = cart.items?.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    await this.cartItemRepository.remove(item);
    cart.items = cart.items?.filter((i) => i.id !== itemId) || [];
    await this.updateCartTotals(cart);
    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await this.getCart(userId);
    if (cart.items && cart.items.length > 0) {
      await this.cartItemRepository.remove(cart.items);
      cart.items = [];
    }
    cart.couponCode = null;
    cart.discountAmount = 0;
    cart.taxAmount = 0;
    cart.shipping = 0;
    cart.subtotal = 0;
    cart.total = 0;
    cart.itemCount = 0;
    await this.cartRepository.save(cart);
  }

  async applyCoupon(userId: string, code: string): Promise<Cart> {
    const cart = await this.getCart(userId);
    const activeCoupons = ['WELCOME10', 'WELCOME20', 'FLAT5'];
    if (!activeCoupons.includes(code.toUpperCase())) {
      throw new BadRequestException('Invalid coupon code');
    }

    cart.couponCode = code.toUpperCase();
    let discountAmount = 0;
    if (code.toUpperCase() === 'FLAT5') {
      discountAmount = 5;
    } else if (code.toUpperCase().startsWith('WELCOME')) {
      const percent = parseInt(code.replace(/\D/g, ''), 10) || 10;
      discountAmount = (Number(cart.subtotal) * percent) / 100;
    }

    cart.discountAmount = Math.min(discountAmount, Number(cart.subtotal));
    cart.total =
      Number(cart.subtotal) + Number(cart.taxAmount) + Number(cart.shipping) - Number(cart.discountAmount);
    await this.cartRepository.save(cart);
    return this.getCart(userId);
  }

  async removeCoupon(userId: string): Promise<Cart> {
    const cart = await this.getCart(userId);
    cart.couponCode = null;
    cart.discountAmount = 0;
    cart.total = Number(cart.subtotal) + Number(cart.taxAmount) + Number(cart.shipping);
    await this.cartRepository.save(cart);
    return this.getCart(userId);
  }

  async getCartTotals(userId: string): Promise<CartTotalsDto> {
    const cart = await this.getCart(userId);
    return {
      subtotal: Number(cart.subtotal) || 0,
      tax: Number(cart.taxAmount) || 0,
      shipping: Number(cart.shipping) || 0,
      discount: Number(cart.discountAmount) || 0,
      total: Number(cart.total) || 0,
      itemCount: cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
      currency: cart.currency || 'OMR',
    };
  }

  async mergeGuestCart(userId: string, sessionCartItems: CartItemDto[]): Promise<Cart> {
    if (!sessionCartItems || sessionCartItems.length === 0) {
      return this.getCart(userId);
    }
    for (const item of sessionCartItems) {
      try {
        await this.addItem(userId, item);
      } catch {
        continue;
      }
    }
    return this.getCart(userId);
  }

  private async updateCartTotals(cart: Cart): Promise<void> {
    const items = cart.items || [];
    cart.subtotal = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
    cart.taxAmount = Math.round(cart.subtotal * 0.05 * 1000) / 1000;
    cart.shipping = cart.subtotal >= 10 ? 0 : 2;
    cart.itemCount = items.reduce((count, item) => count + item.quantity, 0);

    if (cart.couponCode && Number(cart.discountAmount) > 0) {
      cart.total =
        cart.subtotal + cart.taxAmount + Number(cart.shipping) - Number(cart.discountAmount);
    } else {
      cart.discountAmount = 0;
      cart.total = cart.subtotal + cart.taxAmount + Number(cart.shipping);
    }

    cart.subtotal = Math.round(cart.subtotal * 1000) / 1000;
    cart.taxAmount = Math.round(Number(cart.taxAmount) * 1000) / 1000;
    cart.total = Math.round(Number(cart.total) * 1000) / 1000;
    await this.cartRepository.save(cart);
  }
}
