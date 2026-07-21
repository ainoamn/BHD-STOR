import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract the current authenticated user from the request.
 * Can be used to get the entire user object or a specific property.
 *
 * @example
 * // Get entire user
 * @CurrentUser() user: AuthenticatedUser
 *
 * @example
 * // Get specific property
 * @CurrentUser('sub') userId: string
 *
 * @example
 * // Get nested property
 * @CurrentUser('email') email: string
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);\n