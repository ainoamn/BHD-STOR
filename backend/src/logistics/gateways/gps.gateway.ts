import { Injectable, Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  extractWsHandshakeToken,
  resolveWsUserFromJwtPayload,
} from '../../chat/utils/ws-auth';

@WebSocketGateway({
  namespace: '/logistics/gps',
  cors: { origin: '*' },
})
@Injectable()
export class GPSGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(GPSGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = extractWsHandshakeToken(client.handshake);
      if (!token) {
        this.logger.warn(`GPS client ${client.id} missing token`);
        client.emit('error', { message: 'Authentication required' });
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

      client.data.userId = user.userId;
      client.data.role = user.role;
      this.logger.debug(
        `GPS client connected: ${client.id} as ${user.userId}`,
      );
    } catch (error) {
      this.logger.warn(
        `GPS auth failed for ${client.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`GPS client disconnected: ${client.id}`);
  }
}
