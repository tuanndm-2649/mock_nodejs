import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import type { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@ApiBearerAuth()
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOkResponse({ type: CartResponseDto })
  findAll(@Req() req: AuthenticatedRequest) {
    return this.cartService.getCart(req.user!.sub);
  }

  @Post('items')
  @ApiOkResponse({ type: CartResponseDto })
  create(@Req() req: AuthenticatedRequest, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(req.user!.sub, dto);
  }

  @Patch('items/:productId')
  @ApiOkResponse({ type: CartResponseDto })
  update(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateCartItemDto,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.cartService.updateItem(req.user!.sub, productId, dto);
  }

  @Delete('items/:productId')
  deleteItem(
    @Req() req: AuthenticatedRequest,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.cartService.removeItem(req.user!.sub, productId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteCart(@Req() req: AuthenticatedRequest) {
    return this.cartService.removeCart(req.user!.sub);
  }
}
