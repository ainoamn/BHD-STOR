import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CrmService } from './services/crm.service';
import {
  CreateContactDto,
  UpdateContactDto,
  CreateInteractionDto,
  CreateOpportunityDto,
  ContactQueryDto,
  OpportunityStage,
} from './services/crm.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  // ─── Contacts ──────────────────────────────────────────────────

  @Post('contacts')
  async createContact(@Body() dto: CreateContactDto) {
    const contact = await this.crmService.createContact(dto);
    return { success: true, data: contact };
  }

  @Get('contacts')
  async findAllContacts(@Query() query: ContactQueryDto) {
    return this.crmService.findAllContacts(query);
  }

  @Get('contacts/:id')
  async findContact(@Param('id', ParseUUIDPipe) id: string) {
    const contact = await this.crmService.findContact(id);
    return { success: true, data: contact };
  }

  @Put('contacts/:id')
  async updateContact(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContactDto,
  ) {
    const contact = await this.crmService.updateContact(id, dto);
    return { success: true, data: contact };
  }

  @Delete('contacts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteContact(@Param('id', ParseUUIDPipe) id: string) {
    await this.crmService.deleteContact(id);
  }

  @Post('contacts/:id/assign/:userId')
  async assignContact(
    @Param('id', ParseUUIDPipe) contactId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    const contact = await this.crmService.assignContact(contactId, userId);
    return { success: true, data: contact };
  }

  @Post('contacts/:id/follow-up')
  async scheduleFollowUp(
    @Param('id', ParseUUIDPipe) contactId: string,
    @Body('date') date: string,
    @Body('notes') notes?: string,
  ) {
    const contact = await this.crmService.scheduleFollowUp(
      contactId,
      new Date(date),
      notes,
    );
    return { success: true, data: contact };
  }

  // ─── Interactions ──────────────────────────────────────────────

  @Post('contacts/:id/interactions')
  async addInteraction(
    @Param('id', ParseUUIDPipe) contactId: string,
    @Body() dto: CreateInteractionDto,
  ) {
    const interaction = await this.crmService.addInteraction(contactId, dto);
    return { success: true, data: interaction };
  }

  @Get('contacts/:id/interactions')
  async getInteractions(@Param('id', ParseUUIDPipe) contactId: string) {
    const interactions = await this.crmService.getInteractions(contactId);
    return { success: true, data: interactions };
  }

  // ─── Opportunities ─────────────────────────────────────────────

  @Post('opportunities')
  async createOpportunity(@Body() dto: CreateOpportunityDto) {
    const opportunity = await this.crmService.createOpportunity(dto);
    return { success: true, data: opportunity };
  }

  @Get('opportunities')
  async getAllOpportunities(
    @Query('stage') stage?: OpportunityStage,
    @Query('assignedTo') assignedTo?: string,
  ) {
    const query: ContactQueryDto = {};
    if (stage) {
      return this.crmService.getPipeline();
    }
    if (assignedTo) query.assignedTo = assignedTo;
    return this.crmService.getPipeline();
  }

  @Put('opportunities/:id/stage')
  async updateOpportunityStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('stage') stage: OpportunityStage,
  ) {
    const opportunity = await this.crmService.updateOpportunityStage(id, stage);
    return { success: true, data: opportunity };
  }

  @Get('pipeline')
  async getPipeline() {
    const pipeline = await this.crmService.getPipeline();
    return { success: true, data: pipeline };
  }

  @Get('forecast')
  async getSalesForecast() {
    const forecast = await this.crmService.getSalesForecast();
    return { success: true, data: forecast };
  }

  // ─── Dashboard ─────────────────────────────────────────────────

  @Get('dashboard/stats')
  async getDashboardStats() {
    const stats = await this.crmService.getDashboardStats();
    return { success: true, data: stats };
  }
}
