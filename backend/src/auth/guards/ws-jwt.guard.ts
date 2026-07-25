import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

/**
 * Ensures the WebSocket client was authenticated at connection time
 * (ChatGateway.handleConnection verifies JWT and sets client.user).
 */
@Injectable()
export class WsJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<{
      user?: { userId?: string };
    }>();
    if (!client?.user?.userId) {
      throw new WsException('Unauthorized');
    }
    return true;
  }
}
