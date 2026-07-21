import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, In } from 'typeorm';
import { CustomerContact, ContactStatus, ContactSource } from '../entities/customer-contact.entity';
import { Interaction, InteractionType } from '../entities/interaction.entity';
import { Opportunity, OpportunityStage } from '../entities/opportunity.entity';

export interface CreateContactDto {
  name: string;
  email: string;
  phone: string;
  company?: string;
  source?: ContactSource;
  status?: ContactStatus;
  assignedTo?: string;
  notes?: string;
  tags?: string[];
  estimatedValue?: number;
}

export interface UpdateContactDto extends Partial<CreateContactDto> {}

export interface CreateInteractionDto {
  type: InteractionType;
  direction?: 'inbound' | 'outbound';
  subject: string;
  content: string;
  scheduledAt?: Date;
  completedAt?: Date;
  createdBy: string;
}

export interface CreateOpportunityDto {
  contactId: string;
  title: string;
  description?: string;
  value: number;
  stage?: OpportunityStage;
  probability?: number;
  expectedCloseDate: Date;
  assignedTo: string;
}

export interface UpdateOpportunityDto {
  stage?: OpportunityStage;
  probability?: number;
  value?: number;
  expectedCloseDate?: Date;
  actualCloseDate?: Date;
  assignedTo?: string;
}

export interface ContactQueryDto {
  status?: ContactStatus;
  source?: ContactSource;
  assignedTo?: string;
  search?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable()
export class CrmService {
  constructor(
    @InjectRepository(CustomerContact)
    private readonly contactRepo: Repository<CustomerContact>,
    @InjectRepository(Interaction)
    private readonly interactionRepo: Repository<Interaction>,
    @InjectRepository(Opportunity)
    private readonly opportunityRepo: Repository<Opportunity>,
  ) {}

  // ─── Contact Methods ───────────────────────────────────────────

  async createContact(dto: CreateContactDto): Promise<CustomerContact> {
    const contact = this.contactRepo.create({
      ...dto,
      status: dto.status || ContactStatus.NEW,
      source: dto.source || ContactSource.WEBSITE,
      tags: dto.tags || [],
    });
    return this.contactRepo.save(contact);
  }

  async findAllContacts(query: ContactQueryDto = {}): Promise<{
    data: CustomerContact[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      status,
      source,
      assignedTo,
      search,
      tags,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const where: any = {};

    if (status) where.status = status;
    if (source) where.source = source;
    if (assignedTo) where.assignedTo = assignedTo;
    if (tags && tags.length > 0) {
      where.tags = In(tags);
    }
    if (search) {
      where.name = Like(`%${search}%`);
    }

    const [data, total] = await this.contactRepo.findAndCount({
      where,
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['interactions', 'opportunities'],
    });

    return { data, total, page, limit };
  }

  async findContact(id: string): Promise<CustomerContact> {
    const contact = await this.contactRepo.findOne({
      where: { id },
      relations: ['interactions', 'opportunities'],
    });
    if (!contact) throw new NotFoundException(`Contact ${id} not found`);
    return contact;
  }

  async updateContact(
    id: string,
    dto: UpdateContactDto,
  ): Promise<CustomerContact> {
    const contact = await this.findContact(id);
    Object.assign(contact, dto);
    return this.contactRepo.save(contact);
  }

  async deleteContact(id: string): Promise<void> {
    const result = await this.contactRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Contact ${id} not found`);
    }
  }

  // ─── Interaction Methods ───────────────────────────────────────

  async addInteraction(
    contactId: string,
    dto: CreateInteractionDto,
  ): Promise<Interaction> {
    const contact = await this.findContact(contactId);
    const interaction = this.interactionRepo.create({
      ...dto,
      contactId,
      direction: dto.direction || 'outbound',
    });

    // Update last contact date on the contact
    contact.lastContactDate = new Date();
    await this.contactRepo.save(contact);

    return this.interactionRepo.save(interaction);
  }

  async getInteractions(contactId: string): Promise<Interaction[]> {
    await this.findContact(contactId); // validate contact exists
    return this.interactionRepo.find({
      where: { contactId },
      order: { createdAt: 'DESC' },
    });
  }

  // ─── Opportunity Methods ───────────────────────────────────────

  async createOpportunity(dto: CreateOpportunityDto): Promise<Opportunity> {
    await this.findContact(dto.contactId); // validate contact
    const opportunity = this.opportunityRepo.create({
      ...dto,
      stage: dto.stage || OpportunityStage.PROSPECTING,
      probability: dto.probability ?? this.getDefaultProbability(dto.stage || OpportunityStage.PROSPECTING),
    });
    return this.opportunityRepo.save(opportunity);
  }

  async updateOpportunityStage(
    id: string,
    stage: OpportunityStage,
  ): Promise<Opportunity> {
    const opportunity = await this.opportunityRepo.findOne({ where: { id } });
    if (!opportunity) {
      throw new NotFoundException(`Opportunity ${id} not found`);
    }

    opportunity.stage = stage;
    opportunity.probability = this.getDefaultProbability(stage);

    if (stage === OpportunityStage.CLOSED_WON || stage === OpportunityStage.CLOSED_LOST) {
      opportunity.actualCloseDate = new Date();
    }

    return this.opportunityRepo.save(opportunity);
  }

  async getPipeline(): Promise<Record<string, Opportunity[]>> {
    const opportunities = await this.opportunityRepo.find({
      where: {
        stage: In([
          OpportunityStage.PROSPECTING,
          OpportunityStage.QUALIFICATION,
          OpportunityStage.PROPOSAL,
          OpportunityStage.NEGOTIATION,
        ]),
      },
      relations: ['contact'],
      order: { expectedCloseDate: 'ASC' },
    });

    const pipeline: Record<string, Opportunity[]> = {
      prospecting: [],
      qualification: [],
      proposal: [],
      negotiation: [],
      closed_won: [],
      closed_lost: [],
    };

    for (const opp of opportunities) {
      pipeline[opp.stage].push(opp);
    }

    // Also add closed opportunities from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const closedOpps = await this.opportunityRepo.find({
      where: [
        { stage: OpportunityStage.CLOSED_WON, actualCloseDate: Between(thirtyDaysAgo, new Date()) },
        { stage: OpportunityStage.CLOSED_LOST, actualCloseDate: Between(thirtyDaysAgo, new Date()) },
      ],
      relations: ['contact'],
      order: { actualCloseDate: 'DESC' },
    });

    for (const opp of closedOpps) {
      pipeline[opp.stage].push(opp);
    }

    return pipeline;
  }

  async getSalesForecast(): Promise<
    { month: string; expectedRevenue: number; weightedRevenue: number }[]
  > {
    const now = new Date();
    const forecasts: { month: string; expectedRevenue: number; weightedRevenue: number }[] = [];

    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);

      const opps = await this.opportunityRepo.find({
        where: {
          expectedCloseDate: Between(monthStart, monthEnd),
          stage: In([
            OpportunityStage.PROSPECTING,
            OpportunityStage.QUALIFICATION,
            OpportunityStage.PROPOSAL,
            OpportunityStage.NEGOTIATION,
          ]),
        },
      });

      const expectedRevenue = opps.reduce((sum, o) => sum + Number(o.value), 0);
      const weightedRevenue = opps.reduce(
        (sum, o) => sum + Number(o.value) * (Number(o.probability) / 100),
        0,
      );

      forecasts.push({
        month: monthStart.toISOString().slice(0, 7),
        expectedRevenue,
        weightedRevenue,
      });
    }

    return forecasts;
  }

  async assignContact(
    contactId: string,
    userId: string,
  ): Promise<CustomerContact> {
    const contact = await this.findContact(contactId);
    contact.assignedTo = userId;
    return this.contactRepo.save(contact);
  }

  async scheduleFollowUp(
    contactId: string,
    date: Date,
    notes?: string,
  ): Promise<CustomerContact> {
    const contact = await this.findContact(contactId);
    contact.nextFollowUpDate = date;
    if (notes) {
      contact.notes = contact.notes
        ? `${contact.notes}\n\nFollow-up scheduled: ${notes}`
        : `Follow-up scheduled: ${notes}`;
    }
    return this.contactRepo.save(contact);
  }

  async getDashboardStats(): Promise<{
    totalContacts: number;
    newContactsThisMonth: number;
    totalOpportunities: number;
    totalPipelineValue: number;
    wonRevenueThisMonth: number;
    conversionRate: number;
    upcomingFollowUps: number;
    recentInteractions: number;
  }> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const totalContacts = await this.contactRepo.count();
    const newContactsThisMonth = await this.contactRepo.count({
      where: { createdAt: Between(monthStart, monthEnd) },
    });

    const totalOpportunities = await this.opportunityRepo.count({
      where: {
        stage: In([
          OpportunityStage.PROSPECTING,
          OpportunityStage.QUALIFICATION,
          OpportunityStage.PROPOSAL,
          OpportunityStage.NEGOTIATION,
        ]),
      },
    });

    const pipelineOpps = await this.opportunityRepo.find({
      where: {
        stage: In([
          OpportunityStage.PROSPECTING,
          OpportunityStage.QUALIFICATION,
          OpportunityStage.PROPOSAL,
          OpportunityStage.NEGOTIATION,
        ]),
      },
    });
    const totalPipelineValue = pipelineOpps.reduce(
      (sum, o) => sum + Number(o.value),
      0,
    );

    const wonOpps = await this.opportunityRepo.find({
      where: {
        stage: OpportunityStage.CLOSED_WON,
        actualCloseDate: Between(monthStart, monthEnd),
      },
    });
    const wonRevenueThisMonth = wonOpps.reduce(
      (sum, o) => sum + Number(o.value),
      0,
    );

    const totalClosed = await this.opportunityRepo.count({
      where: {
        stage: In([OpportunityStage.CLOSED_WON, OpportunityStage.CLOSED_LOST]),
      },
    });
    const totalWon = await this.opportunityRepo.count({
      where: { stage: OpportunityStage.CLOSED_WON },
    });
    const conversionRate = totalClosed > 0 ? (totalWon / totalClosed) * 100 : 0;

    const upcomingFollowUps = await this.contactRepo.count({
      where: {
        nextFollowUpDate: Between(now, new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)),
      },
    });

    const recentInteractions = await this.interactionRepo.count({
      where: { createdAt: Between(monthStart, monthEnd) },
    });

    return {
      totalContacts,
      newContactsThisMonth,
      totalOpportunities,
      totalPipelineValue,
      wonRevenueThisMonth,
      conversionRate,
      upcomingFollowUps,
      recentInteractions,
    };
  }

  // ─── Helpers ───────────────────────────────────────────────────

  private getDefaultProbability(stage: OpportunityStage): number {
    const map: Record<OpportunityStage, number> = {
      [OpportunityStage.PROSPECTING]: 10,
      [OpportunityStage.QUALIFICATION]: 25,
      [OpportunityStage.PROPOSAL]: 50,
      [OpportunityStage.NEGOTIATION]: 75,
      [OpportunityStage.CLOSED_WON]: 100,
      [OpportunityStage.CLOSED_LOST]: 0,
    };
    return map[stage] || 10;
  }
}
