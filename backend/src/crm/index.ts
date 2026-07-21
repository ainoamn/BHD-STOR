// Entities
export { CustomerContact, ContactSource, ContactStatus } from './entities/customer-contact.entity';
export { Interaction, InteractionType, InteractionDirection } from './entities/interaction.entity';
export { Opportunity, OpportunityStage } from './entities/opportunity.entity';

// Services
export { CrmService } from './services/crm.service';

// Module
export { CrmModule } from './crm.module';

// DTO Types
export type {
  CreateContactDto,
  UpdateContactDto,
  CreateInteractionDto,
  CreateOpportunityDto,
  UpdateOpportunityDto,
  ContactQueryDto,
} from './services/crm.service';
