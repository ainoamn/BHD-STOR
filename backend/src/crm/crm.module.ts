import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmController } from './crm.controller';
import { CrmService } from './services/crm.service';
import { CustomerContact } from './entities/customer-contact.entity';
import { Interaction } from './entities/interaction.entity';
import { Opportunity } from './entities/opportunity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerContact, Interaction, Opportunity])],
  controllers: [CrmController],
  providers: [CrmService],
  exports: [CrmService],
})
export class CrmModule {}
