import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export interface UserQueryDto {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(query: UserQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.role) {
      where.role = query.role;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.name = Like(`%${query.search}%`);
    }

    const [users, total] = await this.userRepository.findAndCount({
      where,
      order: { [query.sortBy || 'createdAt']: query.sortOrder || 'DESC' },
      skip,
      take: limit,
      select: [
        'id',
        'name',
        'email',
        'phone',
        'role',
        'status',
        'avatar',
        'isEmailVerified',
        'createdAt',
        'updatedAt',
      ],
    });

    return {
      success: true,
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['stores', 'orders', 'subscription'],
      select: [
        'id',
        'name',
        'email',
        'phone',
        'role',
        'status',
        'avatar',
        'bio',
        'address',
        'isEmailVerified',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException({
        success: false,
        message: `User with ID ${id} not found`,
      });
    }

    return {
      success: true,
      data: user,
    };
  }

  async update(id: string, data: Partial<User>) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException({
        success: false,
        message: `User with ID ${id} not found`,
      });
    }

    // Prevent changing sensitive fields directly
    delete (data as any).password;
    delete (data as any).id;

    await this.userRepository.update(id, data);

    const updatedUser = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'name',
        'email',
        'phone',
        'role',
        'status',
        'avatar',
        'bio',
        'createdAt',
        'updatedAt',
      ],
    });

    return {
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    };
  }

  async updateStatus(id: string, status: 'active' | 'suspended' | 'inactive') {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException({
        success: false,
        message: `User with ID ${id} not found`,
      });
    }

    await this.userRepository.update(id, { status });

    return {
      success: true,
      message: `User ${status === 'active' ? 'activated' : status === 'suspended' ? 'suspended' : 'deactivated'} successfully`,
      data: { id, status },
    };
  }

  async getStats() {
    const [totalUsers, activeUsers, suspendedUsers, inactiveUsers] =
      await Promise.all([
        this.userRepository.count(),
        this.userRepository.count({ where: { status: 'active' } }),
        this.userRepository.count({ where: { status: 'suspended' } }),
        this.userRepository.count({ where: { status: 'inactive' } }),
      ]);

    // Users by role
    const roles = ['buyer', 'seller', 'admin', 'super_admin'];
    const byRole: Record<string, number> = {};

    for (const role of roles) {
      byRole[role] = await this.userRepository.count({ where: { role } });
    }

    // New users this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const newUsersThisMonth = await this.userRepository.count({
      where: { createdAt: monthStart },
    });

    return {
      success: true,
      data: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        inactiveUsers,
        byRole,
        newUsersThisMonth,
      },
    };
  }

  async bulkUpdateStatus(ids: string[], status: 'active' | 'suspended' | 'inactive') {
    if (!ids || ids.length === 0) {
      throw new NotFoundException({
        success: false,
        message: 'No user IDs provided',
      });
    }

    await this.userRepository.update(
      { id: In(ids) },
      { status },
    );

    return {
      success: true,
      message: `${ids.length} user(s) ${status === 'active' ? 'activated' : status === 'suspended' ? 'suspended' : 'deactivated'} successfully`,
      data: { affectedCount: ids.length, status },
    };
  }
}
