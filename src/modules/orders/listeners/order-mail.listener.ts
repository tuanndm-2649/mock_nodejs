import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { OnEvent } from '@nestjs/event-emitter';
import { Queue } from 'bullmq';
import { MAIL_QUEUE, MailJob } from 'src/mail/mail.constants';
import type { OrderMailData } from 'src/mail/interfaces/order-mail-data.interface';
import { OrderEvent } from '../orders.events';

@Injectable()
export class OrderMailListener {
  constructor(@InjectQueue(MAIL_QUEUE) private readonly mailQueue: Queue) {}

  @OnEvent(OrderEvent.PLACED)
  async handleOrderPlaced(data: OrderMailData): Promise<void> {
    await this.mailQueue.add(MailJob.ORDER_PLACED, data);
  }

  @OnEvent(OrderEvent.CONFIRMED)
  async handleOrderConfirmed(data: OrderMailData): Promise<void> {
    await this.mailQueue.add(MailJob.ORDER_CONFIRMED, data);
  }

  @OnEvent(OrderEvent.REJECTED)
  async handleOrderRejected(data: OrderMailData): Promise<void> {
    await this.mailQueue.add(MailJob.ORDER_REJECTED, data);
  }
}
