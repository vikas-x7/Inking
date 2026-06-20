import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { env } from './config/env.js';
import { registerRoutes } from './routes.js';
import { errorHandler } from './shared/middleware/error.middleware.js';

const app = new Hono();

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
