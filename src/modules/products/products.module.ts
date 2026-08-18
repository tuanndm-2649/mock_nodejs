import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { Category } from '../categories/entities/category.entity';
import { S3Module } from '../s3/s3.module';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
  imports: [
    TypeOrmModule.forFeature([Product, ProductImage, Category]),
    S3Module,
  ],
})
export class ProductsModule {}
