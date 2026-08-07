import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { PaginationMetaDto } from 'src/common/dto/paginated-response.dto';
import { findEntityOrFail } from 'src/common/utils/find-entity-or-fail.util';
import { FindOptionsWhere, Repository } from 'typeorm';
import { FindPaymentsQueryDto } from './dto/find-payments-query.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { Payment } from './entities/payment.entity';
import {
  PAYMENT_STATUS_TRANSITIONS,
  PaymentStatus,
} from './payments.constants';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly i18n: I18nService,
  ) {}

  async findAll(
    userId: number,
    role: string,
    query: FindPaymentsQueryDto,
  ): Promise<{ data: PaymentResponseDto[]; meta: PaginationMetaDto }> {
    const where: FindOptionsWhere<Payment> = {
      ...(role !== 'admin' ? { order: { user: { id: userId } } } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [payments, total] = await this.paymentRepository.findAndCount({
      where,
      skip: query.skip,
      take: query.limit,
      order: { createdAt: 'DESC' },
      relations: { order: true },
    });

    return {
      data: payments.map((p) => new PaymentResponseDto(p)),
      meta: new PaginationMetaDto(query.page, query.limit, total),
    };
  }

  async findOne(
    id: number,
    userId: number,
    role: string,
  ): Promise<PaymentResponseDto> {
    const payment = await findEntityOrFail(
      this.paymentRepository,
      {
        where: {
          id,
          ...(role !== 'admin' ? { order: { user: { id: userId } } } : {}),
        },
        relations: { order: true },
      },
      this.i18n.t('payments.error.notFound'),
    );

    return new PaymentResponseDto(payment);
  }

  async updateStatus(
    id: number,
    dto: UpdatePaymentStatusDto,
  ): Promise<PaymentResponseDto> {
    const payment = await findEntityOrFail(
      this.paymentRepository,
      { where: { id }, relations: { order: true } },
      this.i18n.t('payments.error.notFound'),
    );

    const allowedNextStatuses = PAYMENT_STATUS_TRANSITIONS[payment.status];

    if (!allowedNextStatuses.includes(dto.status)) {
      throw new BadRequestException(
        this.i18n.t('payments.error.invalidStatusTransition'),
      );
    }

    payment.status = dto.status;
    payment.transactionCode =
      dto.status === PaymentStatus.PAID ? (dto.transactionCode ?? null) : null;
    payment.paidAt = dto.status === PaymentStatus.PAID ? new Date() : null;

    const saved = await this.paymentRepository.save(payment);

    return new PaymentResponseDto(saved);
  }
}
