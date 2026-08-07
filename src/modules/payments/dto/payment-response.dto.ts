import { Payment } from '../entities/payment.entity';
import { PaymentMethod, PaymentStatus } from '../payments.constants';

export class PaymentResponseDto {
  id: number;
  orderId: number;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  transactionCode: string | null;
  paidAt: Date | null;
  createdAt: Date;

  constructor(payment: Payment) {
    this.id = payment.id;
    this.orderId = payment.order.id;
    this.method = payment.method;
    this.amount = payment.amount;
    this.status = payment.status;
    this.transactionCode = payment.transactionCode;
    this.paidAt = payment.paidAt;
    this.createdAt = payment.createdAt;
  }
}
