import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  DefaultValuePipe,
  ParseBoolPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { ProductResponseDto } from './dto/product-response.dto';
import { productImageMulterOptions } from 'src/config/upload.config';

@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(['admin'])
  @ApiCreatedResponse({ type: ProductResponseDto })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Public()
  @Get()
  findAll(@Query() query: FindProductsQueryDto) {
    return this.productsService.findAll(query);
  }

  @UseGuards(RolesGuard)
  @Roles(['admin'])
  @Get('all')
  findAllForAdmin(
    @Query() query: FindProductsQueryDto,
    @Query('getAll', new DefaultValuePipe(false), ParseBoolPipe)
    getAll: boolean,
  ) {
    return this.productsService.findAll(query, getAll);
  }

  @UseGuards(RolesGuard)
  @Roles(['admin'])
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @Post('images')
  @UseInterceptors(FileInterceptor('file', productImageMulterOptions))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.productsService.uploadImage(file);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOneOrFail(id);
  }

  @UseGuards(RolesGuard)
  @Roles(['admin'])
  @Get('all/:id')
  findOneForAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOneOrFail(id, true);
  }

  @UseGuards(RolesGuard)
  @Roles(['admin'])
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @UseGuards(RolesGuard)
  @Roles(['admin'])
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }

  @UseGuards(RolesGuard)
  @Roles(['admin'])
  @Delete(':id/images/:imageId')
  removeImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.productsService.removeImage(id, imageId);
  }
}
