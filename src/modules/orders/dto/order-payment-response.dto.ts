import { Payment } from '../../payments/entities/payment.entity';
import {
  PaymentMethod,
  PaymentStatus,
} from '../../payments/payments.constants';

export class OrderPaymentResponse {
  id: number;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  transactionCode: string | null;
  paidAt: Date | null;

  constructor(payment: Payment) {
    this.id = payment.id;
    this.method = payment.method;
    this.amount = payment.amount;
    this.status = payment.status;
    this.transactionCode = payment.transactionCode;
    this.paidAt = payment.paidAt;
  }
}
