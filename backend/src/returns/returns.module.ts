import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReturnsController } from './returns.controller';
import { ReturnsService } from './services/returns.service';
import { ReturnRequest } from './entities/return-request.entity';
import { ReturnPolicy } from './entities/return-policy.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReturnRequest, ReturnPolicy])],
  controllers: [ReturnsController],
  providers: [ReturnsService],
  exports: [ReturnsService],
})
export class ReturnsModule {}
