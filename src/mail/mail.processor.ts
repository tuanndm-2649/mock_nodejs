import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MAIL_QUEUE, MailJob } from './mail.constants';
import { MailService } from './mail.service';
import { OrderMailData } from './interfaces/order-mail-data.interface';

@Processor(MAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job<OrderMailData, void, MailJob>): Promise<void> {
    this.logger.log(
      `Processing job "${job.name}" (id=${job.id}) for ${job.data.email}`,
    );

    switch (job.name) {
      case MailJob.ORDER_PLACED:
        await this.mailService.sendOrderPlaced(job.data);
        break;
      case MailJob.ORDER_CONFIRMED:
        await this.mailService.sendOrderConfirmed(job.data);
        break;
      case MailJob.ORDER_REJECTED:
        await this.mailService.sendOrderRejected(job.data);
        break;
    }

    this.logger.log(`Done job "${job.name}" (id=${job.id})`);
  }
}
