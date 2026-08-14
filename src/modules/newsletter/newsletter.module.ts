import { MailModule } from 'src/mail/mail.module';
import { UsersModule } from '../users/users.module';
import { ProductsModule } from '../products/products.module';
import { Module } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';

@Module({
  imports: [ProductsModule, UsersModule, MailModule],
  providers: [NewsletterService],
})
export class NewsletterModule {}
