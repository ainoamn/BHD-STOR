import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyService } from './services/loyalty.service';
import { LoyaltyProgram } from './entities/loyalty-program.entity';
import { LoyaltyAccount } from './entities/loyalty-account.entity';
import { PointsTransaction } from './entities/points-transaction.entity';
import { Reward } from './entities/reward.entity';
import { RewardRedemption } from './entities/reward-redemption.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoyaltyProgram,
      LoyaltyAccount,
      PointsTransaction,
      Reward,
      RewardRedemption,
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [LoyaltyController],
  providers: [LoyaltyService],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
