import { createMiddleware } from 'hono/factory';
import type { AppBindings } from '../../../shared/types/app.types.js';
import { authService } from '../auth.service.js';
import { getAccessCookie } from '../utils/cookies.js';

/**
 * Authentication guard. Errors thrown by `getCurrentUser` (missing, invalid or
 * expired token; unknown principal) are forwarded to the global handler, which
 * formats them as consistent 401 responses. Authenticated users set `userId`
 * on the context for downstream handlers.
 */
export const authGuard = createMiddleware<AppBindings>(async (c, next) => {
  const token = getAccessCookie(c);
  const user = await authService.getCurrentUser(token);

  c.set('userId', user.id);
  await next();
});
