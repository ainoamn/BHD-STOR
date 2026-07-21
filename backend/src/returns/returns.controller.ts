import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ReturnsService } from './services/returns.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { UpdateReturnDto } from './dto/update-return.dto';
import { ReturnRequest, ReturnStatus } from './entities/return-request.entity';
import { ReturnPolicy } from './entities/return-policy.entity';

@ApiTags('Returns & Exchanges')
@Controller('returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new return/exchange request' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Return request created successfully',
    type: ReturnRequest,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async create(
    @Body() dto: CreateReturnDto,
    @Req() req: any,
  ): Promise<ReturnRequest> {
    const userId = req.user?.id || req.user?.sub;
    return this.returnsService.createReturn(userId, dto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all return requests' })
  @ApiQuery({ name: 'status', enum: ReturnStatus, required: false })
  @ApiQuery({ name: 'userId', type: String, required: false })
  @ApiQuery({ name: 'orderId', type: String, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns list retrieved',
    schema: {
      properties: {
        items: { type: 'array', items: { type: 'object' } },
        total: { type: 'number' },
      },
    },
  })
  async findAll(
    @Query('status') status?: ReturnStatus,
    @Query('userId') userId?: string,
    @Query('orderId') orderId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Req() req?: any,
  ): Promise<{ items: ReturnRequest[]; total: number }> {
    const requestingUserId = req.user?.id || req.user?.sub;
    // Only admins can filter by other userIds
    const isAdmin = req.user?.role === 'admin';

    return this.returnsService.findAll({
      status,
      userId: isAdmin ? userId : requestingUserId,
      orderId,
      page: page ? +page : 1,
      limit: limit ? +limit : 20,
    });
  }

  @Get('admin/all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all return requests (admin)' })
  @ApiQuery({ name: 'status', enum: ReturnStatus, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  async findAllAdmin(
    @Query('status') status?: ReturnStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{ items: ReturnRequest[]; total: number }> {
    return this.returnsService.findAll({
      status,
      page: page ? +page : 1,
      limit: limit ? +limit : 50,
    });
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a return request by ID' })
  @ApiParam({ name: 'id', description: 'Return request ID' })
  @ApiResponse({ status: HttpStatus.OK, type: ReturnRequest })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Return not found' })
  async findOne(@Param('id') id: string): Promise<ReturnRequest> {
    return this.returnsService.findOne(id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a return request' })
  @ApiParam({ name: 'id', description: 'Return request ID' })
  @ApiResponse({ status: HttpStatus.OK, type: ReturnRequest })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateReturnDto,
  ): Promise<ReturnRequest> {
    return this.returnsService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update return status' })
  @ApiParam({ name: 'id', description: 'Return request ID' })
  @ApiResponse({ status: HttpStatus.OK, type: ReturnRequest })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ReturnStatus,
    @Body('notes') notes?: string,
    @Req() req?: any,
  ): Promise<ReturnRequest> {
    const actorId = req.user?.id || req.user?.sub;
    return this.returnsService.updateStatus(id, status, notes, actorId);
  }

  @Post(':id/approve')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a return request' })
  @ApiParam({ name: 'id', description: 'Return request ID' })
  @ApiResponse({ status: HttpStatus.OK, type: ReturnRequest })
  async approve(
    @Param('id') id: string,
    @Body('refundAmount') refundAmount?: number,
  ): Promise<ReturnRequest> {
    return this.returnsService.approveReturn(id, refundAmount);
  }

  @Post(':id/reject')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a return request' })
  @ApiParam({ name: 'id', description: 'Return request ID' })
  @ApiResponse({ status: HttpStatus.OK, type: ReturnRequest })
  async reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ): Promise<ReturnRequest> {
    return this.returnsService.rejectReturn(id, reason);
  }

  @Post(':id/schedule-pickup')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Schedule pickup for a return' })
  @ApiParam({ name: 'id', description: 'Return request ID' })
  @ApiResponse({ status: HttpStatus.OK, type: ReturnRequest })
  async schedulePickup(
    @Param('id') id: string,
    @Body('date') date: string,
    @Body('driverId') driverId?: string,
  ): Promise<ReturnRequest> {
    return this.returnsService.schedulePickup(id, new Date(date), driverId);
  }

  @Post(':id/process-refund')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process refund for a return' })
  @ApiParam({ name: 'id', description: 'Return request ID' })
  @ApiResponse({ status: HttpStatus.OK, type: ReturnRequest })
  async processRefund(@Param('id') id: string): Promise<ReturnRequest> {
    return this.returnsService.processRefund(id);
  }

  @Post(':id/process-exchange')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process exchange for a return' })
  @ApiParam({ name: 'id', description: 'Return request ID' })
  @ApiResponse({ status: HttpStatus.OK, type: ReturnRequest })
  async processExchange(@Param('id') id: string): Promise<ReturnRequest> {
    return this.returnsService.processExchange(id);
  }

  @Post(':id/mark-received')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark return item as received' })
  @ApiParam({ name: 'id', description: 'Return request ID' })
  @ApiResponse({ status: HttpStatus.OK, type: ReturnRequest })
  async markReceived(@Param('id') id: string): Promise<ReturnRequest> {
    return this.returnsService.markAsReceived(id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a return request' })
  @ApiParam({ name: 'id', description: 'Return request ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Return deleted' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.returnsService.remove(id);
  }

  // Return Policy Endpoints

  @Get('policy/:storeId')
  @ApiOperation({ summary: 'Get store return policy' })
  @ApiParam({ name: 'storeId', description: 'Store ID' })
  @ApiResponse({ status: HttpStatus.OK, type: ReturnPolicy })
  async getPolicy(@Param('storeId') storeId: string): Promise<ReturnPolicy | null> {
    return this.returnsService.getReturnPolicy(storeId);
  }

  @Put('policy/:storeId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update store return policy' })
  @ApiParam({ name: 'storeId', description: 'Store ID' })
  @ApiResponse({ status: HttpStatus.OK, type: ReturnPolicy })
  async updatePolicy(
    @Param('storeId') storeId: string,
    @Body() data: {
      returnWindow?: number;
      exchangeWindow?: number;
      conditions?: string[];
      nonReturnableCategories?: string[];
      restockingFee?: number;
      autoApprove?: boolean;
    },
  ): Promise<ReturnPolicy> {
    return this.returnsService.updateReturnPolicy(storeId, data);
  }

  @Post('check-eligibility')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if a product is eligible for return' })
  @ApiResponse({ status: HttpStatus.OK })
  async checkEligibility(
    @Body('orderId') orderId: string,
    @Body('productId') productId: string,
    @Req() req?: any,
  ): Promise<{ eligible: boolean; reason?: string }> {
    const userId = req.user?.id || req.user?.sub;
    return this.returnsService.checkEligibility(orderId, productId, userId);
  }
}
