import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsInt()
  categoryId!: number;

  @IsString()
  @MaxLength(1000)
  description!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @IsInt()
  @Min(0)
  stock!: number;

  @IsBoolean()
  isFeatured!: boolean;

  @IsBoolean()
  isActive!: boolean;

  @ApiPropertyOptional({
    type: [Number],
    description: 'IDs of images uploaded via POST /products/images',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  imageIds?: number[];

  @ApiPropertyOptional({ description: 'Set this image as the main image' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  mainImageId?: number;
}
