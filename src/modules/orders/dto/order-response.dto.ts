import { Order } from '../entities/order.entity';
import { OrderStatus } from '../orders.constants';
import { OrderItemResponse } from './order-item-response.dto';

export class OrderResponseDto {
  id: number;
  orderCode: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  totalAmount: number;
  status: OrderStatus;
  rejectReason: string | null;
  orderItems: OrderItemResponse[];
  createdAt: Date;
  updatedAt: Date;

  constructor(order: Order) {
    this.id = order.id;
    this.orderCode = order.orderCode;
    this.recipientName = order.recipientName;
    this.recipientPhone = order.recipientPhone;
    this.recipientAddress = order.recipientAddress;
    this.totalAmount = order.totalAmount;
    this.status = order.status;
    this.rejectReason = order.rejectReason;
    this.orderItems = order.orderItems.map(
      (item) => new OrderItemResponse(item),
    );
    this.createdAt = order.createdAt;
    this.updatedAt = order.updatedAt;
  }
}
