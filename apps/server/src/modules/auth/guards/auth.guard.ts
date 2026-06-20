import { createMiddleware } from 'hono/factory';
import { HTTP_STATUS } from '../../../shared/constants/http.constants.js';
import { AppError } from '../../../shared/utils/app-error.js';
import type { AppBindings } from '../../../shared/types/app.types.js';
import { authService } from '../auth.service.js';
import { getSessionCookie } from '../utils/cookies.js';

export const authGuard = createMiddleware<AppBindings>(async (c, next) => {
  const token = getSessionCookie(c);
  const user = await authService.getCurrentUser(token).catch(() => null);

  if (!user) {
    throw new AppError('Unauthorized.', HTTP_STATUS.UNAUTHORIZED);
  }

  c.set('userId', user.id);
  await next();
});
