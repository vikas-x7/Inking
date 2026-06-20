import type { ErrorHandler } from 'hono';
import { ZodError } from 'zod';
import { AppError } from '../utils/app-error.js';

export const errorHandler: ErrorHandler = (error, c) => {
  if (error instanceof ZodError) {
    return c.json({ error: 'Invalid request.', issues: error.issues }, 400);
  }

  if (error instanceof AppError) {
    return c.json({ error: error.message }, error.statusCode);
  }

  console.error(error);
  return c.json({ error: 'Internal server error' }, 500);
};
