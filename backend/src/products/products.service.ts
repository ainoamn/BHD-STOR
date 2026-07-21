import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Between, In, MoreThan } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { Store } from '../stores/entities/store.entity';
import { CreateProductDto, ProductStatus } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFilterDto, ProductSortField } from './dto/product-filter.dto';
import slugify from 'slugify';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  /**
   * Generate unique slug from product name
   */
  private async generateSlug(name: string): Promise<string> {
    const baseSlug = slugify(name, { lower: true, strict: true, trim: true });
    let slug = baseSlug;
    let counter = 1;

    while (await this.productRepository.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * Create a new product
   */
  async create(storeId: string, dto: CreateProductDto): Promise<Product> {
    const store = await this.storeRepository.findOne({ where: { id: dto.storeId } });
    if (!store) {
      throw new NotFoundException(`Store with ID "${dto.storeId}" not found`);
    }

    const category = await this.categoryRepository.findOne({ where: { id: dto.categoryId } });
    if (!category) {
      throw new NotFoundException(`Category with ID "${dto.categoryId}" not found`);
    }

    const slug = await this.generateSlug(dto.name);

    const product = this.productRepository.create({
      ...dto,
      slug,
      store,
      category,
      viewCount: 0,
      salesCount: 0,
      rating: 0,
      reviewCount: 0,
    });

    return this.productRepository.save(product);
  }

  /**
   * Find all products with pagination, search, and filters
   */
  async findAll(filter: ProductFilterDto): Promise<{
    data: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      search,
      categoryId,
      storeId,
      minPrice,
      maxPrice,
      status,
      type,
      tags,
      sort,
      order,
      page,
      limit,
      includeOutOfStock,
    } = filter;

    const skip = (page - 1) * limit;

    const queryBuilder = this.productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.store', 'store')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.reviews', 'reviews');

    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.shortDescription ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    if (storeId) {
      queryBuilder.andWhere('product.storeId = :storeId', { storeId });
    }

    if (minPrice !== undefined && maxPrice !== undefined) {
      queryBuilder.andWhere('product.price BETWEEN :minPrice AND :maxPrice', {
        minPrice,
        maxPrice,
      });
    } else if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    } else if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    if (status) {
      queryBuilder.andWhere('product.status = :status', { status });
    } else {
      queryBuilder.andWhere('product.status = :status', { status: ProductStatus.ACTIVE });
    }

    if (type) {
      queryBuilder.andWhere('product.type = :type', { type });
    }

    if (tags && tags.length > 0) {
      queryBuilder.andWhere('product.tags && :tags', { tags });
    }

    if (!includeOutOfStock) {
      queryBuilder.andWhere('product.inventoryQuantity > 0');
    }

    queryBuilder.orderBy(`product.${sort}`, order);

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find product by ID with relations
   */
  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['store', 'store.owner', 'category', 'reviews', 'reviews.user'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    return product;
  }

  /**
   * Find product by slug
   */
  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { slug },
      relations: ['store', 'store.owner', 'category', 'reviews', 'reviews.user'],
    });

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    return product;
  }

  /**
   * Update product
   */
  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    if (dto.name && dto.name !== product.name) {
      dto['slug'] = await this.generateSlug(dto.name);
    }

    if (dto.categoryId && dto.categoryId !== product.category?.id) {
      const category = await this.categoryRepository.findOne({ where: { id: dto.categoryId } });
      if (!category) {
        throw new NotFoundException(`Category with ID "${dto.categoryId}" not found`);
      }
      product.category = category;
    }

    Object.assign(product, dto);
    return this.productRepository.save(product);
  }

  /**
   * Soft delete product
   */
  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    product.status = ProductStatus.ARCHIVED;
    product.deletedAt = new Date();
    await this.productRepository.save(product);
  }

  /**
   * Update inventory quantity
   */
  async updateInventory(id: string, quantity: number): Promise<Product> {
    const product = await this.findOne(id);
    product.inventoryQuantity = quantity;

    if (quantity === 0) {
      product.status = ProductStatus.OUT_OF_STOCK;
    } else if (product.status === ProductStatus.OUT_OF_STOCK && quantity > 0) {
      product.status = ProductStatus.ACTIVE;
    }

    return this.productRepository.save(product);
  }

  /**
   * Update product status
   */
  async updateStatus(id: string, status: ProductStatus): Promise<Product> {
    const product = await this.findOne(id);

    if (!Object.values(ProductStatus).includes(status)) {
      throw new BadRequestException('Invalid product status');
    }

    product.status = status;
    return this.productRepository.save(product);
  }

  /**
   * Full-text search on products
   */
  async search(query: string): Promise<Product[]> {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters');
    }

    const searchTerm = `%${query}%`;

    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.store', 'store')
      .leftJoinAndSelect('product.category', 'category')
      .where(
        'product.name ILIKE :query OR product.description ILIKE :query OR product.shortDescription ILIKE :query OR :query = ANY(product.tags)',
        { query: searchTerm }
      )
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE })
      .orderBy('product.viewCount', 'DESC')
      .take(50)
      .getMany();

    return products;
  }

  /**
   * Get featured products
   */
  async getFeatured(): Promise<Product[]> {
    return this.productRepository.find({
      where: { isFeatured: true, status: ProductStatus.ACTIVE },
      relations: ['store', 'category'],
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  /**
   * Get trending products (most viewed/sold in last 30 days)
   */
  async getTrending(): Promise<Product[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.productRepository.find({
      where: {
        status: ProductStatus.ACTIVE,
        salesCount: MoreThan(0),
      },
      relations: ['store', 'category'],
      order: { salesCount: 'DESC', viewCount: 'DESC' },
      take: 20,
    });
  }

  /**
   * Get products by category
   */
  async getByCategory(categoryId: string): Promise<Product[]> {
    const category = await this.categoryRepository.findOne({ where: { id: categoryId } });
    if (!category) {
      throw new NotFoundException(`Category with ID "${categoryId}" not found`);
    }

    return this.productRepository.find({
      where: { category: { id: categoryId }, status: ProductStatus.ACTIVE },
      relations: ['store'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get products by store
   */
  async getByStore(storeId: string): Promise<Product[]> {
    const store = await this.storeRepository.findOne({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException(`Store with ID "${storeId}" not found`);
    }

    return this.productRepository.find({
      where: { store: { id: storeId } },
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Increment product view count
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.productRepository.increment({ id }, 'viewCount', 1);
  }

  /**
   * Check if product belongs to store
   */
  async checkOwnership(productId: string, storeId: string): Promise<boolean> {
    const product = await this.productRepository.findOne({
      where: { id: productId, store: { id: storeId } },
    });
    return !!product;
  }
}
