import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { FindOrdersQueryDto } from './dto/find-orders-query.dto';
import { OrdersService } from './orders.service';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto, @Req() req: AuthenticatedRequest) {
    return this.ordersService.create(req.user!.sub, dto);
  }

  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: FindOrdersQueryDto,
  ) {
    return this.ordersService.findAll(req.user!.sub, req.user!.role, query);
  }

  @Get(':id')
  findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.findOne(id, req.user!.sub, req.user!.role);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ordersService.update(+id, req.user!.sub, req.user!.role, dto);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(['admin'])
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }
}
