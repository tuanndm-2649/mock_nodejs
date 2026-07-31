import { ProductImage } from '../entities/product-image.entity';

export class ProductImageResponseDto {
  id: number;
  imageUrl: string;
  fileType: string;
  fileSize: number;
  isMain: boolean;
  createdAt: Date;

  constructor(image: ProductImage) {
    this.id = image.id;
    this.imageUrl = image.imageUrl;
    this.fileType = image.fileType;
    this.fileSize = image.fileSize;
    this.isMain = image.isMain;
    this.createdAt = image.createdAt;
  }
}
