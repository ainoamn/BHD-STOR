import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../../src/modules/users/users.service';
import { User } from '../../src/modules/users/entities/user.entity';

/**
 * ============================================================================
 * UsersService Unit Tests
 * Tests: findAll, findOne, create, update, remove (soft delete)
 * ============================================================================
 */

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Repository<User>>;

  const mockUser: User = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    password: 'hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    firstNameAr: null,
    lastNameAr: null,
    phone: '+96891234567',
    avatar: null,
    role: 'customer',
    status: 'active',
    emailVerified: true,
    phoneVerified: false,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    lastLoginAt: null,
    metadata: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
  } as User;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getOne: jest.fn(),
    withDeleted: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ========================================================================
  // FIND ALL (Paginated)
  // ========================================================================
  describe('findAll()', () => {
    it('should return paginated users with default parameters', async () => {
      const users = [mockUser, { ...mockUser, id: 'user-2', email: 'user2@example.com' }];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([users, 2]);

      const result = await service.findAll({});

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
      expect(mockQueryBuilder.getManyAndCount).toHaveBeenCalled();

      expect(result).toEqual({
        data: users,
        meta: {
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });
    });

    it('should return paginated users with custom page and limit', async () => {
      const users = [mockUser];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([users, 50]);

      const result = await service.findAll({ page: 2, limit: 10 });

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);

      expect(result.meta).toEqual({
        total: 50,
        page: 2,
        limit: 10,
        totalPages: 5,
      });
    });

    it('should filter users by role', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockUser], 1]);

      await service.findAll({ role: 'customer' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.role = :role',
        { role: 'customer' },
      );
    });

    it('should filter users by status', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockUser], 1]);

      await service.findAll({ status: 'active' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.status = :status',
        { status: 'active' },
      );
    });

    it('should search users by query string', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockUser], 1]);

      await service.findAll({ search: 'test' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        { search: '%test%' },
      );
    });

    it('should apply sorting by createdAt desc by default', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockUser], 1]);

      await service.findAll({});

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'user.createdAt',
        'DESC',
      );
    });

    it('should apply custom sorting', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockUser], 1]);

      await service.findAll({ sortBy: 'firstName', sortOrder: 'ASC' });

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'user.firstName',
        'ASC',
      );
    });

    it('should not include soft-deleted users by default', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockUser], 1]);

      await service.findAll({});

      expect(mockQueryBuilder.withDeleted).not.toHaveBeenCalled();
    });

    it('should include soft-deleted users when withDeleted is true', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[{ ...mockUser, deletedAt: new Date() }], 1]);

      await service.findAll({ withDeleted: true });

      expect(mockQueryBuilder.withDeleted).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // FIND ONE
  // ========================================================================
  describe('findOne()', () => {
    it('should return user by id', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockUser);

      const result = await service.findOne(mockUser.id);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('user.id = :id', { id: mockUser.id });
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent-id')).rejects.toThrow('User not found');
    });

    it('should return user with relations', async () => {
      const userWithStores = {
        ...mockUser,
        stores: [],
        orders: [],
      };
      mockQueryBuilder.getOne.mockResolvedValue(userWithStores);

      const result = await service.findOne(mockUser.id, ['stores', 'orders']);

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('user.stores', 'stores');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('user.orders', 'orders');
      expect(result).toEqual(userWithStores);
    });
  });

  // ========================================================================
  // FIND BY EMAIL
  // ========================================================================
  describe('findByEmail()', () => {
    it('should return user by email', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null for non-existent email', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  // ========================================================================
  // FIND BY ID
  // ========================================================================
  describe('findById()', () => {
    it('should return user by id', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById(mockUser.id);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(result).toEqual(mockUser);
    });
  });

  // ========================================================================
  // CREATE
  // ========================================================================
  describe('create()', () => {
    const createDto = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      firstName: 'New',
      lastName: 'User',
      phone: '+96891234567',
      role: 'customer' as const,
    };

    it('should create a new user', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockUser);
      repository.save.mockResolvedValue(mockUser);

      const result = await service.create(createDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: [{ email: createDto.email }, { phone: createDto.phone }],
      });
      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining(createDto));
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException for duplicate email', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createDto)).rejects.toThrow('Email or phone already exists');
    });

    it('should throw ConflictException for duplicate phone', async () => {
      repository.findOne.mockResolvedValue({ ...mockUser, email: 'different@example.com' });

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should hash password before saving', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockImplementation((dto) => dto as User);
      repository.save.mockImplementation((user) => Promise.resolve(user as User));

      const result = await service.create(createDto);

      expect(result.password).not.toBe(createDto.password);
      expect(result.password).toMatch(/^\$2[aby]\$/);
    });

    it('should set default role to customer if not provided', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockImplementation((dto) => dto as User);
      repository.save.mockImplementation((user) => Promise.resolve(user as User));

      const { role, ...dtoWithoutRole } = createDto;
      await service.create(dtoWithoutRole as any);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'customer' }),
      );
    });
  });

  // ========================================================================
  // UPDATE
  // ========================================================================
  describe('update()', () => {
    const updateDto = {
      firstName: 'Updated',
      lastName: 'Name',
      phone: '+96892345678',
    };

    it('should update user fields', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockUser);
      repository.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      const result = await service.update(mockUser.id, updateDto);

      expect(repository.update).toHaveBeenCalledWith(mockUser.id, updateDto);
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException for non-existent user', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should hash password if provided in update', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockUser);
      repository.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      await service.update(mockUser.id, { password: 'NewPassword123!' });

      const updateCall = (repository.update as jest.Mock).mock.calls[0][1];
      expect(updateCall.password).not.toBe('NewPassword123!');
      expect(updateCall.password).toMatch(/^\$2[aby]\$/);
    });

    it('should not allow updating email to an existing email', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockUser);
      repository.findOne.mockResolvedValue({ ...mockUser, id: 'different-id' });

      await expect(
        service.update(mockUser.id, { email: 'existing@example.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ========================================================================
  // REMOVE (Soft Delete)
  // ========================================================================
  describe('remove()', () => {
    it('should soft delete user', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockUser);
      repository.softDelete.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      await service.remove(mockUser.id);

      expect(repository.softDelete).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should not allow deleting super_admin', async () => {
      mockQueryBuilder.getOne.mockResolvedValue({ ...mockUser, role: 'super_admin' });

      await expect(service.remove(mockUser.id)).rejects.toThrow(BadRequestException);
      await expect(service.remove(mockUser.id)).rejects.toThrow(
        'Cannot delete super admin user',
      );
    });
  });

  // ========================================================================
  // RESTORE
  // ========================================================================
  describe('restore()', () => {
    it('should restore soft-deleted user', async () => {
      repository.restore.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      await service.restore(mockUser.id);

      expect(repository.restore).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw NotFoundException if no user to restore', async () => {
      repository.restore.mockResolvedValue({ affected: 0, raw: [], generatedMaps: [] });

      await expect(service.restore('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  // ========================================================================
  // COUNT
  // ========================================================================
  describe('count()', () => {
    it('should return total user count', async () => {
      repository.count.mockResolvedValue(150);

      const result = await service.count();

      expect(repository.count).toHaveBeenCalled();
      expect(result).toBe(150);
    });

    it('should return count filtered by role', async () => {
      repository.count.mockResolvedValue(30);

      const result = await service.count({ role: 'store_owner' });

      expect(repository.count).toHaveBeenCalledWith({
        where: { role: 'store_owner' },
      });
      expect(result).toBe(30);
    });
  });
});
