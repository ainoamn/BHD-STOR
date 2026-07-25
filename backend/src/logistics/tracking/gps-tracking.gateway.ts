/**
 * BHD Logistics - GPS Tracking WebSocket Gateway
 * Real-time WebSocket gateway for live vehicle tracking.
 * Namespace: /tracking
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GpsTrackingService } from './gps-tracking.service';
import { RedisLocationStore } from './redis-location.store';
import { LocationData } from '../routing/types';
import {
  extractWsHandshakeToken,
  isWsStaffRole,
  resolveWsUserFromJwtPayload,
} from '../../chat/utils/ws-auth';

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────

interface AuthenticatedSocket extends Socket {
  data: {
    driverId?: string;
    vehicleId?: string;
    isAdmin?: boolean;
    isAuthenticated: boolean;
    subscriptions: Set<string>;
  };
}

interface LocationUpdatePayload {
  driverId: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  altitude?: number;
  shipmentId?: string;
  timestamp?: string;
}

interface SubscribeVehiclePayload {
  vehicleId: string;
}

// ─────────────────────────────────────────────────────────────────────────────

@WebSocketGateway({
  namespace: '/tracking',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
})
export class GpsTrackingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(GpsTrackingGateway.name);

  @WebSocketServer()
  server: Server;

  // Track which sockets are subscribed to which vehicles
  private vehicleSubscriptions: Map<string, Set<string>> = new Map(); // vehicleId -> Set<socketId>
  private adminSockets: Set<string> = new Set();

  constructor(
    private readonly gpsService: GpsTrackingService,
    private readonly redisStore: RedisLocationStore,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ──────────────────────────────────────────────────────────────────────────
  // Connection / Disconnection
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Handle new WebSocket connections. Authenticate the driver/client.
   */
  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    this.logger.log(`Client connected: ${client.id}`);

    client.data = {
      isAuthenticated: false,
      subscriptions: new Set<string>(),
    };

    try {
      const token = extractWsHandshakeToken(client.handshake);
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.emit('error', { message: 'Authentication token required' });
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync<{
        sub?: string;
        userId?: string;
        email?: string;
        role?: string;
        type?: string;
      }>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
        issuer: this.configService.get<string>(
          'JWT_ISSUER',
          'bhd-oman-marketplace',
        ),
        audience: this.configService.get<string>(
          'JWT_AUDIENCE',
          'bhd-oman-api',
        ),
      });

      const user = resolveWsUserFromJwtPayload(payload);
      if (!user) {
        client.emit('error', { message: 'Invalid token' });
        client.disconnect(true);
        return;
      }

      const isAdmin = isWsStaffRole(user.role);
      // Identity from JWT only — never trust handshake.auth.role / driverId / vehicleId
      client.data.isAuthenticated = true;
      client.data.driverId = user.userId;
      client.data.vehicleId = undefined;
      client.data.isAdmin = isAdmin;

      if (isAdmin) {
        this.adminSockets.add(client.id);
        this.logger.log(`Admin client connected: ${client.id}`);
      }

      client.join(`driver:${user.userId}`);

      client.emit('authenticated', {
        success: true,
        driverId: client.data.driverId,
        isAdmin: client.data.isAdmin,
      });

      this.logger.log(
        `Client ${client.id} authenticated - user: ${user.userId}, admin: ${isAdmin}`,
      );
    } catch (error) {
      this.logger.error(
        `Authentication failed for client ${client.id}: ${error}`,
      );
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect(true);
    }
  }

  /**
   * Handle client disconnection. Mark driver offline and clean up subscriptions.
   */
  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Unsubscribe from all vehicles
    for (const vehicleId of client.data.subscriptions) {
      this.unsubscribeFromVehicleInternal(client, vehicleId);
    }

    // Remove from admin set
    this.adminSockets.delete(client.id);

    // Mark driver offline if authenticated
    if (client.data.isAuthenticated && client.data.driverId) {
      await this.redisStore.markDriverOffline(client.data.driverId);

      // Notify other clients that driver went offline
      this.emitDriverStatusUpdate(client.data.driverId, 'offline');
    }

    client.data.subscriptions.clear();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Subscribe Messages
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Receive a location update from a driver.
   */
  @SubscribeMessage('location_update')
  async handleLocationUpdate(
    @MessageBody() payload: LocationUpdatePayload,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    if (!client.data.isAuthenticated) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      const driverId = client.data.isAdmin
        ? payload.driverId || client.data.driverId
        : client.data.driverId;
      // Non-staff may only publish for a server-bound vehicle (not client-supplied)
      const vehicleId = client.data.isAdmin
        ? payload.vehicleId || client.data.vehicleId
        : client.data.vehicleId;

      if (!driverId || !vehicleId) {
        client.emit('error', {
          message: client.data.isAdmin
            ? 'driverId and vehicleId required'
            : 'No assigned vehicle for location updates',
        });
        return;
      }

      if (
        !client.data.isAdmin &&
        payload.driverId &&
        payload.driverId !== client.data.driverId
      ) {
        client.emit('error', { message: 'Cannot spoof driver identity' });
        return;
      }

      if (
        !client.data.isAdmin &&
        payload.vehicleId &&
        payload.vehicleId !== client.data.vehicleId
      ) {
        client.emit('error', { message: 'Cannot spoof vehicle identity' });
        return;
      }

      // Update location in the tracking service
      const location = await this.gpsService.updateLocation(
        driverId,
        vehicleId,
        payload.latitude,
        payload.longitude,
        payload.speed,
        payload.heading,
        payload.accuracy,
        payload.altitude,
        payload.shipmentId,
      );

      // Broadcast to vehicle subscribers
      this.emitVehicleUpdate(vehicleId, location);

      // Broadcast to admin viewers
      this.emitDriverUpdate(driverId, location);

      // Acknowledge receipt
      client.emit('location_ack', {
        receivedAt: new Date().toISOString(),
        driverId,
        vehicleId,
      });
    } catch (error) {
      this.logger.error(`Error handling location update: ${error}`);
      client.emit('error', { message: 'Failed to process location update' });
    }
  }

  /**
   * Client subscribes to a specific vehicle's location updates.
   */
  @SubscribeMessage('subscribe_vehicle')
  async handleSubscribeVehicle(
    @MessageBody() payload: SubscribeVehiclePayload,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    if (!client.data.isAuthenticated) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    if (!client.data.isAdmin) {
      client.emit('error', { message: 'Admin access required' });
      return;
    }

    const { vehicleId } = payload;
    if (!vehicleId) {
      client.emit('error', { message: 'vehicleId required' });
      return;
    }

    // Join the vehicle room
    client.join(`vehicle:${vehicleId}`);
    client.data.subscriptions.add(vehicleId);

    // Track subscription
    if (!this.vehicleSubscriptions.has(vehicleId)) {
      this.vehicleSubscriptions.set(vehicleId, new Set());
    }
    this.vehicleSubscriptions.get(vehicleId)!.add(client.id);

    this.logger.log(`Client ${client.id} subscribed to vehicle ${vehicleId}`);

    // Send current location immediately
    try {
      const driverId = await this.redisStore.getDriverByVehicle(vehicleId);
      if (driverId) {
        const location = await this.gpsService.getCurrentLocation(driverId);
        if (location) {
          client.emit('vehicle_location', {
            vehicleId,
            driverId,
            location,
          });
        }
      }
    } catch {
      // Vehicle may not have a current location
    }

    client.emit('subscribed', { vehicleId, success: true });
  }

  /**
   * Client unsubscribes from a vehicle.
   */
  @SubscribeMessage('unsubscribe_vehicle')
  async handleUnsubscribeVehicle(
    @MessageBody() payload: SubscribeVehiclePayload,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    const { vehicleId } = payload;
    this.unsubscribeFromVehicleInternal(client, vehicleId);
    client.emit('unsubscribed', { vehicleId, success: true });
  }

  /**
   * Client subscribes to all fleet updates (admin only).
   */
  @SubscribeMessage('subscribe_all')
  async handleSubscribeAll(
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    if (!client.data.isAuthenticated) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    if (!client.data.isAdmin) {
      client.emit('error', { message: 'Admin access required' });
      return;
    }

    client.join('fleet:all');
    this.adminSockets.add(client.id);

    this.logger.log(`Admin client ${client.id} subscribed to all fleet`);

    // Send all active locations immediately
    try {
      const allLocations = await this.gpsService.getAllActiveLocations();
      client.emit('fleet_snapshot', {
        count: allLocations.length,
        locations: allLocations,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Error sending fleet snapshot: ${error}`);
    }

    client.emit('subscribed_all', { success: true });
  }

  /**
   * Client requests current location for a vehicle.
   */
  @SubscribeMessage('get_vehicle_location')
  async handleGetVehicleLocation(
    @MessageBody() payload: { vehicleId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    if (!client.data.isAuthenticated) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }
    if (!client.data.isAdmin) {
      client.emit('error', { message: 'Admin access required' });
      return;
    }

    try {
      const driverId = await this.redisStore.getDriverByVehicle(
        payload.vehicleId,
      );
      if (driverId) {
        const location = await this.gpsService.getCurrentLocation(driverId);
        client.emit('vehicle_location', {
          vehicleId: payload.vehicleId,
          driverId,
          location,
        });
      } else {
        client.emit('error', {
          message: `No driver found for vehicle ${payload.vehicleId}`,
        });
      }
    } catch (error) {
      client.emit('error', { message: 'Failed to get vehicle location' });
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Broadcast Methods
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Broadcast a vehicle location update to all subscribers of that vehicle.
   */
  emitVehicleUpdate(vehicleId: string, location: LocationData): void {
    this.server.to(`vehicle:${vehicleId}`).emit('vehicle_update', {
      vehicleId,
      driverId: location.driverId,
      latitude: location.latitude,
      longitude: location.longitude,
      speed: location.speed,
      heading: location.heading,
      accuracy: location.accuracy,
      altitude: location.altitude,
      timestamp: location.timestamp.toISOString(),
    });
  }

  /**
   * Broadcast a driver location update to admin viewers.
   */
  emitDriverUpdate(driverId: string, location: LocationData): void {
    // Send to driver room
    this.server.to(`driver:${driverId}`).emit('driver_update', {
      driverId,
      vehicleId: location.vehicleId,
      latitude: location.latitude,
      longitude: location.longitude,
      speed: location.speed,
      heading: location.heading,
      accuracy: location.accuracy,
      timestamp: location.timestamp.toISOString(),
    });

    // Send to fleet:all room for admin viewers
    this.server.to('fleet:all').emit('fleet_update', {
      driverId,
      vehicleId: location.vehicleId,
      latitude: location.latitude,
      longitude: location.longitude,
      speed: location.speed,
      heading: location.heading,
      timestamp: location.timestamp.toISOString(),
    });
  }

  /**
   * Emit a driver status change (online/offline/on_trip).
   */
  emitDriverStatusUpdate(
    driverId: string,
    status: 'online' | 'offline' | 'on_trip' | 'trip_ended',
    metadata?: Record<string, any>,
  ): void {
    this.server.to(`driver:${driverId}`).emit('driver_status', {
      driverId,
      status,
      ...metadata,
      timestamp: new Date().toISOString(),
    });

    this.server.to('fleet:all').emit('fleet_status_update', {
      driverId,
      status,
      ...metadata,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit a geofence alert.
   */
  emitGeofenceAlert(
    geofenceId: string,
    driverId: string,
    event: 'enter' | 'exit',
    lat: number,
    lng: number,
  ): void {
    const alert = {
      geofenceId,
      driverId,
      event,
      latitude: lat,
      longitude: lng,
      timestamp: new Date().toISOString(),
    };

    this.server.to(`driver:${driverId}`).emit('geofence_alert', alert);
    this.server.to('fleet:all').emit('geofence_alert', alert);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Private Helpers
  // ──────────────────────────────────────────────────────────────────────────

  private unsubscribeFromVehicleInternal(
    client: AuthenticatedSocket,
    vehicleId: string,
  ): void {
    client.leave(`vehicle:${vehicleId}`);
    client.data.subscriptions.delete(vehicleId);

    const subs = this.vehicleSubscriptions.get(vehicleId);
    if (subs) {
      subs.delete(client.id);
      if (subs.size === 0) {
        this.vehicleSubscriptions.delete(vehicleId);
      }
    }

    this.logger.log(
      `Client ${client.id} unsubscribed from vehicle ${vehicleId}`,
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Server-wide Broadcast
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Broadcast to all connected tracking clients.
   */
  broadcastToAll(event: string, data: any): void {
    this.server.emit(event, data);
  }

  /**
   * Get connection statistics.
   */
  getStats(): {
    totalConnections: number;
    adminConnections: number;
    vehicleSubscriptions: number;
  } {
    return {
      totalConnections: this.server.sockets.sockets.size,
      adminConnections: this.adminSockets.size,
      vehicleSubscriptions: this.vehicleSubscriptions.size,
    };
  }
}
