import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { PaymentMethod } from '../../payments/payments.constants';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  recipientName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(12)
  recipientPhone!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  recipientAddress!: string;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;
}
