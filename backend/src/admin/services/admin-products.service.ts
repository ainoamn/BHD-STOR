import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { Review } from '../../reviews/entities/review.entity';

export interface ProductQueryDto {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable()
export class AdminProductsService {
  private readonly logger = new Logger(AdminProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  async findAll(query: ProductQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.search) {
      where.name = Like(`%${query.search}%`);
    }

    const [products, total] = await this.productRepository.findAndCount({
      where,
      order: { [query.sortBy || 'createdAt']: query.sortOrder || 'DESC' },
      skip,
      take: limit,
      relations: ['store', 'images'],
    });

    return {
      success: true,
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateStatus(id: string, status: 'active' | 'inactive' | 'out_of_stock' | 'draft') {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException({
        success: false,
        message: `Product with ID ${id} not found`,
      });
    }

    await this.productRepository.update(id, { status });

    return {
      success: true,
      message: `Product status updated to ${status}`,
      data: { id, status },
    };
  }

  async featureProduct(id: string) {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException({
        success: false,
        message: `Product with ID ${id} not found`,
      });
    }

    const newFeatured = !product.isFeatured;
    await this.productRepository.update(id, { isFeatured: newFeatured });

    return {
      success: true,
      message: `Product ${newFeatured ? 'marked as featured' : 'removed from featured'}`,
      data: { id, isFeatured: newFeatured },
    };
  }

  async getStats() {
    const [
      totalProducts,
      activeProducts,
      inactiveProducts,
      outOfStockProducts,
      featuredProducts,
    ] = await Promise.all([
      this.productRepository.count(),
      this.productRepository.count({ where: { status: 'active' } }),
      this.productRepository.count({ where: { status: 'inactive' } }),
      this.productRepository.count({ where: { status: 'out_of_stock' } }),
      this.productRepository.count({ where: { isFeatured: true } }),
    ]);

    return {
      success: true,
      data: {
        totalProducts,
        activeProducts,
        inactiveProducts,
        outOfStockProducts,
        featuredProducts,
      },
    };
  }

  async moderateReview(id: string, status: 'approved' | 'rejected') {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['product', 'user'],
    });

    if (!review) {
      throw new NotFoundException({
        success: false,
        message: `Review with ID ${id} not found`,
      });
    }

    await this.reviewRepository.update(id, { status });

    return {
      success: true,
      message: `Review ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
      data: { id, status },
    };
  }
}
