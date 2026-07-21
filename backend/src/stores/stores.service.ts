import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Store } from './entities/store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoreFilterDto, StoreStatus } from './dto/store-filter.dto';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import slugify from 'slugify';

export interface StoreScanResult {
  id: string;
  name: string;
  slug: string;
  storeSerial: string;
  storeCode: string;
  logo?: string | null;
  scanUrl: string;
  storePath: string;
}

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
    private readonly configService: ConfigService,
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
   * Unique serial + barcode for stickers / QR.
   * Serial: BHD26-A1B2C3 · Code: BHD26A1B2C3
   */
  private async generateStoreIdentity(): Promise<{ storeSerial: string; storeCode: string }> {
    for (let attempt = 0; attempt < 24; attempt++) {
      const year = new Date().getFullYear().toString().slice(-2);
      const rand = randomBytes(3).toString('hex').toUpperCase();
      const storeSerial = `BHD${year}-${rand}`;
      const storeCode = `BHD${year}${rand}`;
      const exists = await this.storeRepository.findOne({
        where: [{ storeSerial }, { storeCode }],
      });
      if (!exists) return { storeSerial, storeCode };
    }
    throw new ConflictException('Unable to allocate a unique store serial');
  }

  buildScanUrl(serialOrCode: string): string {
    const appUrl = (
      this.configService.get<string>('PUBLIC_APP_URL') ||
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:3000'
    ).replace(/\/$/, '');
    return `${appUrl}/ar/s/${encodeURIComponent(serialOrCode)}`;
  }

  async ensureStoreIdentity(store: Store): Promise<Store> {
    if (store.storeSerial && store.storeCode) return store;
    const identity = await this.generateStoreIdentity();
    store.storeSerial = store.storeSerial || identity.storeSerial;
    store.storeCode = store.storeCode || identity.storeCode;
    return this.storeRepository.save(store);
  }

  /**
   * Resolve scanned serial/code → that store only (not marketplace home).
   */
  async resolveByScanCode(code: string): Promise<StoreScanResult> {
    const normalized = (code || '').trim().toUpperCase();
    if (!normalized || normalized.length < 6) {
      throw new BadRequestException('Invalid store code');
    }
    const compact = normalized.replace(/-/g, '');

    let store = await this.storeRepository.findOne({
      where: [
        { storeSerial: normalized },
        { storeCode: compact },
        { storeSerial: compact },
      ],
    });

    if (!store) {
      store = await this.storeRepository
        .createQueryBuilder('store')
        .where("UPPER(REPLACE(store.store_serial, '-', '')) = :c", { c: compact })
        .orWhere('UPPER(store.store_code) = :c', { c: compact })
        .getOne();
    }

    if (!store) {
      throw new NotFoundException('Store not found for this barcode / serial');
    }

    store = await this.ensureStoreIdentity(store);
    const serial = store.storeSerial!;

    return {
      id: store.id,
      name: store.name,
      slug: store.slug,
      storeSerial: serial,
      storeCode: store.storeCode!,
      logo: store.logo,
      scanUrl: this.buildScanUrl(serial),
      storePath: `/stores/${store.slug}`,
    };
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
      where: { ownerId: userId },
    });
    if (existingStore) {
      throw new ConflictException('User already owns a store');
    }

    const slug = await this.generateSlug(dto.name);
    const { storeSerial, storeCode } = await this.generateStoreIdentity();

    const store = this.storeRepository.create({
      ...dto,
      slug,
      storeSerial,
      storeCode,
      ownerId: userId,
      owner,
      status: StoreStatus.PENDING,
      rating: 0,
    });

    return this.storeRepository.save(store);
  }

  async findMine(userId: string): Promise<Store & { scanUrl: string }> {
    let store = await this.storeRepository.findOne({ where: { ownerId: userId } });
    if (!store) {
      throw new NotFoundException('You do not own a store yet');
    }
    store = await this.ensureStoreIdentity(store);
    return Object.assign(store, { scanUrl: this.buildScanUrl(store.storeSerial!) });
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
      relations: ['owner'],
    });

    if (!store) {
      throw new NotFoundException(`Store with ID "${id}" not found`);
    }

    return this.ensureStoreIdentity(store);
  }

  /**
   * Find a store by slug
   */
  async findBySlug(slug: string): Promise<Store> {
    const store = await this.storeRepository.findOne({
      where: { slug },
      relations: ['owner'],
    });

    if (!store) {
      throw new NotFoundException(`Store with slug "${slug}" not found`);
    }

    return this.ensureStoreIdentity(store);
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
    store.isActive = false;
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
    (store as any).coverImage = coverUrl;
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
      totalFollowers: (store as any).followersCount || 0,
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
    await this.findOne(storeId);
    void userId;
    return { following: true, followersCount: 0 };
  }

  /**
   * Get followers of a store
   */
  async getFollowers(storeId: string): Promise<{ count: number; followers: User[] }> {
    await this.findOne(storeId);
    return { count: 0, followers: [] };
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
    store.status = StoreStatus.ACTIVE;
    store.isActive = true;
    return this.storeRepository.save(store);
  }
}
