import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvancedAnalyticsController } from './advanced-analytics.controller';
import { AdvancedAnalyticsService } from './services/advanced-analytics.service';

// In production, these would be actual entity imports
// Using dynamic imports in the service for flexibility

@Module({
  imports: [],
  controllers: [AdvancedAnalyticsController],
  providers: [AdvancedAnalyticsService],
  exports: [AdvancedAnalyticsService],
})
export class AdvancedAnalyticsModule {}
