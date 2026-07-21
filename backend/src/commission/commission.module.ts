import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionController } from './commission.controller';
import { CommissionService } from './services/commission.service';
import { CommissionPlan } from './entities/commission-plan.entity';
import { Commission } from './entities/commission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CommissionPlan, Commission])],
  controllers: [CommissionController],
  providers: [CommissionService],
  exports: [CommissionService],
})
export class CommissionModule {}
