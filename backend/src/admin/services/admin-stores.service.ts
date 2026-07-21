import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Store } from '../../stores/entities/store.entity';

export interface StoreQueryDto {
  page?: number;
  limit?: number;
  status?: string;
  verificationStatus?: string;
  search?: string;
  type?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable()
export class AdminStoresService {
  private readonly logger = new Logger(AdminStoresService.name);

  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  async findAll(query: StoreQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.verificationStatus) {
      where.verificationStatus = query.verificationStatus;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.search) {
      where.name = Like(`%${query.search}%`);
    }

    const [stores, total] = await this.storeRepository.findAndCount({
      where,
      order: { [query.sortBy || 'createdAt']: query.sortOrder || 'DESC' },
      skip,
      take: limit,
      relations: ['owner'],
    });

    return {
      success: true,
      data: stores,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const store = await this.storeRepository.findOne({
      where: { id },
      relations: ['owner', 'products', 'products.images'],
    });

    if (!store) {
      throw new NotFoundException({
        success: false,
        message: `Store with ID ${id} not found`,
      });
    }

    return {
      success: true,
      data: store,
    };
  }

  async verifyStore(id: string) {
    const store = await this.storeRepository.findOne({ where: { id } });

    if (!store) {
      throw new NotFoundException({
        success: false,
        message: `Store with ID ${id} not found`,
      });
    }

    await this.storeRepository.update(id, {
      verificationStatus: 'verified',
      status: 'active',
      verifiedAt: new Date(),
    });

    return {
      success: true,
      message: 'Store verified successfully',
      data: { id, verificationStatus: 'verified' },
    };
  }

  async updateStatus(id: string, status: 'active' | 'suspended' | 'rejected') {
    const store = await this.storeRepository.findOne({ where: { id } });

    if (!store) {
      throw new NotFoundException({
        success: false,
        message: `Store with ID ${id} not found`,
      });
    }

    const updateData: any = { status };
    if (status === 'rejected') {
      updateData.verificationStatus = 'rejected';
    }

    await this.storeRepository.update(id, updateData);

    return {
      success: true,
      message: `Store ${status === 'active' ? 'approved' : status === 'suspended' ? 'suspended' : 'rejected'} successfully`,
      data: { id, status },
    };
  }

  async getPendingVerifications() {
    const stores = await this.storeRepository.find({
      where: { verificationStatus: 'pending' },
      relations: ['owner'],
      order: { createdAt: 'ASC' },
    });

    return {
      success: true,
      data: stores,
      count: stores.length,
    };
  }

  async getStats() {
    const [
      totalStores,
      activeStores,
      suspendedStores,
      pendingStores,
      verifiedStores,
    ] = await Promise.all([
      this.storeRepository.count(),
      this.storeRepository.count({ where: { status: 'active' } }),
      this.storeRepository.count({ where: { status: 'suspended' } }),
      this.storeRepository.count({ where: { status: 'pending' } }),
      this.storeRepository.count({ where: { verificationStatus: 'verified' } }),
    ]);

    // New stores this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const newStoresThisMonth = await this.storeRepository.count({
      where: { createdAt: monthStart },
    });

    return {
      success: true,
      data: {
        totalStores,
        activeStores,
        suspendedStores,
        pendingStores,
        verifiedStores,
        newStoresThisMonth,
      },
    };
  }
}
