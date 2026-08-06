import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

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
}
