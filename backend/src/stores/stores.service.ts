import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Not } from 'typeorm';
import { Store } from './entities/store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoreFilterDto, StoreStatus } from './dto/store-filter.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import slugify from 'slugify';

export interface StoreStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  averageRating: number;
  totalFollowers: number;
  totalReviews: number;
  pendingOrders: number;
  completedOrders: number;
}

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * Generate a unique slug from store name
   */
  private async generateSlug(name: string): Promise<string> {
    const baseSlug = slugify(name, { lower: true, strict: true, trim: true });
    let slug = baseSlug;
    let counter = 1;

    while (await this.storeRepository.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * Create a new store
   */
  async create(userId: string, dto: CreateStoreDto): Promise<Store> {
    const owner = await this.userRepository.findOne({ where: { id: userId } });
    if (!owner) {
      throw new NotFoundException('User not found');
    }

    const existingStore = await this.storeRepository.findOne({
      where: { owner: { id: userId } },
    });
    if (existingStore) {
      throw new ConflictException('User already owns a store');
    }

    const slug = await this.generateSlug(dto.name);

    const store = this.storeRepository.create({
      ...dto,
      slug,
      owner,
      status: StoreStatus.PENDING,
      isVerified: false,
      rating: 0,
      followersCount: 0,
      productsCount: 0,
    });

    return this.storeRepository.save(store);
  }

  /**
   * Find all stores with pagination, search, and filters
   */
  async findAll(filter: StoreFilterDto): Promise<{
    data: Store[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      search,
      status,
      businessType,
      isVerified,
      sort,
      order,
      page,
      limit,
      ownerId,
    } = filter;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.name = ILike(`%${search}%`);
    }

    if (status) {
      where.status = status;
    }

    if (businessType) {
      where.businessType = businessType;
    }

    if (isVerified !== undefined) {
      where.isVerified = isVerified;
    }

    if (ownerId) {
      where.owner = { id: ownerId };
    }

    const [data, total] = await this.storeRepository.findAndCount({
      where,
      relations: ['owner', 'products'],
      order: { [sort]: order },
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
   * Find a store by ID with relations
   */
  async findOne(id: string): Promise<Store> {
    const store = await this.storeRepository.findOne({
      where: { id },
      relations: ['owner', 'products', 'products.category', 'followers'],
    });

    if (!store) {
      throw new NotFoundException(`Store with ID "${id}" not found`);
    }

    return store;
  }

  /**
   * Find a store by slug
   */
  async findBySlug(slug: string): Promise<Store> {
    const store = await this.storeRepository.findOne({
      where: { slug },
      relations: ['owner', 'products', 'products.category'],
    });

    if (!store) {
      throw new NotFoundException(`Store with slug "${slug}" not found`);
    }

    return store;
  }

  /**
   * Update a store
   */
  async update(id: string, dto: UpdateStoreDto): Promise<Store> {
    const store = await this.findOne(id);

    if (dto.name && dto.name !== store.name) {
      dto['slug'] = await this.generateSlug(dto.name);
    }

    Object.assign(store, dto);
    return this.storeRepository.save(store);
  }

  /**
   * Soft delete a store
   */
  async remove(id: string): Promise<void> {
    const store = await this.findOne(id);
    store.status = StoreStatus.INACTIVE;
    store.deletedAt = new Date();
    await this.storeRepository.save(store);
  }

  /**
   * Update store status
   */
  async updateStatus(id: string, status: StoreStatus): Promise<Store> {
    const store = await this.findOne(id);

    if (!Object.values(StoreStatus).includes(status)) {
      throw new BadRequestException('Invalid store status');
    }

    store.status = status;
    return this.storeRepository.save(store);
  }

  /**
   * Update store logo
   */
  async updateLogo(id: string, logoUrl: string): Promise<Store> {
    const store = await this.findOne(id);
    store.logo = logoUrl;
    return this.storeRepository.save(store);
  }

  /**
   * Update store cover image
   */
  async updateCover(id: string, coverUrl: string): Promise<Store> {
    const store = await this.findOne(id);
    store.coverImage = coverUrl;
    return this.storeRepository.save(store);
  }

  /**
   * Get store statistics
   */
  async getStoreStats(storeId: string): Promise<StoreStats> {
    const store = await this.findOne(storeId);

    const products = await this.productRepository.find({
      where: { store: { id: storeId } },
    });

    const stats: StoreStats = {
      totalProducts: products.length,
      totalOrders: 0,
      totalRevenue: 0,
      averageRating: store.rating || 0,
      totalFollowers: store.followersCount || 0,
      totalReviews: 0,
      pendingOrders: 0,
      completedOrders: 0,
    };

    return stats;
  }

  /**
   * Follow or unfollow a store
   */
  async followStore(userId: string, storeId: string): Promise<{ following: boolean; followersCount: number }> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
      relations: ['followers'],
    });

    if (!store) {
      throw new NotFoundException(`Store with ID "${storeId}" not found`);
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isFollowing = store.followers?.some((f) => f.id === userId);

    if (isFollowing) {
      store.followers = store.followers.filter((f) => f.id !== userId);
      store.followersCount = Math.max(0, (store.followersCount || 0) - 1);
      await this.storeRepository.save(store);
      return { following: false, followersCount: store.followersCount };
    } else {
      if (!store.followers) store.followers = [];
      store.followers.push(user);
      store.followersCount = (store.followersCount || 0) + 1;
      await this.storeRepository.save(store);
      return { following: true, followersCount: store.followersCount };
    }
  }

  /**
   * Get followers of a store
   */
  async getFollowers(storeId: string): Promise<{ count: number; followers: User[] }> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
      relations: ['followers'],
    });

    if (!store) {
      throw new NotFoundException(`Store with ID "${storeId}" not found`);
    }

    return {
      count: store.followersCount || 0,
      followers: store.followers || [],
    };
  }

  /**
   * Check if user owns store
   */
  async checkOwnership(storeId: string, userId: string): Promise<boolean> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId, owner: { id: userId } },
    });
    return !!store;
  }

  /**
   * Verify a store (admin only)
   */
  async verifyStore(id: string): Promise<Store> {
    const store = await this.findOne(id);
    store.isVerified = true;
    store.status = StoreStatus.ACTIVE;
    return this.storeRepository.save(store);
  }
}
