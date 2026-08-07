import { IsEnum, IsInt, IsPositive } from 'class-validator';
import { PaymentMethod } from '../payments.constants';

export class CreatePaymentDto {
  @IsInt()
  @IsPositive()
  orderId!: number;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;
}
