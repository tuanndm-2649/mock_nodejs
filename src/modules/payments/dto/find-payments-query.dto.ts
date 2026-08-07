import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaymentStatus } from '../payments.constants';

export class FindPaymentsQueryDto extends PaginationQueryDto {
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;
}
