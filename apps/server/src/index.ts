import { serve } from '@hono/node-server';
import app from './app.js';
import { env } from './config/env.js';

const port = Number(process.env.PORT) || Number(new URL(env.API_URL).port) || 3001;

const server = serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`ink-api listening on http://localhost:${info.port}`);
  },
);

const shutdown = () => {
  console.log('Shutting down...');
  server.close(() => process.exit(0));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
