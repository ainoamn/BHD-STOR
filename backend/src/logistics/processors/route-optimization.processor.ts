import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

@Processor('route-optimization')
export class RouteOptimizationProcessor {
  private readonly logger = new Logger(RouteOptimizationProcessor.name);

  @Process()
  async handle(job: Job): Promise<void> {
    this.logger.debug(`Route optimization job ${job.id} received (stub)`);
  }
}
