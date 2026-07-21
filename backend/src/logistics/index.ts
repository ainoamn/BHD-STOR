/**
 * Logistics Module - Barrel Exports
 * ==================================
 * Central export point for all logistics module public APIs.
 * Import from this file to access all logistics functionality.
 *
 * @example
 * ```typescript
 * import { LogisticsModule, ShipmentService, MarketplaceIntegrationService } from './logistics';
 * ```
 */

// ─── Module ─────────────────────────────────────────────────

export { LogisticsModule } from './logistics.module';

// ─── Entities ───────────────────────────────────────────────

export { Shipment } from './entities/shipment.entity';
export { Driver } from './entities/driver.entity';
export { Vehicle } from './entities/vehicle.entity';
export { Zone } from './entities/zone.entity';
export { Hub } from './entities/hub.entity';
export { PricingRule } from './entities/pricing-rule.entity';
export { Route } from './entities/route.entity';
export { MaintenanceRecord } from './entities/maintenance-record.entity';
export { B2BCustomer } from './entities/b2b-customer.entity';
export { DriverEarning } from './entities/driver-earning.entity';
export { LocationHistory } from './entities/location-history.entity';

// ─── Enums ──────────────────────────────────────────────────

export {
  ShipmentStatus,
  DriverStatus,
  VehicleStatus,
  VehicleType,
  ServiceType,
  PaymentStatus,
  MaintenanceType,
  MaintenanceStatus,
  EarningType,
  EarningStatus,
  EmploymentType,
  LicenseType,
  FuelType,
  RouteStatus,
} from './enums/logistics.enum';

// ─── Services ───────────────────────────────────────────────

export { ShipmentService } from './services/shipment.service';
export { DriverService } from './services/driver.service';
export { VehicleService } from './services/vehicle.service';
export { ZoneService } from './services/zone.service';
export { HubService } from './services/hub.service';
export { PricingService } from './services/pricing.service';
export { RouteService } from './services/route.service';
export { TrackingService } from './services/tracking.service';
export { LocationTrackingService } from './services/location-tracking.service';
export { ReportService } from './services/report.service';

// ─── Integration Services ───────────────────────────────────

export {
  MarketplaceIntegrationService,
  type TrackingInfo,
  type TrackingEvent,
  type ShippingQuoteRequest,
  type ShippingQuote,
} from './integration/marketplace-integration.service';

export { OrderEventSubscriber } from './integration/order-event.subscriber';

export {
  ShipmentEventEmitterService,
  TrackingWebSocketGateway,
  type ShipmentCreatedEvent,
  type ShipmentStatusChangedEvent,
  type DriverAssignedEvent,
  type DriverLocationUpdateEvent,
  type DeliveryCompletedEvent,
  type DeliveryFailedEvent,
  type ShipmentLifecycleEvent,
} from './integration/shipment-event.emitter';

// ─── Controllers ────────────────────────────────────────────

export { ShipmentController } from './controllers/shipment.controller';
export { DriverController } from './controllers/driver.controller';
export { VehicleController } from './controllers/vehicle.controller';
export { ZoneController } from './controllers/zone.controller';
export { HubController } from './controllers/hub.controller';
export { PricingController } from './controllers/pricing.controller';
export { RouteController } from './controllers/route.controller';
export { TrackingController } from './controllers/tracking.controller';
export { ReportController } from './controllers/report.controller';

// ─── Gateways ───────────────────────────────────────────────

export { GPSGateway } from './gateways/gps.gateway';

// ─── DTOs ───────────────────────────────────────────────────

export * from './dto/create-shipment.dto';
export * from './dto/update-shipment.dto';
export * from './dto/assign-driver.dto';
export * from './dto/shipment-filter.dto';
export * from './dto/create-driver.dto';
export * from './dto/create-vehicle.dto';
export * from './dto/pricing-quote.dto';
export * from './dto/tracking-query.dto';

// ─── Interfaces ─────────────────────────────────────────────

export * from './interfaces/tracking.interface';
export * from './interfaces/pricing.interface';
export * from './interfaces/route.interface';

// ─── Utilities ──────────────────────────────────────────────

export { generateTrackingNumber, calculateShippingCost, estimateDeliveryDate } from './utils/logistics.utils';
