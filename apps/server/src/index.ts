import { serve } from '@hono/node-server';
import app from './app.js';
import { env } from './config/env.js';

const port = Number(new URL(env.API_URL).port);

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`ink-api listening on http://localhost:${info.port}`);
  },
);
