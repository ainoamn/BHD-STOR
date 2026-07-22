import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

@Processor('shipments')
export class ShipmentProcessor {
  private readonly logger = new Logger(ShipmentProcessor.name);

  @Process()
  async handle(job: Job): Promise<void> {
    this.logger.debug(`Shipment job ${job.id} received (stub)`);
  }
}
