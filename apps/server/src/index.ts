import { serve } from '@hono/node-server';
import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './database/prisma.js';
import { errorLogger } from './shared/errors/error-logger.js';

const port = Number(process.env.PORT) || Number(new URL(env.API_URL).port) || 3001;
const SHUTDOWN_TIMEOUT_MS = 10_000;

const server = serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`ink-api listening on http://localhost:${info.port}`);
  },
);

let shuttingDown = false;

/**
 * Idempotent graceful shutdown: stops accepting connections, closes the Prisma
 * connection pool, and force-exits after a timeout so a stuck close cannot
 * leave the process hanging.
 */
const shutdown = (exitCode: number) => {
  if (shuttingDown) return;
  shuttingDown = true;

  const forceExit = setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  server.close(() => {
    prisma.$disconnect().finally(() => process.exit(exitCode));
  });
};

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully.');
  shutdown(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully.');
  shutdown(0);
});

process.on('uncaughtException', (error) => {
  errorLogger.fatal({
    message: 'Uncaught exception, exiting.',
    errorName: error instanceof Error ? error.name : typeof error,
    stack: error instanceof Error ? error.stack : String(error),
    service: 'ink-api',
  });
  shutdown(1);
});

process.on('unhandledRejection', (reason) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  errorLogger.fatal({
    message: 'Unhandled promise rejection, exiting.',
    errorName: error.name,
    stack: error.stack,
    service: 'ink-api',
  });
  shutdown(1);
});
