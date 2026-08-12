import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MAIL_QUEUE, MailJob } from './mail.constants';
import { MailService } from './mail.service';
import { OrderMailData } from './interfaces/order-mail-data.interface';

@Processor(MAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job<OrderMailData, void, MailJob>): Promise<void> {
    switch (job.name) {
      case MailJob.ORDER_PLACED:
        return this.mailService.sendOrderPlaced(job.data);
      case MailJob.ORDER_CONFIRMED:
        return this.mailService.sendOrderConfirmed(job.data);
      case MailJob.ORDER_REJECTED:
        return this.mailService.sendOrderRejected(job.data);
    }
  }
}
