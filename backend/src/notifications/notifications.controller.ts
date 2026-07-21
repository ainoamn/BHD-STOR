import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { NotificationsService, NotificationType } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get notifications',
    description: 'Get paginated notifications for the authenticated user',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean, example: false })
  @ApiResponse({ status: 200, description: 'Notifications retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getNotifications(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('unreadOnly') unreadOnly: boolean = false,
  ) {
    const result = await this.notificationsService.getNotifications(
      req.user.userId,
      +page,
      +limit,
      unreadOnly,
    );
    return {
      success: true,
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        unreadCount: result.unreadCount,
      },
    };
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get unread count',
    description: 'Get the number of unread notifications',
  })
  @ApiResponse({ status: 200, description: 'Unread count retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUnreadCount(@Request() req) {
    const count = await this.notificationsService.getUnreadCount(req.user.userId);
    return {
      success: true,
      data: { count },
    };
  }

  @Post(':id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', description: 'Notification UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ) {
    const notification = await this.notificationsService.markAsRead(req.user.userId, id);
    return {
      success: true,
      message: 'Notification marked as read',
      data: notification,
    };
  }

  @Post('read-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all as read', description: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAllAsRead(@Request() req) {
    const result = await this.notificationsService.markAllAsRead(req.user.userId);
    return {
      success: true,
      message: `${result.markedCount} notifications marked as read`,
      data: result,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete notification', description: 'Soft delete a notification' })
  @ApiParam({ name: 'id', description: 'Notification UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async deleteNotification(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ) {
    await this.notificationsService.deleteNotification(req.user.userId, id);
    return {
      success: true,
      message: 'Notification deleted',
    };
  }

  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get notification preferences',
    description: 'Get notification preferences for the authenticated user',
  })
  @ApiResponse({ status: 200, description: 'Preferences retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getNotificationPreferences(@Request() req) {
    const preferences = await this.notificationsService.getNotificationPreferences(
      req.user.userId,
    );
    return {
      success: true,
      data: preferences,
    };
  }

  // Admin endpoints

  @Post('admin/send-push')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send push notification (admin)', description: 'Send push notification to a user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', format: 'uuid' },
        title: { type: 'string' },
        body: { type: 'string' },
        data: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Push notification sent' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async sendPush(
    @Body() payload: { userId: string; title: string; body: string; data?: Record<string, any> },
  ) {
    const result = await this.notificationsService.sendPush(payload.userId, payload);
    return {
      success: true,
      ...result,
    };
  }

  @Post('admin/send-email')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send email (admin)', description: 'Send email to a user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', format: 'uuid' },
        template: { type: 'string' },
        subject: { type: 'string' },
        data: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Email sent' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async sendEmail(
    @Body() payload: { userId: string; template: string; subject: string; data: Record<string, any> },
  ) {
    const result = await this.notificationsService.sendEmail(payload.userId, payload);
    return {
      success: true,
      ...result,
    };
  }

  @Post('admin/send-sms')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send SMS (admin)', description: 'Send SMS to a phone number' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        phone: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'SMS sent' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async sendSMS(@Body() payload: { phone: string; message: string }) {
    const result = await this.notificationsService.sendSMS(payload.phone, payload.message);
    return {
      success: true,
      ...result,
    };
  }

  @Post('admin/cleanup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cleanup old notifications', description: 'Remove old read notifications' })
  @ApiQuery({ name: 'days', required: false, type: Number, example: 30 })
  @ApiResponse({ status: 200, description: 'Cleanup completed' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async cleanupOldNotifications(@Query('days') days: number = 30) {
    const deletedCount = await this.notificationsService.cleanupOldNotifications(+days);
    return {
      success: true,
      message: `${deletedCount} old notifications cleaned up`,
      data: { deletedCount },
    };
  }
}
