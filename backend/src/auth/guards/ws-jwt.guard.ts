import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

/**
 * Minimal WebSocket JWT guard stub.
 * Attach `client.user` upstream (or extend to verify tokens).
 */
@Injectable()
export class WsJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<{ user?: unknown }>();
    if (!client?.user) {
      throw new WsException('Unauthorized');
    }
    return true;
  }
}
