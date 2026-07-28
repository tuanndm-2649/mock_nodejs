import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;

  constructor(page: number, limit: number, total: number) {
    this.page = page;
    this.limit = limit;
    this.total = total;
    this.totalPages = Math.ceil(total / limit);
  }
}

export function PaginatedResponseDto<T>(itemType: Type<T>) {
  class PaginatedResponseClass {
    @ApiProperty({ type: [itemType] })
    data!: T[];

    @ApiProperty({ type: PaginationMetaDto })
    meta!: PaginationMetaDto;
  }

  return PaginatedResponseClass;
}
