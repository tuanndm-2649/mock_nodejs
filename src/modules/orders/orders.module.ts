import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KafkaModule } from 'src/kafka/kafka.module';
import { MAIL_QUEUE } from 'src/mail/mail.constants';
import { ProductsModule } from '../products/products.module';
import { OrderItems } from './entities/oder-item.entity';
import { Order } from './entities/order.entity';
import { OrderMailListener } from './listeners/order-mail.listener';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, OrderMailListener],
  imports: [
    TypeOrmModule.forFeature([Order, OrderItems]),
    ProductsModule,
    BullModule.registerQueue({ name: MAIL_QUEUE }),
    KafkaModule,
  ],
})
export class OrdersModule {}
