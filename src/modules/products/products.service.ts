import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { I18nService } from 'nestjs-i18n';
import { extname } from 'path';
import { PaginationMetaDto } from 'src/common/dto/paginated-response.dto';
import { findEntityOrFail } from 'src/common/utils/find-entity-or-fail.util';
import { PRODUCT_IMAGES_PREFIX } from 'src/config/upload.config';
import {
  Between,
  DataSource,
  EntityManager,
  FindOptionsWhere,
  ILike,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { S3Service } from '../s3/s3.service';
import { CreateProductDto } from './dto/create-product.dto';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import { ProductImageResponseDto } from './dto/product-image-response.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductImage } from './entities/product-image.entity';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
    private readonly s3Service: S3Service,
  ) {}

  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    const { categoryId, imageIds = [], mainImageId, ...rest } = dto;

    await this.ensureCategoryExists(categoryId);

    const productId = await this.dataSource.transaction(async (manager) => {
      const product = manager.create(Product, {
        ...rest,
        category: { id: categoryId },
      });

      const saved = await manager.save(product);

      if (imageIds.length > 0) {
        await this.attachImages(manager, saved.id, imageIds);
      }

      if (mainImageId !== undefined) {
        await this.setMainImage(manager, saved.id, mainImageId);
      }

      return saved.id;
    });

    const created = await findEntityOrFail(
      this.productRepository,
      {
        where: { id: productId },
        relations: { category: true, images: true },
      },
      this.i18n.t('products.error.failedToCreate'),
    );

    const resolved = await this.resolveImageUrls(created);

    return new ProductResponseDto(resolved);
  }

  async findAll(
    query: FindProductsQueryDto,
    getAll: boolean = false,
  ): Promise<{ data: ProductResponseDto[]; meta: PaginationMetaDto }> {
    const baseWhere: FindOptionsWhere<Product> = {
      ...(getAll ? {} : { isActive: true }),
      ...(query.categoryId ? { category: { id: query.categoryId } } : {}),
      ...(query.isFeatured !== undefined
        ? { isFeatured: query.isFeatured }
        : {}),
      ...this.buildPriceWhere(query),
    };

    const where = query.search
      ? [
          { ...baseWhere, name: ILike(`%${query.search}%`) },
          { ...baseWhere, description: ILike(`%${query.search}%`) },
        ]
      : baseWhere;

    const [products, total] = await this.productRepository.findAndCount({
      where,
      skip: query.skip,
      take: query.limit,
      order: { createdAt: 'DESC' },
      relations: { category: true, images: true },
    });

    const resolved = await Promise.all(
      products.map((product) => this.resolveImageUrls(product)),
    );

    return {
      data: resolved.map((product) => new ProductResponseDto(product)),
      meta: new PaginationMetaDto(query.page, query.limit, total),
    };
  }

  private buildPriceWhere(
    query: FindProductsQueryDto,
  ): FindOptionsWhere<Product> {
    if (query.minPrice !== undefined && query.maxPrice !== undefined) {
      return { price: Between(query.minPrice, query.maxPrice) };
    }
    if (query.minPrice !== undefined) {
      return { price: MoreThanOrEqual(query.minPrice) };
    }
    if (query.maxPrice !== undefined) {
      return { price: LessThanOrEqual(query.maxPrice) };
    }
    return {};
  }

  async findOneOrFail(
    id: number,
    includeInactive: boolean = false,
  ): Promise<ProductResponseDto> {
    const product = await findEntityOrFail(
      this.productRepository,
      {
        where: { id, ...(includeInactive ? {} : { isActive: true }) },
        relations: { category: true, images: true },
      },
      this.i18n.t('products.error.notFound'),
    );

    const resolved = await this.resolveImageUrls(product);

    return new ProductResponseDto(resolved);
  }

  async findActiveByIds(ids: number[]): Promise<Product[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.productRepository.find({
      where: { id: In(ids), isActive: true },
      relations: { category: true },
    });
  }

  async update(id: number, dto: UpdateProductDto): Promise<ProductResponseDto> {
    const { categoryId, mainImageId, imageIds, ...rest } = dto;

    await this.dataSource.transaction(async (manager) => {
      const productRepository = manager.getRepository(Product);

      const product = await findEntityOrFail(
        productRepository,
        { where: { id } },
        this.i18n.t('products.error.notFound'),
      );

      Object.assign(product, rest);

      if (categoryId !== undefined) {
        await this.ensureCategoryExists(categoryId);
        product.category = { id: categoryId } as Category;
      }

      await productRepository.save(product);

      if (imageIds && imageIds.length > 0) {
        await this.attachImages(manager, id, imageIds);
      }

      if (mainImageId !== undefined) {
        await this.setMainImage(manager, id, mainImageId);
      }
    });

    const updated = await findEntityOrFail(
      this.productRepository,
      { where: { id }, relations: { category: true, images: true } },
      this.i18n.t('products.error.notFound'),
    );

    const resolved = await this.resolveImageUrls(updated);

    return new ProductResponseDto(resolved);
  }

  async remove(id: number): Promise<void> {
    const result = await this.productRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(this.i18n.t('products.error.notFound'));
    }
  }

  async uploadImage(
    file: Express.Multer.File,
  ): Promise<ProductImageResponseDto> {
    if (!file) {
      throw new BadRequestException(
        this.i18n.t('products.error.imageRequired'),
      );
    }

    const key = `${PRODUCT_IMAGES_PREFIX}/${randomUUID()}${extname(file.originalname)}`;
    await this.s3Service.uploadFile(key, file.buffer, file.mimetype);

    const image = this.productImageRepository.create({
      imageUrl: key,
      fileType: file.mimetype,
      fileSize: file.size,
      isMain: false,
    });

    const saved = await this.productImageRepository.save(image);
    const presignedUrl = await this.s3Service.getPressignedUrl(key);
    return new ProductImageResponseDto({ ...saved, imageUrl: presignedUrl });
  }

  async removeImage(productId: number, imageId: number): Promise<void> {
    const image = await findEntityOrFail(
      this.productImageRepository,
      { where: { id: imageId, product: { id: productId } } },
      this.i18n.t('products.error.imageNotFound'),
    );

    await this.productImageRepository.remove(image);
    await this.s3Service.deleteFile(image.imageUrl);
  }

  private async ensureCategoryExists(categoryId: number): Promise<void> {
    const exists = await this.categoryRepository.exists({
      where: { id: categoryId },
    });

    if (!exists) {
      throw new NotFoundException(
        this.i18n.t('products.error.categoryNotFound'),
      );
    }
  }

  private async attachImages(
    manager: EntityManager,
    productId: number,
    imageIds: number[],
  ): Promise<void> {
    const imageRepository = manager.getRepository(ProductImage);

    for (const imageId of imageIds) {
      const image = await findEntityOrFail(
        imageRepository,
        { where: { id: imageId }, relations: { product: true } },
        this.i18n.t('products.error.imageNotFound'),
      );

      if (image.product && image.product.id !== productId) {
        throw new BadRequestException(
          this.i18n.t('products.error.imageAlreadyAttached'),
        );
      }

      image.product = { id: productId } as Product;
      await imageRepository.save(image);
    }
  }

  private async setMainImage(
    manager: EntityManager,
    productId: number,
    imageId: number,
  ): Promise<void> {
    const imageRepository = manager.getRepository(ProductImage);

    const image = await findEntityOrFail(
      imageRepository,
      { where: { id: imageId, product: { id: productId } } },
      this.i18n.t('products.error.imageNotFound'),
    );

    await this.unsetMainImages(manager, productId);

    image.isMain = true;
    await imageRepository.save(image);
  }

  private async unsetMainImages(
    manager: EntityManager,
    productId: number,
  ): Promise<void> {
    await manager
      .getRepository(ProductImage)
      .update({ product: { id: productId } }, { isMain: false });
  }

  async findFeatured(): Promise<Product[]> {
    return this.productRepository.find({
      where: { isActive: true, isFeatured: true },
      order: { createdAt: 'DESC' },
    });
  }

  async resolveImageUrls(product: Product): Promise<Product> {
    const images = await Promise.all(
      product.images.map(async (img) => {
        return {
          ...img,
          imageUrl: await this.s3Service.getPressignedUrl(img.imageUrl),
        };
      }),
    );

    return { ...product, images };
  }
}
