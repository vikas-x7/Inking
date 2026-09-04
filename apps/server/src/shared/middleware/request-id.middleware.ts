import { createMiddleware } from 'hono/factory';
import type { AppBindings } from '../types/app.types.js';

const REQUEST_ID_HEADER = 'x-request-id';

/** Rejects values that could break header/log output. */
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{1,128}$/;

/**
 * Assigns every request a correlation ID.
 *
 * An incoming `X-Request-Id` is reused only when it is safe and valid;
 * otherwise a new UUID is generated. The ID is attached to the response
 * header, stored on the context for error responses, and recorded in logs.
 */
export const requestIdMiddleware = createMiddleware<AppBindings>(async (c, next) => {
  const incoming = c.req.header(REQUEST_ID_HEADER);
  const requestId = incoming && REQUEST_ID_PATTERN.test(incoming) ? incoming : crypto.randomUUID();

  c.set('requestId', requestId);
  c.set('requestStartAt', Date.now());
  c.header(REQUEST_ID_HEADER, requestId);

  await next();
});
