import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { I18nService } from 'nestjs-i18n';
import { PaginationMetaDto } from 'src/common/dto/paginated-response.dto';
import { findEntityOrFail } from 'src/common/utils/find-entity-or-fail.util';
import { REDIS_CLIENT } from 'src/redis/redis.constants';
import { DataSource, FindOptionsWhere, ILike, Repository } from 'typeorm';
import { buildCartKey } from '../cart/cart.constants';
import { Product } from '../products/entities/product.entity';
import { ProductsService } from '../products/products.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { FindOrdersQueryDto } from './dto/find-orders-query.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrderItems } from './entities/oder-item.entity';
import { Order } from './entities/order.entity';
import { generateOrderCode } from './utils/generate-order-code.util';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ORDER_STATUS_TRANSITIONS, OrderStatus } from './orders.constants';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly productService: ProductsService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  async create(userId: number, dto: CreateOrderDto): Promise<OrderResponseDto> {
    const key = buildCartKey(userId);
    const rawCart = await this.redis.hgetall(key);

    const productIds = Object.keys(rawCart).map((id) => Number(id));
    if (!productIds || !productIds.length) {
      throw new NotFoundException(this.i18n.t('orders.error.cartEmpty'));
    }

    const products = await this.productService.findActiveByIds(productIds);
    if (productIds.length !== products.length) {
      throw new NotFoundException(
        this.i18n.t('orders.error.productUnavailable'),
      );
    }

    let orderCode = '';
    do {
      orderCode = generateOrderCode();
    } while (await this.orderRepository.findOne({ where: { orderCode } }));

    const orderItemsData = products.map((product) => {
      const quantity = Number(rawCart[String(product.id)]);
      if (quantity > product.stock) {
        throw new BadRequestException(this.i18n.t('orders.error.outOfStock'));
      }
      return { product, quantity, subtotal: product.price * quantity };
    });

    const totalAmount = orderItemsData.reduce((sum, i) => sum + i.subtotal, 0);

    const orderId = await this.dataSource.manager.transaction(
      async (manager) => {
        const order = manager.create(Order, {
          ...dto,
          orderCode,
          totalAmount,
          user: { id: userId },
        });

        const savedOrder = await manager.save(order);

        const orderItems = orderItemsData.map((data) =>
          manager.create(OrderItems, {
            order: { id: savedOrder.id },
            product: { id: data.product.id },
            productName: data.product.name,
            quantity: data.quantity,
            subtotal: data.subtotal,
          }),
        );

        await manager.save(orderItems);

        for (const data of orderItemsData) {
          await manager.decrement(
            Product,
            { id: data.product.id },
            'stock',
            data.quantity,
          );
        }

        return savedOrder.id;
      },
    );

    await this.redis.del(key);

    const created = await findEntityOrFail(
      this.orderRepository,
      { where: { id: orderId }, relations: { orderItems: true } },
      this.i18n.t('orders.error.notFound'),
    );

    return new OrderResponseDto(created);
  }

  async findAll(
    userId: number,
    role: string,
    query: FindOrdersQueryDto,
  ): Promise<{ data: OrderResponseDto[]; meta: PaginationMetaDto }> {
    const where: FindOptionsWhere<Order> = {
      ...(role !== 'admin' ? { user: { id: userId } } : {}),
      ...(query.search ? { orderCode: ILike(`%${query.search}%`) } : {}),
    };

    const [orders, total] = await this.orderRepository.findAndCount({
      where,
      skip: query.skip,
      take: query.limit,
      order: { createdAt: 'DESC' },
      relations: { orderItems: true },
    });

    return {
      data: orders.map((o) => new OrderResponseDto(o)),
      meta: new PaginationMetaDto(query.page, query.limit, total),
    };
  }

  async findOrderEntity(
    id: number,
    userId: number,
    role: string,
  ): Promise<Order> {
    return findEntityOrFail(
      this.orderRepository,
      {
        where: { id, ...(role !== 'admin' ? { user: { id: userId } } : {}) },
        relations: { orderItems: true },
      },
      this.i18n.t('orders.error.notFound'),
    );
  }

  async findOne(
    id: number,
    userId: number,
    role: string,
  ): Promise<OrderResponseDto> {
    const order = await this.findOrderEntity(id, userId, role);
    return new OrderResponseDto(order);
  }

  async update(
    id: number,
    userId: number,
    role: string,
    dto: UpdateOrderDto,
  ): Promise<OrderResponseDto> {
    const where: FindOptionsWhere<Order> = {
      ...(role !== 'admin' ? { user: { id: userId } } : {}),
      id,
    };

    const order = await findEntityOrFail(
      this.orderRepository,
      { where, relations: { orderItems: true } },
      this.i18n.t('orders.error.notFound'),
    );

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(this.i18n.t('orders.error.cannotUpdate'));
    }

    if (Object.keys(dto).length === 0) {
      return new OrderResponseDto(order);
    }

    Object.assign(order, dto);

    const saved = await this.orderRepository.save(order);

    return new OrderResponseDto(saved);
  }

  async updateStatus(
    id: number,
    dto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    const order = await findEntityOrFail(
      this.orderRepository,
      { where: { id }, relations: { orderItems: true } },
      this.i18n.t('orders.error.notFound'),
    );

    const allowedNextStatuses = ORDER_STATUS_TRANSITIONS[order.status];

    if (!allowedNextStatuses.includes(dto.status)) {
      throw new BadRequestException(
        this.i18n.t('orders.error.invalidStatusTransition'),
      );
    }

    order.status = dto.status;
    order.rejectReason =
      dto.status === OrderStatus.REJECTED ? (dto.rejectReason ?? null) : null;

    const saved = await this.orderRepository.save(order);

    return new OrderResponseDto(saved);
  }
}
