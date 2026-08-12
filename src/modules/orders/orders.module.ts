import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderItems } from './entities/oder-item.entity';
import { Order } from './entities/order.entity';
import { ProductsModule } from '../products/products.module';
import { OrderMailListener } from './listeners/order-mail.listener';
import { MAIL_QUEUE } from 'src/mail/mail.constants';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, OrderMailListener],
  imports: [
    TypeOrmModule.forFeature([Order, OrderItems]),
    ProductsModule,
    BullModule.registerQueue({ name: MAIL_QUEUE }),
  ],
})
export class OrdersModule {}
