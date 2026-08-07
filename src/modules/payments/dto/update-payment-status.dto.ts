import { IsEnum, IsString, MaxLength, ValidateIf } from 'class-validator';
import { PaymentStatus } from '../payments.constants';

export class UpdatePaymentStatusDto {
  @IsEnum(PaymentStatus)
  status!: PaymentStatus;

  @ValidateIf(
    (dto: UpdatePaymentStatusDto) => dto.status === PaymentStatus.PAID,
  )
  @IsString()
  @MaxLength(100)
  transactionCode?: string;
}
