import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ProductsService } from '../../src/modules/products/products.service';
import { Product } from '../../src/modules/products/entities/product.entity';
import { StoresService } from '../../src/modules/stores/stores.service';
import { CategoriesService } from '../../src/modules/categories/categories.service';
import { ElasticsearchService } from '@nestjs/elasticsearch';

/**
 * ============================================================================
 * ProductsService Unit Tests
 * Tests: create, findAll, findOne, update, remove, search
 * ============================================================================
 */

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository: jest.Mocked<Repository<Product>>;
  let storesService: jest.Mocked<Partial<StoresService>>;
  let categoriesService: jest.Mocked<Partial<CategoriesService>>;
  let elasticsearchService: jest.Mocked<Partial<ElasticsearchService>>;

  const mockProduct: Product = {
    id: 'prod-001',
    storeId: 'store-001',
    categoryId: 'cat-001',
    name: 'iPhone 15 Pro',
    nameAr: 'آيفون 15 برو',
    slug: 'iphone-15-pro-256gb',
    description: 'Latest iPhone with advanced features',
    descriptionAr: 'أحدث آيفون مع ميزات متقدمة',
    sku: 'APL-IP15P-256',
    barcode: '194253800001',
    price: 449.000,
    compareAtPrice: 475.000,
    costPrice: 380.000,
    currencyCode: 'OMR',
    quantity: 50,
    minOrderQuantity: 1,
    weight: 0.206,
    weightUnit: 'kg',
    status: 'active',
    isFeatured: true,
    images: [
      { url: '/uploads/products/iphone-1.jpg', alt: 'iPhone Front', order: 0 },
      { url: '/uploads/products/iphone-2.jpg', alt: 'iPhone Back', order: 1 },
    ],
    attributes: { color: 'Blue Titanium', storage: '256GB' },
    seoTitle: 'iPhone 15 Pro - Buy Online in Oman',
    seoDescription: 'Shop iPhone 15 Pro at best price in Oman',
    searchVector: '',
    metadata: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    store: null,
    category: null,
    orderItems: [],
  } as unknown as Product;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
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
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    storesService = {
      findOne: jest.fn(),
      validateStoreOwnership: jest.fn(),
    };

    categoriesService = {
      findOne: jest.fn(),
    };

    elasticsearchService = {
      index: jest.fn(),
      search: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: mockRepo },
        { provide: StoresService, useValue: storesService },
        { provide: CategoriesService, useValue: categoriesService },
        { provide: ElasticsearchService, useValue: elasticsearchService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepository = module.get(getRepositoryToken(Product));
    storesService = module.get(StoresService);
    categoriesService = module.get(CategoriesService);
    elasticsearchService = module.get(ElasticsearchService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ========================================================================
  // CREATE
  // ========================================================================
  describe('create()', () => {
    const createDto = {
      storeId: 'store-001',
      categoryId: 'cat-001',
      name: 'Samsung Galaxy S24',
      nameAr: 'سامسونج جالاكسي S24',
      description: 'Samsung flagship smartphone',
      descriptionAr: 'هاتف سامسونج الرائد',
      sku: 'SAM-S24-128',
      price: 349.000,
      compareAtPrice: 379.000,
      quantity: 30,
      weight: 0.167,
      status: 'active' as const,
      isFeatured: false,
      images: [{ url: '/uploads/products/s24-1.jpg', alt: 'Galaxy S24', order: 0 }],
      attributes: { color: 'Phantom Black', storage: '128GB' },
    };

    it('should create product with auto-generated slug', async () => {
      storesService.findOne.mockResolvedValue({ id: 'store-001', status: 'active' } as any);
      categoriesService.findOne.mockResolvedValue({ id: 'cat-001' } as any);
      productRepository.create.mockReturnValue(mockProduct);
      productRepository.save.mockResolvedValue(mockProduct);
      elasticsearchService.index.mockResolvedValue({ result: 'created' } as any);

      const result = await service.create(createDto);

      expect(productRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: expect.stringContaining('samsung-galaxy-s24'),
        }),
      );
      expect(result).toBeDefined();
    });

    it('should create product with provided slug', async () => {
      const dtoWithSlug = { ...createDto, slug: 'custom-samsung-s24-slug' };
      storesService.findOne.mockResolvedValue({ id: 'store-001' } as any);
      categoriesService.findOne.mockResolvedValue({ id: 'cat-001' } as any);
      productRepository.create.mockReturnValue(mockProduct);
      productRepository.save.mockResolvedValue(mockProduct);

      await service.create(dtoWithSlug);

      expect(productRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'custom-samsung-s24-slug' }),
      );
    });

    it('should throw NotFoundException for non-existent store', async () => {
      storesService.findOne.mockRejectedValue(new NotFoundException('Store not found'));

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for inactive store', async () => {
      storesService.findOne.mockResolvedValue({ id: 'store-001', status: 'suspended' } as any);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto)).rejects.toThrow('Store is not active');
    });

    it('should index product in Elasticsearch', async () => {
      storesService.findOne.mockResolvedValue({ id: 'store-001', status: 'active' } as any);
      categoriesService.findOne.mockResolvedValue({ id: 'cat-001' } as any);
      productRepository.create.mockReturnValue(mockProduct);
      productRepository.save.mockResolvedValue(mockProduct);
      elasticsearchService.index.mockResolvedValue({ result: 'created' } as any);

      await service.create(createDto);

      expect(elasticsearchService.index).toHaveBeenCalledWith(
        expect.objectContaining({
          index: 'products',
          id: mockProduct.id,
        }),
      );
    });

    it('should generate unique slug if duplicate exists', async () => {
      storesService.findOne.mockResolvedValue({ id: 'store-001', status: 'active' } as any);
      categoriesService.findOne.mockResolvedValue({ id: 'cat-001' } as any);
      
      let callCount = 0;
      productRepository.findOneBy = jest.fn().mockImplementation(() => {
        callCount++;
        return callCount === 1 ? mockProduct : null;
      });
      productRepository.create.mockReturnValue(mockProduct);
      productRepository.save.mockResolvedValue(mockProduct);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
    });
  });

  // ========================================================================
  // FIND ALL (Paginated with Filters)
  // ========================================================================
  describe('findAll()', () => {
    it('should return paginated products', async () => {
      const products = [mockProduct, { ...mockProduct, id: 'prod-002' }];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([products, 2]);

      const result = await service.findAll({});

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });

    it('should filter by storeId', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockProduct], 1]);

      await service.findAll({ storeId: 'store-001' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.storeId = :storeId',
        { storeId: 'store-001' },
      );
    });

    it('should filter by categoryId', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockProduct], 1]);

      await service.findAll({ categoryId: 'cat-001' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.categoryId = :categoryId',
        { categoryId: 'cat-001' },
      );
    });

    it('should filter by status', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockProduct], 1]);

      await service.findAll({ status: 'active' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.status = :status',
        { status: 'active' },
      );
    });

    it('should filter by price range', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockProduct], 1]);

      await service.findAll({ minPrice: 100, maxPrice: 500 });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.price >= :minPrice',
        { minPrice: 100 },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.price <= :maxPrice',
        { maxPrice: 500 },
      );
    });

    it('should filter featured products', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockProduct], 1]);

      await service.findAll({ isFeatured: true });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.isFeatured = :isFeatured',
        { isFeatured: true },
      );
    });

    it('should apply search filter', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockProduct], 1]);

      await service.findAll({ search: 'iphone' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        { search: '%iphone%' },
      );
    });

    it('should apply sorting', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockProduct], 1]);

      await service.findAll({ sortBy: 'price', sortOrder: 'ASC' });

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'product.price',
        'ASC',
      );
    });

    it('should include store and category relations', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockProduct], 1]);

      await service.findAll({});

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('product.store', 'store');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('product.category', 'category');
    });
  });

  // ========================================================================
  // FIND ONE
  // ========================================================================
  describe('findOne()', () => {
    it('should return product by id with relations', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockProduct);

      const result = await service.findOne(mockProduct.id);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'product.id = :id',
        { id: mockProduct.id },
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('product.store', 'store');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('product.category', 'category');
      expect(result).toEqual(mockProduct);
    });

    it('should return product by slug', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockProduct);

      const result = await service.findOne('slug', mockProduct.slug);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'product.slug = :slug',
        { slug: mockProduct.slug },
      );
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException for non-existent product', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent')).rejects.toThrow('Product not found');
    });
  });

  // ========================================================================
  // FIND BY SLUG
  // ========================================================================
  describe('findBySlug()', () => {
    it('should return product by slug', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockProduct);

      const result = await service.findBySlug('iphone-15-pro-256gb');

      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException for non-existent slug', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.findBySlug('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  // ========================================================================
  // UPDATE
  // ========================================================================
  describe('update()', () => {
    const updateDto = {
      name: 'iPhone 15 Pro Updated',
      price: 429.000,
      quantity: 45,
    };

    it('should update product fields', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockProduct);
      productRepository.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
      elasticsearchService.index.mockResolvedValue({ result: 'updated' } as any);

      const result = await service.update(mockProduct.id, updateDto, 'store-001');

      expect(productRepository.update).toHaveBeenCalledWith(
        mockProduct.id,
        expect.objectContaining(updateDto),
      );
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException for non-existent product', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent', updateDto, 'store-001'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for non-owner update', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockProduct);

      await expect(
        service.update(mockProduct.id, updateDto, 'different-store'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.update(mockProduct.id, updateDto, 'different-store'),
      ).rejects.toThrow('You can only update products from your own store');
    });

    it('should update slug when name changes', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockProduct);
      productRepository.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
      elasticsearchService.index.mockResolvedValue({ result: 'updated' } as any);

      await service.update(mockProduct.id, { name: 'New Product Name' }, 'store-001');

      const updateCall = (productRepository.update as jest.Mock).mock.calls[0][1];
      expect(updateCall.slug).toBeDefined();
    });

    it('should reindex in Elasticsearch after update', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockProduct);
      productRepository.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
      elasticsearchService.index.mockResolvedValue({ result: 'updated' } as any);

      await service.update(mockProduct.id, updateDto, 'store-001');

      expect(elasticsearchService.index).toHaveBeenCalled();
    });

    it('should allow admin to update any product', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockProduct);
      productRepository.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
      elasticsearchService.index.mockResolvedValue({ result: 'updated' } as any);

      await expect(
        service.update(mockProduct.id, updateDto, 'different-store', 'super_admin'),
      ).resolves.not.toThrow(ForbiddenException);
    });
  });

  // ========================================================================
  // REMOVE (Soft Delete)
  // ========================================================================
  describe('remove()', () => {
    it('should soft delete product', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockProduct);
      productRepository.softDelete.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
      elasticsearchService.delete.mockResolvedValue({ result: 'deleted' } as any);

      await service.remove(mockProduct.id, 'store-001');

      expect(productRepository.softDelete).toHaveBeenCalledWith(mockProduct.id);
      expect(elasticsearchService.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          index: 'products',
          id: mockProduct.id,
        }),
      );
    });

    it('should throw NotFoundException for non-existent product', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.remove('non-existent', 'store-001')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for non-owner deletion', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockProduct);

      await expect(service.remove(mockProduct.id, 'different-store')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should remove from Elasticsearch index', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockProduct);
      productRepository.softDelete.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
      elasticsearchService.delete.mockResolvedValue({ result: 'deleted' } as any);

      await service.remove(mockProduct.id, 'store-001');

      expect(elasticsearchService.delete).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // SEARCH (Elasticsearch)
  // ========================================================================
  describe('search()', () => {
    it('should search products via Elasticsearch', async () => {
      elasticsearchService.search.mockResolvedValue({
        hits: {
          total: { value: 1 },
          hits: [
            {
              _id: 'prod-001',
              _source: {
                name: 'iPhone 15 Pro',
                price: 449.000,
                status: 'active',
              },
            },
          ],
        },
      } as any);

      const result = await service.search('iphone');

      expect(elasticsearchService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          index: 'products',
          body: expect.objectContaining({
            query: expect.any(Object),
          }),
        }),
      );
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should handle empty search results', async () => {
      elasticsearchService.search.mockResolvedValue({
        hits: {
          total: { value: 0 },
          hits: [],
        },
      } as any);

      const result = await service.search('nonexistent-product');

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });

    it('should apply filters to search', async () => {
      elasticsearchService.search.mockResolvedValue({
        hits: {
          total: { value: 1 },
          hits: [{ _id: 'prod-001', _source: {} }],
        },
      } as any);

      await service.search('iphone', { storeId: 'store-001', minPrice: 100 });

      expect(elasticsearchService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                filter: expect.arrayContaining([
                  expect.objectContaining({ term: { storeId: 'store-001' } }),
                  expect.objectContaining({ range: { price: { gte: 100 } } }),
                ]),
              }),
            }),
          }),
        }),
      );
    });

    it('should apply pagination to search', async () => {
      elasticsearchService.search.mockResolvedValue({
        hits: {
          total: { value: 100 },
          hits: [],
        },
      } as any);

      await service.search('phone', {}, { page: 2, limit: 10 });

      expect(elasticsearchService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            from: 10,
            size: 10,
          }),
        }),
      );
    });
  });

  // ========================================================================
  // GET FEATURED PRODUCTS
  // ========================================================================
  describe('getFeatured()', () => {
    it('should return featured products', async () => {
      const featured = [mockProduct];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([featured, 1]);

      const result = await service.getFeatured({});

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.isFeatured = :isFeatured',
        { isFeatured: true },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.status = :status',
        { status: 'active' },
      );
      expect(result.data).toEqual(featured);
    });
  });

  // ========================================================================
  // GET STORE PRODUCTS
  // ========================================================================
  describe('getStoreProducts()', () => {
    it('should return products for a specific store', async () => {
      const products = [mockProduct];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([products, 1]);

      const result = await service.getStoreProducts('store-001', {});

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.storeId = :storeId',
        { storeId: 'store-001' },
      );
      expect(result.data).toEqual(products);
    });
  });
});
