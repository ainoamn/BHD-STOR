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

  async getWishlist(userId: string): Promise<{ items: Wishlist[]; count: number }> {
    const items = await this.wishlistRepository.find({
      where: { userId },
      relations: ['product'],
      order: { addedAt: 'DESC' },
    });
    return { items, count: items.length };
  }

  async addToWishlist(userId: string, productId: string): Promise<Wishlist> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const existing = await this.wishlistRepository.findOne({ where: { userId, productId } });
    if (existing) throw new ConflictException('Product already in wishlist');

    const entry = this.wishlistRepository.create({ userId, productId, user, product });
    return this.wishlistRepository.save(entry);
  }

  async removeFromWishlist(userId: string, productId: string): Promise<{ removed: boolean }> {
    const existing = await this.wishlistRepository.findOne({ where: { userId, productId } });
    if (!existing) throw new NotFoundException('Product not in wishlist');
    await this.wishlistRepository.remove(existing);
    return { removed: true };
  }

  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    const existing = await this.wishlistRepository.findOne({ where: { userId, productId } });
    return Boolean(existing);
  }

  async toggleWishlist(
    userId: string,
    productId: string,
  ): Promise<{ inWishlist: boolean; item?: Wishlist }> {
    const existing = await this.wishlistRepository.findOne({ where: { userId, productId } });
    if (existing) {
      await this.wishlistRepository.remove(existing);
      return { inWishlist: false };
    }
    const item = await this.addToWishlist(userId, productId);
    return { inWishlist: true, item };
  }

  async getWishlistCount(userId: string): Promise<number> {
    return this.wishlistRepository.count({ where: { userId } });
  }

  async clearWishlist(userId: string): Promise<void> {
    const items = await this.wishlistRepository.find({ where: { userId } });
    if (items.length) await this.wishlistRepository.remove(items);
  }
}
