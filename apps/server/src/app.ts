import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { env } from './config/env.js';
import { registerRoutes } from './routes.js';
import { errorHandler } from './shared/middleware/error.middleware.js';

const app = new Hono();

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

app.onError(errorHandler);

app.get('/', (c) => c.json({ status: 'ok', service: 'ink-api' }));

registerRoutes(app);

export default app;
