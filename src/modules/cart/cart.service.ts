import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import Redis from 'ioredis';
import { I18nService } from 'nestjs-i18n';
import { REDIS_CLIENT } from 'src/redis/redis.constants';
import { ProductsService } from '../products/products.service';
import { buildCartKey, CART_TTL_SECONDS } from './cart.constants';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { CartItemResponseDto } from './dto/cart-item-response.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
    private readonly productService: ProductsService,
    private readonly i18n: I18nService,
  ) {}

  async addItem(userId: number, dto: AddCartItemDto): Promise<CartResponseDto> {
    const product = await this.productService.findOneOrFail(dto.productId);
    const key = buildCartKey(userId);
    const currentQuantity = await this.redis.hget(key, String(dto.productId));

    const newQuantity: number =
      (currentQuantity ? Number(currentQuantity) : 0) + dto.quantity;

    if (newQuantity > product.stock) {
      throw new BadRequestException(this.i18n.t('cart.error.outOfStock'));
    }

    await this.redis
      .multi()
      .hset(key, String(dto.productId), String(newQuantity))
      .expire(key, CART_TTL_SECONDS)
      .exec();

    return await this.getCart(userId);
  }

  async updateItem(
    userId: number,
    productId: number,
    dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const product = await this.productService.findOneOrFail(productId);
    const key = buildCartKey(userId);
    const currentQuantity = await this.redis.hget(key, String(productId));

    if (currentQuantity === null) {
      throw new NotFoundException(this.i18n.t('cart.error.itemNotFound'));
    }

    const newQuantity: number = dto.quantity;

    if (newQuantity > product.stock) {
      throw new BadRequestException(this.i18n.t('cart.error.outOfStock'));
    }

    if (newQuantity !== Number(currentQuantity)) {
      await this.redis
        .multi()
        .hset(key, String(productId), String(newQuantity))
        .expire(key, CART_TTL_SECONDS)
        .exec();
    }

    return this.getCart(userId);
  }

  async removeItem(
    userId: number,
    productId: number,
  ): Promise<CartResponseDto> {
    await this.redis.hdel(buildCartKey(userId), String(productId));

    return await this.getCart(userId);
  }

  async removeCart(userId: number) {
    await this.redis.del(buildCartKey(userId));
  }

  async getCart(userId: number): Promise<CartResponseDto> {
    const key = buildCartKey(userId);
    const rawCart = await this.redis.hgetall(key);
    const productIds = Object.keys(rawCart).map((id) => Number(id));

    if (productIds.length === 0) {
      return {
        items: [],
        totalItems: 0,
        totalPrice: 0,
      };
    }

    const products = await this.productService.findActiveByIds(productIds);

    const mapProducts = new CartResponseDto(
      products.map(
        (item) => new CartItemResponseDto(item, Number(rawCart[item.id] ?? 0)),
      ),
    );

    return mapProducts;
  }
}
