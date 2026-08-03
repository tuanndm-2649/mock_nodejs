import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

@Module({
  controllers: [CartController],
  providers: [CartService],
  imports: [ProductsModule],
})
export class CartModule {}
