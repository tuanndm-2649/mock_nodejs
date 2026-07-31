import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { PaginationMetaDto } from 'src/common/dto/paginated-response.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { findEntityOrFail } from 'src/common/utils/find-entity-or-fail.util';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly i18n: I18nService,
  ) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    const nameExists = await this.categoryRepository.exists({
      where: { name: dto.name },
    });

    if (nameExists) {
      throw new ConflictException(this.i18n.t('categories.error.nameExists'));
    }

    const category = this.categoryRepository.create(dto);

    return this.categoryRepository.save(category);
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<{ data: Category[]; meta: PaginationMetaDto }> {
    const [categories, total] = await this.categoryRepository.findAndCount({
      skip: query.skip,
      take: query.limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: categories,
      meta: new PaginationMetaDto(query.page, query.limit, total),
    };
  }

  findOneOrFail(id: number): Promise<Category> {
    return findEntityOrFail(
      this.categoryRepository,
      { where: { id } },
      this.i18n.t('categories.error.notFound'),
    );
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await findEntityOrFail(
      this.categoryRepository,
      { where: { id } },
      this.i18n.t('categories.error.notFound'),
    );

    if (dto.name) {
      const nameExists = await this.categoryRepository.exists({
        where: { name: dto.name },
      });

      if (nameExists && dto.name !== category.name) {
        throw new ConflictException(this.i18n.t('categories.error.nameExists'));
      }

      category.name = dto.name;
    }

    if (dto.description !== undefined) {
      category.description = dto.description;
    }

    return this.categoryRepository.save(category);
  }

  async remove(id: number): Promise<void> {
    const result = await this.categoryRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(this.i18n.t('categories.error.notFound'));
    }
  }
}
