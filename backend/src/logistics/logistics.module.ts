/**
 * LogisticsModule
 * ===============
 * Complete logistics module for the BHD marketplace.
 * Provides shipment management, driver tracking, vehicle management,
 * zone-based pricing, and marketplace integration.
 */

import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';

// ─── Entities ───────────────────────────────────────────────

import { Shipment } from './entities/shipment.entity';
import { Driver } from './entities/driver.entity';
import { Vehicle } from './entities/vehicle.entity';
import { Zone } from './entities/zone.entity';
import { Hub } from './entities/hub.entity';
import { PricingRule } from './entities/pricing-rule.entity';
import { Route } from './entities/route.entity';
import { MaintenanceRecord } from './entities/maintenance-record.entity';
import { B2BCustomer } from './entities/b2b-customer.entity';
import { DriverEarning } from './entities/driver-earning.entity';
import { LocationHistory } from './entities/location-history.entity';

// ─── Services ───────────────────────────────────────────────

import { ShipmentService } from './services/shipment.service';
import { DriverService } from './services/driver.service';
import { VehicleService } from './services/vehicle.service';
import { ZoneService } from './services/zone.service';
import { HubService } from './services/hub.service';
import { PricingService } from './services/pricing.service';
import { RouteService } from './services/route.service';
import { MaintenanceService } from './services/maintenance.service';
import { B2BCustomerService } from './services/b2b-customer.service';
import { DriverEarningService } from './services/driver-earning.service';
import { TrackingService } from './services/tracking.service';
import { LocationTrackingService } from './services/location-tracking.service';
import { ReportService } from './services/report.service';

// ─── Integration Services ───────────────────────────────────

import { MarketplaceIntegrationService } from './integration/marketplace-integration.service';
import { OrderEventSubscriber } from './integration/order-event.subscriber';
import { ShipmentEventEmitterService } from './integration/shipment-event.emitter';

// ─── Controllers ────────────────────────────────────────────

import { ShipmentController } from './controllers/shipment.controller';
import { DriverController } from './controllers/driver.controller';
import { VehicleController } from './controllers/vehicle.controller';
import { ZoneController } from './controllers/zone.controller';
import { HubController } from './controllers/hub.controller';
import { PricingController } from './controllers/pricing.controller';
import { RouteController } from './controllers/route.controller';
import { TrackingController } from './controllers/tracking.controller';
import { ReportController } from './controllers/report.controller';

// ─── Gateways ───────────────────────────────────────────────

import { TrackingWebSocketGateway } from './integration/shipment-event.emitter';
import { GPSGateway } from './gateways/gps.gateway';

// ─── Queue Processors ───────────────────────────────────────

import { ShipmentProcessor } from './processors/shipment.processor';
import { DriverNotificationProcessor } from './processors/driver-notification.processor';
import { RouteOptimizationProcessor } from './processors/route-optimization.processor';

// ─── External Module Dependencies ───────────────────────────

import { NotificationsModule } from '../notifications/notifications.module';
import { OrdersModule } from '../orders/orders.module';

// ─── Module ─────────────────────────────────────────────────

@Module({
  imports: [
    // Database entities
    TypeOrmModule.forFeature([
      // Core logistics entities
      Shipment,
      Driver,
      Vehicle,
      Zone,
      Hub,
      PricingRule,
      Route,
      MaintenanceRecord,
      B2BCustomer,
      DriverEarning,
      LocationHistory,
    ]),

    // Background job queues
    BullModule.registerQueue(
      { name: 'shipments' },
      { name: 'driver-notifications' },
      { name: 'route-optimization' },
      { name: 'location-tracking' },
    ),

    // External dependencies
    ConfigModule,
    forwardRef(() => NotificationsModule),
    forwardRef(() => OrdersModule),
  ],

  // ─── Controllers (REST API) ─────────────────
  controllers: [
    ShipmentController,
    DriverController,
    VehicleController,
    ZoneController,
    HubController,
    PricingController,
    RouteController,
    TrackingController,
    ReportController,
  ],

  // ─── Providers (Services & Gateways) ────────
  providers: [
    // Core services
    ShipmentService,
    DriverService,
    VehicleService,
    ZoneService,
    HubService,
    PricingService,
    RouteService,
    MaintenanceService,
    B2BCustomerService,
    DriverEarningService,
    TrackingService,
    LocationTrackingService,
    ReportService,

    // Integration services
    MarketplaceIntegrationService,
    OrderEventSubscriber,
    ShipmentEventEmitterService,

    // WebSocket gateways
    TrackingWebSocketGateway,
    GPSGateway,

    // Background processors
    ShipmentProcessor,
    DriverNotificationProcessor,
    RouteOptimizationProcessor,
  ],

  // ─── Exports ────────────────────────────────
  exports: [
    // Services for other modules to use
    ShipmentService,
    DriverService,
    VehicleService,
    ZoneService,
    HubService,
    PricingService,
    RouteService,
    TrackingService,
    LocationTrackingService,

    // Integration services for marketplace module
    MarketplaceIntegrationService,
    ShipmentEventEmitterService,

    // Gateways for external access
    TrackingWebSocketGateway,

    // Re-export TypeOrmModule so other modules can inject repositories
    TypeOrmModule,
  ],
})
export class LogisticsModule {}
