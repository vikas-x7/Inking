import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { env } from './config/env.js';
import { registerRoutes } from './routes.js';
import { errorHandler } from './shared/middleware/error.middleware.js';

const app = new Hono();

// TEMPORARY production diagnostics for the POST /compile 403 investigation.
// Logs method/path/origin/cookie-presence/status only — never secrets or
// cookie/token values. Remove once the source of the production 403 is found.
app.use('*', async (c, next) => {
  const startedAt = Date.now();
  await next();
  console.log(
    `[diag] ${c.req.method} ${c.req.path} origin=${c.req.header('origin') ?? 'none'} cookies=${c.req.header('cookie') ? 'yes' : 'no'} status=${c.res.status} ${Date.now() - startedAt}ms`,
  );
});

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
