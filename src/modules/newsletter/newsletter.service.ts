import { Injectable, Logger } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';
import { MailService } from 'src/mail/mail.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(
    private readonly productsService: ProductsService,
    private readonly userService: UsersService,
    private readonly mailService: MailService,
  ) {}

  @Cron(CronExpression.EVERY_WEEK)
  handleWeeklyNewsletter() {
    return this.sendFeaturedProductsNewsletter();
  }

  async sendFeaturedProductsNewsletter(): Promise<void> {
    const products = await this.productsService.findFeatured();

    if (products.length === 0) {
      this.logger.log('No featured products, skip sending newsletter');
      return;
    }

    const users = await this.userService.findAllActive();
    const items = products.map((p) => ({ name: p.name, price: p.price }));

    for (const user of users) {
      await this.mailService.sendFeaturedProductsNewsletter({
        email: user.email,
        products: items,
      });
      await this.sleep(5000);
    }

    this.logger.log(`Sent newsletter to ${users.length} users`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
