import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { I18nService } from 'nestjs-i18n';
import { OrderMailData } from './interfaces/order-mail-data.interface';
import { FeaturedProductsMailData } from './interfaces/featured-products-mail-data.interface';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly i18n: I18nService,
  ) {}

  sendOrderPlaced(data: OrderMailData): Promise<void> {
    const args = {
      orderCode: data.orderCode,
      recipientName: data.recipientName,
    };

    return this.send(data.email, 'order-placed', {
      subject: this.i18n.t('mail.orderPlaced.subject', { args }),
      greeting: this.i18n.t('mail.orderPlaced.greeting', { args }),
      body: this.i18n.t('mail.orderPlaced.body', { args }),
      totalLabel: this.i18n.t('mail.orderPlaced.totalLabel'),
      footer: this.i18n.t('mail.orderPlaced.footer'),
      totalAmount: data.totalAmount,
    });
  }

  sendOrderConfirmed(data: OrderMailData): Promise<void> {
    const args = {
      orderCode: data.orderCode,
      recipientName: data.recipientName,
    };

    return this.send(data.email, 'order-confirmed', {
      subject: this.i18n.t('mail.orderConfirmed.subject', { args }),
      greeting: this.i18n.t('mail.orderConfirmed.greeting', { args }),
      body: this.i18n.t('mail.orderConfirmed.body', { args }),
      totalLabel: this.i18n.t('mail.orderConfirmed.totalLabel'),
      totalAmount: data.totalAmount,
    });
  }

  sendOrderRejected(data: OrderMailData): Promise<void> {
    const args = {
      orderCode: data.orderCode,
      recipientName: data.recipientName,
    };

    return this.send(data.email, 'order-rejected', {
      subject: this.i18n.t('mail.orderRejected.subject', { args }),
      greeting: this.i18n.t('mail.orderRejected.greeting', { args }),
      body: this.i18n.t('mail.orderRejected.body', { args }),
      reasonLabel: this.i18n.t('mail.orderRejected.reasonLabel'),
      rejectReason: data.rejectReason,
    });
  }

  sendFeaturedProductsNewsletter(
    data: FeaturedProductsMailData,
  ): Promise<void> {
    return this.send(data.email, 'featured-products', {
      subject: this.i18n.t('mail.featuredProducts.subject'),
      greeting: this.i18n.t('mail.featuredProducts.greeting'),
      body: this.i18n.t('mail.featuredProducts.body'),
      footer: this.i18n.t('mail.featuredProducts.footer'),
      products: data.products,
    });
  }

  private async send(
    to: string,
    template: string,
    context: Record<string, unknown> & { subject: string },
  ): Promise<void> {
    const { subject, ...rest } = context;
    await this.mailerService.sendMail({ to, subject, template, context: rest });
  }
}
