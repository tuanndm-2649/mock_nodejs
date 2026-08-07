import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { FindPaymentsQueryDto } from './dto/find-payments-query.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: FindPaymentsQueryDto,
  ) {
    return this.paymentsService.findAll(req.user!.sub, req.user!.role, query);
  }

  @Get(':id')
  findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.paymentsService.findOne(id, req.user!.sub, req.user!.role);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(['admin'])
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePaymentStatusDto,
  ) {
    return this.paymentsService.updateStatus(id, dto);
  }
}
