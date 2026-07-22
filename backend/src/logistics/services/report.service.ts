import { Injectable, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class ReportService {
  async getSummary(_from?: Date, _to?: Date): Promise<any> {
    return {};
  }

  async generateReport(_type: string, _params?: Record<string, unknown>): Promise<any> {
    throw new ServiceUnavailableException('Not implemented');
  }
}
