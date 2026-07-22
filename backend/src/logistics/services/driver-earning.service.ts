import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverEarning } from '../entities/driver-earning.entity';

@Injectable()
export class DriverEarningService {
  constructor(
    @InjectRepository(DriverEarning)
    private readonly earningRepo: Repository<DriverEarning>,
  ) {}

  async findByDriver(_driverId: string): Promise<DriverEarning[]> {
    return [];
  }

  async createEarning(_data: Partial<DriverEarning>): Promise<DriverEarning> {
    throw new ServiceUnavailableException('Not implemented');
  }
}
