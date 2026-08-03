import { Product } from 'src/modules/products/entities/product.entity';

export class CartItemResponseDto {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  stock: number;

  constructor(product: Product, quantity: number) {
    this.productId = product.id;
    this.name = product.name;
    this.price = product.price;
    this.quantity = quantity;
    this.subtotal = product.price * quantity;
    this.stock = product.stock;
  }
}
