import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { env } from './config/env.js';
import { registerRoutes } from './routes.js';
import { AppError } from './shared/errors/app-error.js';
import { ERROR_CODES } from './shared/errors/error-codes.js';
import { globalErrorHandler } from './shared/errors/global-error-handler.js';
import { HTTP_STATUS } from './shared/constants/http.constants.js';
import { requestIdMiddleware } from './shared/middleware/request-id.middleware.js';
import type { AppBindings } from './shared/types/app.types.js';

const app = new Hono<AppBindings>();

// Every request gets a correlation ID before anything else runs so errors,
// logs, and responses can all reference it.
app.use('*', requestIdMiddleware);

// Cronix-style cross-origin setup: the browser calls this API DIRECTLY from the
// Vercel frontend. FRONTEND_URL (the Vercel origin) is the only allowed origin,
// and credentials:true is required so the SameSite=None cookies set on this
// (Render) domain are sent back on those cross-site fetch() calls.
app.use(
  '*',
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);

// Single registration point for the application-wide error handler.
app.onError((error, c) => globalErrorHandler.handle(error, c));

// Unknown routes return the same standard error shape as everything else.
app.notFound((c) =>
  globalErrorHandler.handle(
    new AppError('Route not found.', {
      statusCode: HTTP_STATUS.NOT_FOUND,
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      isOperational: true,
    }),
    c,
  ),
);

app.get('/', (c) => c.json({ status: 'ok', service: 'ink-api' }));

registerRoutes(app);

export default app;
