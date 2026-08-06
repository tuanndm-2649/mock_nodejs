import { IsEnum, IsString, MaxLength, ValidateIf } from 'class-validator';
import { OrderStatus } from '../orders.constants';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @ValidateIf(
    (dto: UpdateOrderStatusDto) => dto.status === OrderStatus.REJECTED,
  )
  @IsString()
  @MaxLength(500)
  rejectReason?: string;
}
