import { OrderItems } from '../entities/oder-item.entity';

export class OrderItemResponse {
  id: number;
  productName: string;
  quantity: number;
  subtotal: number;

  constructor(orderItems: OrderItems) {
    this.id = orderItems.id;
    this.productName = orderItems.productName;
    this.quantity = orderItems.quantity;
    this.subtotal = orderItems.subtotal;
  }
}
