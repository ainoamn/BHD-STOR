import { Injectable, Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/logistics/gps',
  cors: { origin: '*' },
})
@Injectable()
export class GPSGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(GPSGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket): void {
    this.logger.debug(`GPS client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`GPS client disconnected: ${client.id}`);
  }
}
