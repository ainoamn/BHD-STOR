import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from './entities/wishlist.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Get or create wishlist for a user
   */
  private async getOrCreateWishlist(userId: string): Promise<Wishlist> {
    let wishlist = await this.wishlistRepository.findOne({
      where: { user: { id: userId } },
      relations: ['products', 'products.store', 'products.category'],
    });

    if (!wishlist) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      wishlist = this.wishlistRepository.create({
        user,
        products: [],
      });

      wishlist = await this.wishlistRepository.save(wishlist);
    }

    return wishlist;
  }

  /**
   * Get user's wishlist
   */
  async getWishlist(userId: string): Promise<Wishlist> {
    return this.getOrCreateWishlist(userId);
  }

  /**
   * Add product to wishlist
   */
  async addToWishlist(userId: string, productId: string): Promise<Wishlist> {
    const wishlist = await this.getOrCreateWishlist(userId);

    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found`);
    }

    const exists = wishlist.products?.some((p) => p.id === productId);
    if (exists) {
      throw new ConflictException('Product is already in wishlist');
    }

    if (!wishlist.products) wishlist.products = [];
    wishlist.products.push(product);

    return this.wishlistRepository.save(wishlist);
  }

  /**
   * Remove product from wishlist
   */
  async removeFromWishlist(userId: string, productId: string): Promise<Wishlist> {
    const wishlist = await this.getOrCreateWishlist(userId);

    const exists = wishlist.products?.some((p) => p.id === productId);
    if (!exists) {
      throw new NotFoundException('Product not found in wishlist');
    }

    wishlist.products = wishlist.products?.filter((p) => p.id !== productId) || [];

    return this.wishlistRepository.save(wishlist);
  }

  /**
   * Check if product is in wishlist
   */
  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    const wishlist = await this.getOrCreateWishlist(userId);
    return wishlist.products?.some((p) => p.id === productId) || false;
  }

  /**
   * Toggle product in wishlist (add if not present, remove if present)
   */
  async toggleWishlist(userId: string, productId: string): Promise<{ inWishlist: boolean; wishlist: Wishlist }> {
    const isInWishlist = await this.isInWishlist(userId, productId);

    if (isInWishlist) {
      const wishlist = await this.removeFromWishlist(userId, productId);
      return { inWishlist: false, wishlist };
    } else {
      const wishlist = await this.addToWishlist(userId, productId);
      return { inWishlist: true, wishlist };
    }
  }

  /**
   * Get wishlist count
   */
  async getWishlistCount(userId: string): Promise<number> {
    const wishlist = await this.getOrCreateWishlist(userId);
    return wishlist.products?.length || 0;
  }

  /**
   * Clear wishlist
   */
  async clearWishlist(userId: string): Promise<void> {
    const wishlist = await this.getOrCreateWishlist(userId);
    wishlist.products = [];
    await this.wishlistRepository.save(wishlist);
  }

  /**
   * Move wishlist item to cart
   */
  async moveToCart(userId: string, productId: string, cartService: any): Promise<void> {
    await this.removeFromWishlist(userId, productId);
    await cartService.addItem(userId, { productId, quantity: 1 });
  }
}
