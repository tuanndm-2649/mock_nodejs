import { Product } from '../entities/product.entity';
import { ProductImageResponseDto } from './product-image-response.dto';

class ProductCategoryDto {
  id: number;
  name: string;

  constructor(category: Product['category']) {
    this.id = category.id;
    this.name = category.name;
  }
}

export class ProductResponseDto {
  id: number;
  name: string;
  description: string;
  category: ProductCategoryDto;
  images: ProductImageResponseDto[];
  price: number;
  stock: number;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;

  constructor(product: Product) {
    this.id = product.id;
    this.name = product.name;
    this.description = product.description;
    this.category = new ProductCategoryDto(product.category);
    this.images = (product.images ?? []).map(
      (image) => new ProductImageResponseDto(image),
    );
    this.price = product.price;
    this.stock = product.stock;
    this.isFeatured = product.isFeatured;
    this.isActive = product.isActive;
    this.createdAt = product.createdAt;
  }
}
