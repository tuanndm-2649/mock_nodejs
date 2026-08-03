import { CartItemResponseDto } from './cart-item-response.dto';

export class CartResponseDto {
  items: CartItemResponseDto[];
  totalItems: number;
  totalPrice: number;

  constructor(items: CartItemResponseDto[]) {
    this.items = items;
    this.totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    this.totalPrice = items.reduce((sum, i) => sum + i.subtotal, 0);
  }
}
