import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

@Processor('driver-notifications')
export class DriverNotificationProcessor {
  private readonly logger = new Logger(DriverNotificationProcessor.name);

  @Process()
  async handle(job: Job): Promise<void> {
    this.logger.debug(`Driver notification job ${job.id} received (stub)`);
  }
}
