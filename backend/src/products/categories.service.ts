import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository, ILike } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  /**
   * Create a new category
   */
  async create(dto: CreateCategoryDto): Promise<Category> {
    let parent: Category | null = null;

    if (dto.parentId) {
      parent = await this.categoryRepository.findOne({ where: { id: dto.parentId } });
      if (!parent) {
        throw new NotFoundException(`Parent category with ID "${dto.parentId}" not found`);
      }
    }

    const existingCategory = await this.categoryRepository.findOne({
      where: { name: dto.name },
    });
    if (existingCategory) {
      throw new ConflictException(`Category with name "${dto.name}" already exists`);
    }

    const category = this.categoryRepository.create({
      ...dto,
      parent,
      isActive: dto.isActive ?? true,
    });

    return this.categoryRepository.save(category);
  }

  /**
   * Find all categories with optional tree structure
   */
  async findAll(withTree: boolean = false): Promise<Category[]> {
    if (withTree) {
      const categories = await this.categoryRepository.find({
        where: { parent: null },
        relations: ['children', 'children.children'],
        order: { sortOrder: 'ASC', name: 'ASC' },
      });
      return categories;
    }

    return this.categoryRepository.find({
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  /**
   * Find category by ID
   */
  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'children', 'products'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    return category;
  }

  /**
   * Find category by slug
   */
  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { slug },
      relations: ['parent', 'children', 'products'],
    });

    if (!category) {
      throw new NotFoundException(`Category with slug "${slug}" not found`);
    }

    return category;
  }

  /**
   * Search categories by name
   */
  async search(query: string): Promise<Category[]> {
    return this.categoryRepository.find({
      where: [
        { name: ILike(`%${query}%`) },
        { nameEn: ILike(`%${query}%`) },
      ],
      order: { name: 'ASC' },
    });
  }

  /**
   * Update a category
   */
  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    if (dto.parentId && dto.parentId === id) {
      throw new ConflictException('Category cannot be its own parent');
    }

    if (dto.parentId) {
      const parent = await this.categoryRepository.findOne({ where: { id: dto.parentId } });
      if (!parent) {
        throw new NotFoundException(`Parent category with ID "${dto.parentId}" not found`);
      }
      category.parent = parent;
    }

    if (dto.parentId === null) {
      category.parent = null;
    }

    Object.assign(category, dto);
    return this.categoryRepository.save(category);
  }

  /**
   * Soft delete a category
   */
  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);

    if (category.children && category.children.length > 0) {
      throw new ConflictException('Cannot delete category with subcategories');
    }

    category.isActive = false;
    category.deletedAt = new Date();
    await this.categoryRepository.save(category);
  }

  /**
   * Get category tree (nested structure)
   */
  async getTree(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { parent: null },
      relations: ['children', 'children.children', 'children.children.children'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  /**
   * Get category path (breadcrumb)
   */
  async getCategoryPath(id: string): Promise<Category[]> {
    const category = await this.findOne(id);
    const path: Category[] = [category];

    let current = category;
    while (current.parent) {
      const parent = await this.categoryRepository.findOne({
        where: { id: current.parent.id },
        relations: ['parent'],
      });
      if (parent) {
        path.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }

    return path;
  }
}
