import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { User, UserRole, UserStatus } from './entities/user.entity';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface PaginatedUsers {
  data: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Get all users with pagination and filtering
   */
  async findAll(options: PaginationOptions = {}): Promise<PaginatedUsers> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      search,
      role,
      status,
    } = options;

    const queryBuilder = this.userRepository.createQueryBuilder('user')
      .where('user.deletedAt IS NULL');

    // Apply filters
    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply sorting
    const validSortColumns = ['createdAt', 'updatedAt', 'email', 'firstName', 'lastName', 'role'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`user.${sortColumn}`, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Select specific fields (exclude password)
    queryBuilder.select([
      'user.id',
      'user.email',
      'user.firstName',
      'user.lastName',
      'user.phone',
      'user.role',
      'user.status',
      'user.emailVerified',
      'user.phoneVerified',
      'user.avatar',
      'user.lastLoginAt',
      'user.preferredLanguage',
      'user.preferredCurrency',
      'user.createdAt',
      'user.updatedAt',
    ]);

    const [users, total] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    this.logger.debug(`Found ${total} users`, 'UsersService');

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get user by ID with all relations
   */
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, deletedAt: null },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'phone',
        'role',
        'status',
        'emailVerified',
        'phoneVerified',
        'twoFactorEnabled',
        'avatar',
        'lastLoginAt',
        'preferredLanguage',
        'preferredCurrency',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Get user by email (includes password for auth)
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .andWhere('user.deleted_at IS NULL')
      .getOne();
  }

  /**
   * Find user by reset token
   */
  async findByResetToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { resetToken: token, deletedAt: null },
    });
  }

  /**
   * Create a new user
   */
  async create(userData: Partial<User>): Promise<User> {
    // Check if email already exists
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictException(`Email ${userData.email} is already registered`);
    }

    const user = this.userRepository.create(userData);
    const savedUser = await this.userRepository.save(user);

    this.logger.log(`Created user: ${savedUser.email}`, 'UsersService');

    return savedUser;
  }

  /**
   * Update user
   */
  async update(id: string, updateData: Partial<User>): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check if email is being changed and is unique
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.findByEmail(updateData.email);
      if (existingUser) {
        throw new ConflictException(`Email ${updateData.email} is already in use`);
      }
    }

    // Prevent password updates through this method
    delete updateData.password;

    Object.assign(user, updateData);
    const updatedUser = await this.userRepository.save(user);

    this.logger.log(`Updated user: ${updatedUser.email}`, 'UsersService');

    return updatedUser;
  }

  /**
   * Soft delete user
   */
  async remove(id: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.userRepository.softDelete(id);

    this.logger.log(`Soft deleted user: ${user.email}`, 'UsersService');

    return { message: 'User deleted successfully' };
  }

  /**
   * Hard delete user (admin only)
   */
  async hardDelete(id: string): Promise<{ message: string }> {
    const result = await this.userRepository.delete(id);

    if (result.affected === 0) {
      throw NotFoundException(`User with ID ${id} not found`);
    }

    this.logger.log(`Hard deleted user: ${id}`, 'UsersService');

    return { message: 'User permanently deleted' };
  }

  /**
   * Update user avatar
   */
  async updateAvatar(id: string, avatarUrl: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.avatar = avatarUrl;
    const updatedUser = await this.userRepository.save(user);

    this.logger.log(`Updated avatar for user: ${user.email}`, 'UsersService');

    return updatedUser;
  }

  /**
   * Update user status
   */
  async updateStatus(id: string, status: UserStatus): Promise<User> {
    const validStatuses = Object.values(UserStatus);
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const user = await this.userRepository.findOne({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.status = status;
    const updatedUser = await this.userRepository.save(user);

    this.logger.log(`Updated status for user ${user.email} to ${status}`, 'UsersService');

    return updatedUser;
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLoginAt: new Date() });
  }

  /**
   * Update password
   */
  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.userRepository.update(id, { password: hashedPassword });
    this.logger.log(`Updated password for user: ${id}`, 'UsersService');
  }

  /**
   * Update reset token
   */
  async updateResetToken(
    id: string,
    hashedToken: string,
    expiry: Date,
  ): Promise<void> {
    await this.userRepository.update(id, {
      resetToken: hashedToken,
      resetTokenExpiry: expiry,
    });
  }

  /**
   * Clear reset token
   */
  async clearResetToken(id: string): Promise<void> {
    await this.userRepository.update(id, {
      resetToken: null,
      resetTokenExpiry: null,
    });
  }

  /**
   * Count users by role
   */
  async countByRole(role: UserRole): Promise<number> {
    return this.userRepository.count({
      where: { role, deletedAt: null },
    });
  }

  /**
   * Get user statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byRole: Record<string, number>;
    byStatus: Record<string, number>;
    recentlyJoined: number;
  }> {
    const total = await this.userRepository.count({ where: { deletedAt: null } });

    const roles = Object.values(UserRole);
    const byRole: Record<string, number> = {};
    for (const role of roles) {
      byRole[role] = await this.userRepository.count({
        where: { role, deletedAt: null },
      });
    }

    const statuses = Object.values(UserStatus);
    const byStatus: Record<string, number> = {};
    for (const status of statuses) {
      byStatus[status] = await this.userRepository.count({
        where: { status, deletedAt: null },
      });
    }

    // Users joined in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentlyJoined = await this.userRepository.count({
      where: {
        deletedAt: null,
        createdAt: thirtyDaysAgo,
      },
    });

    return { total, byRole, byStatus, recentlyJoined };
  }
}
