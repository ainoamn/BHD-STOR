import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class DroneFleetScheduler {
  private readonly logger = new Logger(DroneFleetScheduler.name);

  @Cron(CronExpression.EVERY_MINUTE)
  handleFleetTick(): void {
    this.logger.debug('Drone fleet scheduler tick (stub)');
  }
}
