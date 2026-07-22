/**
 * Logistics enums — re-export from entities where defined; invent the rest.
 */

export {
  ShipmentStatus,
  ServiceType,
  SourceType,
} from '../entities/shipment.entity';

export {
  DriverStatus,
  LicenseType,
} from '../entities/driver.entity';

export {
  VehicleStatus,
  VehicleType,
  FuelType,
} from '../entities/vehicle.entity';

export {
  MaintenanceType,
  MaintenanceStatus,
} from '../entities/maintenance-record.entity';

export {
  EarningType,
  EarningStatus,
} from '../entities/driver-earning.entity';

export { RouteStatus } from '../entities/route.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIAL = 'partial',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  FREELANCE = 'freelance',
}
