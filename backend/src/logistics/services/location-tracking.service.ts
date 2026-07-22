import { Injectable, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class LocationTrackingService {
  async recordLocation(_payload: unknown): Promise<any> {
    throw new ServiceUnavailableException('Not implemented');
  }

  async getLatestLocation(_shipmentId: string): Promise<any> {
    return null;
  }

  async getHistory(_shipmentId: string): Promise<any[]> {
    return [];
  }
}
