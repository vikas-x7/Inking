import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { env } from './config/env.js';
import { registerRoutes } from './routes.js';
import { errorHandler } from './shared/middleware/error.middleware.js';

const app = new Hono();

// In production FRONTEND_URL is the Vercel deployment URL and API_URL is the
// Render URL, so every request from the browser is cross-origin. Allow exactly
// that frontend origin with credentials (required for the HttpOnly cookies set
// on the Render domain to be sent back on Vercel-initiated fetch() calls).
app.use(
  '*',
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);

app.onError(errorHandler);

app.get('/', (c) => c.json({ status: 'ok', service: 'ink-api' }));

registerRoutes(app);

export default app;
