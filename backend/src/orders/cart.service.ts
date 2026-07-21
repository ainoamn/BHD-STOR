import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart, CartItem } from './entities/cart.entity';
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

  /**
   * Get or create cart for a user
   */
  async getCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product', 'items.product.store', 'items.product.category'],
    });

    if (!cart) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      cart = this.cartRepository.create({
        user,
        items: [],
        couponCode: null,
        discountAmount: 0,
        currency: 'OMR',
      });

      cart = await this.cartRepository.save(cart);
    }

    return cart;
  }

  /**
   * Add item to cart
   */
  async addItem(userId: string, dto: CartItemDto): Promise<Cart> {
    const cart = await this.getCart(userId);

    const product = await this.productRepository.findOne({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID "${dto.productId}" not found`);
    }

    if (product.inventoryQuantity < dto.quantity) {
      throw new BadRequestException(
        `Insufficient inventory. Available: ${product.inventoryQuantity}, Requested: ${dto.quantity}`,
      );
    }

    // Check if product already in cart
    const existingItem = cart.items?.find(
      (item) =>
        item.product.id === dto.productId &&
        JSON.stringify(item.variantAttributes) === JSON.stringify(dto.variantAttributes || {}),
    );

    if (existingItem) {
      existingItem.quantity += dto.quantity;
      existingItem.totalPrice = existingItem.unitPrice * existingItem.quantity;
      await this.cartItemRepository.save(existingItem);
    } else {
      const cartItem = this.cartItemRepository.create({
        cart,
        product,
        productName: product.name,
        productImage: product.images?.[0] || null,
        quantity: dto.quantity,
        unitPrice: product.price,
        totalPrice: product.price * dto.quantity,
        variantAttributes: dto.variantAttributes || {},
      });

      if (!cart.items) cart.items = [];
      cart.items.push(cartItem);
      await this.cartItemRepository.save(cartItem);
    }

    await this.updateCartTotals(cart);

    return this.getCart(userId);
  }

  /**
   * Update cart item quantity
   */
  async updateItem(userId: string, itemId: string, quantity: number): Promise<Cart> {
    if (quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    const cart = await this.getCart(userId);

    const item = cart.items?.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    if (item.product.inventoryQuantity < quantity) {
      throw new BadRequestException(
        `Insufficient inventory. Available: ${item.product.inventoryQuantity}`,
      );
    }

    item.quantity = quantity;
    item.totalPrice = item.unitPrice * quantity;
    await this.cartItemRepository.save(item);

    await this.updateCartTotals(cart);

    return this.getCart(userId);
  }

  /**
   * Remove item from cart
   */
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

  /**
   * Clear cart
   */
  async clearCart(userId: string): Promise<void> {
    const cart = await this.getCart(userId);

    if (cart.items && cart.items.length > 0) {
      await this.cartItemRepository.remove(cart.items);
      cart.items = [];
    }

    cart.couponCode = null;
    cart.discountAmount = 0;
    cart.subtotal = 0;
    cart.tax = 0;
    cart.shipping = 0;
    cart.total = 0;

    await this.cartRepository.save(cart);
  }

  /**
   * Apply coupon to cart
   * Validates coupon code against the active coupons list and calculates discount
   */
  async applyCoupon(userId: string, code: string): Promise<Cart> {
    const cart = await this.getCart(userId);

    // Active coupon codes with their discount configurations
    const activeCoupons = ['WELCOME10', 'WELCOME20', 'FLAT5'];
    if (!activeCoupons.includes(code.toUpperCase())) {
      throw new BadRequestException('Invalid coupon code');
    }

    cart.couponCode = code.toUpperCase();

    // Calculate discount based on coupon type
    let discountAmount = 0;
    if (code.toUpperCase() === 'FLAT5') {
      discountAmount = 5;
    } else if (code.toUpperCase().startsWith('WELCOME')) {
      const percent = parseInt(code.replace(/\D/g, '')) || 10;
      discountAmount = (cart.subtotal * percent) / 100;
    }

    cart.discountAmount = Math.min(discountAmount, cart.subtotal);
    cart.total = cart.subtotal + cart.tax + cart.shipping - cart.discountAmount;

    await this.cartRepository.save(cart);

    return this.getCart(userId);
  }

  /**
   * Remove coupon from cart
   */
  async removeCoupon(userId: string): Promise<Cart> {
    const cart = await this.getCart(userId);

    cart.couponCode = null;
    cart.discountAmount = 0;
    cart.total = cart.subtotal + cart.tax + cart.shipping;

    await this.cartRepository.save(cart);

    return this.getCart(userId);
  }

  /**
   * Get cart totals
   */
  async getCartTotals(userId: string): Promise<CartTotalsDto> {
    const cart = await this.getCart(userId);

    return {
      subtotal: cart.subtotal || 0,
      tax: cart.tax || 0,
      shipping: cart.shipping || 0,
      discount: cart.discountAmount || 0,
      total: cart.total || 0,
      itemCount: cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
      currency: cart.currency || 'OMR',
    };
  }

  /**
   * Merge guest cart on login
   */
  async mergeGuestCart(userId: string, sessionCartItems: CartItemDto[]): Promise<Cart> {
    if (!sessionCartItems || sessionCartItems.length === 0) {
      return this.getCart(userId);
    }

    for (const item of sessionCartItems) {
      try {
        await this.addItem(userId, item);
      } catch {
        // Skip items that can't be added
        continue;
      }
    }

    return this.getCart(userId);
  }

  /**
   * Update cart totals after item changes
   */
  private async updateCartTotals(cart: Cart): Promise<void> {
    const items = cart.items || [];

    cart.subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

    // Tax: 5% for Oman
    const taxRate = 0.05;
    cart.tax = Math.round(cart.subtotal * taxRate * 100) / 100;

    // Shipping: Free over 10 OMR, otherwise 2 OMR
    cart.shipping = cart.subtotal >= 10 ? 0 : 2;

    // Apply existing coupon
    if (cart.couponCode && cart.discountAmount > 0) {
      cart.total = cart.subtotal + cart.tax + cart.shipping - cart.discountAmount;
    } else {
      cart.discountAmount = 0;
      cart.total = cart.subtotal + cart.tax + cart.shipping;
    }

    // Ensure totals are rounded
    cart.subtotal = Math.round(cart.subtotal * 100) / 100;
    cart.tax = Math.round(cart.tax * 100) / 100;
    cart.total = Math.round(cart.total * 100) / 100;

    await this.cartRepository.save(cart);
  }
}
