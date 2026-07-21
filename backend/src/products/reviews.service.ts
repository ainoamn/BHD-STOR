import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Product } from './entities/product.entity';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  /**
   * Create a new review
   */
  async create(userId: string, dto: CreateReviewDto): Promise<Review> {
    const product = await this.productRepository.findOne({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID "${dto.productId}" not found`);
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingReview = await this.reviewRepository.findOne({
      where: { user: { id: userId }, product: { id: dto.productId } },
    });
    if (existingReview) {
      throw new ConflictException('You have already reviewed this product');
    }

    if (dto.orderId) {
      const order = await this.orderRepository.findOne({
        where: { id: dto.orderId, user: { id: userId } },
      });
      if (!order) {
        throw new BadRequestException('Invalid order ID');
      }
    }

    const review = this.reviewRepository.create({
      ...dto,
      user,
      product,
      isVerifiedPurchase: !!dto.orderId,
    });

    const savedReview = await this.reviewRepository.save(review);

    // Update product rating
    await this.updateProductRating(dto.productId);

    return savedReview;
  }

  /**
   * Find all reviews for a product
   */
  async findByProduct(
    productId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Review[]; total: number; page: number; limit: number; totalPages: number }> {
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found`);
    }

    const skip = (page - 1) * limit;

    const [data, total] = await this.reviewRepository.findAndCount({
      where: { product: { id: productId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find all reviews by a user
   */
  async findByUser(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Review[]; total: number; page: number; limit: number; totalPages: number }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const skip = (page - 1) * limit;

    const [data, total] = await this.reviewRepository.findAndCount({
      where: { user: { id: userId } },
      relations: ['product'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find a review by ID
   */
  async findOne(id: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'product'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID "${id}" not found`);
    }

    return review;
  }

  /**
   * Update a review (only by the author)
   */
  async update(id: string, userId: string, dto: Partial<CreateReviewDto>): Promise<Review> {
    const review = await this.findOne(id);

    if (review.user.id !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    Object.assign(review, dto);
    const updatedReview = await this.reviewRepository.save(review);

    // Update product rating
    await this.updateProductRating(review.product.id);

    return updatedReview;
  }

  /**
   * Delete a review (soft delete)
   */
  async remove(id: string, userId: string): Promise<void> {
    const review = await this.findOne(id);

    if (review.user.id !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    review.deletedAt = new Date();
    await this.reviewRepository.save(review);

    // Update product rating
    await this.updateProductRating(review.product.id);
  }

  /**
   * Mark review as helpful
   */
  async markHelpful(id: string): Promise<Review> {
    const review = await this.findOne(id);
    review.helpfulCount = (review.helpfulCount || 0) + 1;
    return this.reviewRepository.save(review);
  }

  /**
   * Get review summary for a product
   */
  async getProductReviewSummary(productId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
  }> {
    const reviews = await this.reviewRepository.find({
      where: { product: { id: productId }, deletedAt: null },
    });

    const totalReviews = reviews.length;
    if (totalReviews === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = Math.round((sum / totalReviews) * 10) / 10;

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
    });

    return {
      averageRating,
      totalReviews,
      ratingDistribution,
    };
  }

  /**
   * Check if user can review a product (must have purchased)
   */
  async canReview(userId: string, productId: string): Promise<boolean> {
    const existingReview = await this.reviewRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });

    if (existingReview) {
      return false;
    }

    const order = await this.orderRepository.findOne({
      where: {
        user: { id: userId },
        items: { product: { id: productId } },
        status: 'delivered',
      },
      relations: ['items'],
    });

    return !!order;
  }

  /**
   * Update product average rating
   */
  private async updateProductRating(productId: string): Promise<void> {
    const reviews = await this.reviewRepository.find({
      where: { product: { id: productId }, deletedAt: null },
    });

    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (product) {
      const totalReviews = reviews.length;
      if (totalReviews > 0) {
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        product.rating = Math.round((sum / totalReviews) * 10) / 10;
      } else {
        product.rating = 0;
      }
      product.reviewCount = totalReviews;
      await this.productRepository.save(product);
    }
  }
}
