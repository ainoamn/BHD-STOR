import { Global, Module } from '@nestjs/common';
import { WinstonLoggerService } from './services/logger.service';

@Global()
@Module({
  providers: [WinstonLoggerService],
  exports: [WinstonLoggerService],
})
export class CommonModule {}
