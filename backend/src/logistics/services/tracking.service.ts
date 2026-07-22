import { Injectable, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class TrackingService {
  async getPublicTracking(trackingNumber: string): Promise<any> {
    void trackingNumber;
    throw new ServiceUnavailableException('Not implemented');
  }
}
