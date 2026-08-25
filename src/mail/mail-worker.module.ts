import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MAIL_QUEUE } from './mail.constants';
import { MailModule } from './mail.module';
import { MailProcessor } from './mail.processor';

@Module({
  imports: [BullModule.registerQueue({ name: MAIL_QUEUE }), MailModule],
  providers: [MailProcessor],
})
export class MailWorkerModule {}
