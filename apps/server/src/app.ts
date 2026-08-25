import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { env } from './config/env.js';
import { registerRoutes } from './routes.js';
import { errorHandler } from './shared/middleware/error.middleware.js';

const app = new Hono();

// The browser only ever talks to FRONTEND_URL via the Next.js /api rewrite proxy
// (same origin), so requests here are normally server-to-server. CORS is kept for
// local development, where the dev frontend at :3000 talks straight to :3001.
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
