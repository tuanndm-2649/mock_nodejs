import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ProductsService } from '../modules/products/products.service';

interface FindActiveByIdsRequest {
  ids: number[];
}

interface ProductItem {
  id: number;
  name: string;
  price: number;
  stock: number;
}

interface FindActiveByIdsResponse {
  products: ProductItem[];
}

@Controller()
export class ProductsGrpcController {
  constructor(private readonly productsService: ProductsService) {}

  @GrpcMethod('ProductsService', 'FindActiveByIds')
  async findActiveByIds(
    request: FindActiveByIdsRequest,
  ): Promise<FindActiveByIdsResponse> {
    const products = await this.productsService.findActiveByIds(request.ids);

    return {
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock,
      })),
    };
  }
}
