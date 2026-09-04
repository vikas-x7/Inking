import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Hono } from 'hono';
import { SignJWT } from 'jose';

import app from '../src/app.js';
import {
  AppError,
  AuthorizationError,
  ConflictError,
  ExternalServiceError,
} from '../src/shared/errors/app-error.js';
import { ERROR_CODES } from '../src/shared/errors/error-codes.js';
import { globalErrorHandler, normalizeError } from '../src/shared/errors/global-error-handler.js';
import { requestIdMiddleware } from '../src/shared/middleware/request-id.middleware.js';
import type { AppBindings } from '../src/shared/types/app.types.js';
import { prisma } from './mocks/prisma.js';
import { accessCookie, userFixture } from './helpers.js';

const db = prisma;

const prismaError = (code: string, message = 'raw prisma detail') =>
  Object.assign(new Error(message), { name: 'PrismaClientKnownRequestError', code });

const buildTestApp = () => {
  const testApp = new Hono<AppBindings>();
  testApp.use('*', requestIdMiddleware);
  testApp.onError((error, c) => globalErrorHandler.handle(error, c));
  return testApp;
};

const expiredAccessCookie = async (userId: string) => {
  const secret = new TextEncoder().encode(process.env.ACCESS_JWT_SECRET as string);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({ userId, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(nowSeconds - 3_600)
    .setExpirationTime(nowSeconds - 1_800)
    .sign(secret);
  return `ink_access_token=${token}`;
};

describe('Global error handler', () => {
  it('returns the standardized AppError response with requestId', async () => {
    const testApp = buildTestApp();
    testApp.get('/boom', () => {
      throw new ConflictError('Already exists.', { code: ERROR_CODES.RESOURCE_ALREADY_EXISTS });
    });

    const res = await testApp.request('/boom');

    expect(res.status).toBe(409);
    expect(res.headers.get('x-request-id')).toBeTruthy();
    const body = (await res.json()) as {
      success: boolean;
      error: { code: string; message: string; requestId: string };
    };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe(ERROR_CODES.RESOURCE_ALREADY_EXISTS);
    expect(body.error.message).toBe('Already exists.');
    expect(body.error.requestId).toBe(res.headers.get('x-request-id'));
    expect(body.error).not.toHaveProperty('stack');
  });

  it('reuses a safe incoming request id', async () => {
    const testApp = buildTestApp();
    testApp.get('/boom', () => {
      throw new AuthorizationError('Forbidden.');
    });

    const res = await testApp.request('/boom', { headers: { 'x-request-id': 'client-req-123' } });

    expect(res.status).toBe(403);
    expect(res.headers.get('x-request-id')).toBe('client-req-123');
    const body = (await res.json()) as { error: { requestId: string; code: string } };
    expect(body.error.requestId).toBe('client-req-123');
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('does not leak the internal cause in the response', async () => {
    const testApp = buildTestApp();
    testApp.get('/boom', () => {
      throw new ExternalServiceError('Something failed.', {
        cause: new Error('connect to 10.0.0.1:5432 failed with password=supersecret'),
      });
    });

    const res = await testApp.request('/boom');

    expect(res.status).toBe(502);
    const raw = await res.text();
    expect(raw).not.toContain('supersecret');
    expect(raw).not.toContain('10.0.0.1');
    expect(raw).toContain('Something failed.');
  });

  it('returns a generic safe response for unknown errors in production', async () => {
    const testApp = buildTestApp();
    testApp.get('/boom', () => {
      throw new Error('secret internal detail with stack');
    });

    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const res = await testApp.request('/boom');
    process.env.NODE_ENV = previous;

    expect(res.status).toBe(500);
    const body = (await res.json()) as {
      success: boolean;
      error: { code: string; message: string };
    };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe(ERROR_CODES.INTERNAL_SERVER_ERROR);
    expect(body.error.message).not.toContain('secret internal detail');
    expect(JSON.stringify(body)).not.toContain('stack');
  });

  it('exposes limited debugging info for unknown errors outside production', async () => {
    const testApp = buildTestApp();
    testApp.get('/boom', () => {
      throw new Error('dev readable detail');
    });

    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    const res = await testApp.request('/boom');
    process.env.NODE_ENV = previous;

    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: { message: string; code: string } };
    expect(body.error.message).toContain('dev readable detail');
    expect(body.error.code).toBe(ERROR_CODES.INTERNAL_SERVER_ERROR);
    expect(JSON.stringify(body)).not.toContain('stack');
  });

  it('maps a ZodError into VALIDATION_ERROR with field details', async () => {
    const res = await app.request('/compile');

    expect(res.status).toBe(400);
    const body = (await res.json()) as {
      success: boolean;
      error: { code: string; message: string; details: Array<{ field: string; message: string }> };
    };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(body.error.details).toHaveLength(1);
    expect(body.error.details[0].field).toBe('text');
    expect(body.error.details[0].message.length).toBeGreaterThan(0);
  });

  it('includes validation details for broken JSON in the compile body', async () => {
    const res = await app.request('/compile', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{ not json',
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as {
      error: { code: string; details: Array<{ field: string }> };
    };
    expect(body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(body.error.details[0].field).toBe('body');
  });
});

describe('Validation', () => {
  it('formats Zod issues into field-level details for document creation', async () => {
    db.user.findUnique.mockResolvedValue(userFixture);

    const res = await app.request('/documents', {
      method: 'POST',
      headers: {
        cookie: await accessCookie(userFixture.id),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ content: 42 }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as {
      error: { code: string; details: Array<{ field: string; message: string }> };
    };
    expect(body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    const titleIssue = body.error.details.find((issue) => issue.field === 'title');
    expect(titleIssue?.message.length ?? 0).toBeGreaterThan(0);
  });
});

describe('Prisma error mapping', () => {
  it('maps a duplicate record (P2002) to 409 RESOURCE_ALREADY_EXISTS', async () => {
    db.user.findUnique.mockResolvedValue(userFixture);
    db.document.create.mockRejectedValue(prismaError('P2002'));

    const res = await app.request('/documents', {
      method: 'POST',
      headers: {
        cookie: await accessCookie(userFixture.id),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ title: 'T', content: 'C' }),
    });

    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe(ERROR_CODES.RESOURCE_ALREADY_EXISTS);
    expect(body.error.message).not.toContain('raw prisma detail');
  });

  it('maps a missing record (P2025) to 404 RESOURCE_NOT_FOUND', async () => {
    db.user.findUnique.mockResolvedValue(userFixture);
    db.user.update.mockRejectedValue(prismaError('P2025'));

    const res = await app.request('/users/me', {
      method: 'PATCH',
      headers: {
        cookie: await accessCookie(userFixture.id),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ name: 'New name' }),
    });

    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe(ERROR_CODES.RESOURCE_NOT_FOUND);
  });

  it('maps a foreign key failure (P2003) to 409 CONFLICT', async () => {
    db.user.findUnique.mockResolvedValue(userFixture);
    db.document.create.mockRejectedValue(prismaError('P2003'));

    const res = await app.request('/documents', {
      method: 'POST',
      headers: {
        cookie: await accessCookie(userFixture.id),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ title: 'T', content: 'C' }),
    });

    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe(ERROR_CODES.CONFLICT);
  });

  it('maps an unknown Prisma error to a generic 500 DATABASE_ERROR', async () => {
    db.user.findUnique.mockResolvedValue(userFixture);
    db.document.create.mockRejectedValue(prismaError('P2999'));

    const res = await app.request('/documents', {
      method: 'POST',
      headers: {
        cookie: await accessCookie(userFixture.id),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ title: 'T', content: 'C' }),
    });

    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe(ERROR_CODES.DATABASE_ERROR);
    expect(JSON.stringify(body)).not.toContain('raw prisma detail');
  });

  it('maps connection failures to 503 DATABASE_UNAVAILABLE', async () => {
    const connectionError = Object.assign(new Error("Can't reach database server"), {
      name: 'PrismaClientInitializationError',
      code: 'P1001',
    });
    db.user.findUnique.mockRejectedValue(connectionError);

    const res = await app.request('/auth/me', {
      headers: { cookie: await accessCookie(userFixture.id) },
    });

    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe(ERROR_CODES.DATABASE_UNAVAILABLE);
    expect(body.error.message).not.toContain('database server');
  });

  it('does not translate a generic Error into a database error', () => {
    const normalized = normalizeError(new Error('not a prisma error'));
    expect(normalized.appError.code).toBe(ERROR_CODES.INTERNAL_SERVER_ERROR);
  });
});

describe('Authentication errors', () => {
  it('returns 401 AUTHENTICATION_REQUIRED without a token', async () => {
    const res = await app.request('/auth/me');

    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe(ERROR_CODES.AUTHENTICATION_REQUIRED);
  });

  it('returns 401 INVALID_TOKEN for a malformed token', async () => {
    const res = await app.request('/auth/me', {
      headers: { cookie: 'ink_access_token=garbage.token.value' },
    });

    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe(ERROR_CODES.INVALID_TOKEN);
  });

  it('returns 401 TOKEN_EXPIRED for an expired token', async () => {
    const res = await app.request('/auth/me', {
      headers: { cookie: await expiredAccessCookie(userFixture.id) },
    });

    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe(ERROR_CODES.TOKEN_EXPIRED);
  });

  it('keeps requesting endpoints protected', async () => {
    const res = await app.request('/documents');

    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe(ERROR_CODES.AUTHENTICATION_REQUIRED);
  });
});

describe('Request ID', () => {
  it('adds x-request-id to 404 responses and matches the body', async () => {
    const res = await app.request('/definitely-not-a-route');

    expect(res.status).toBe(404);
    expect(res.headers.get('x-request-id')).toBeTruthy();
    const body = (await res.json()) as {
      success: boolean;
      error: { code: string; requestId: string };
    };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe(ERROR_CODES.RESOURCE_NOT_FOUND);
    expect(body.error.requestId).toBe(res.headers.get('x-request-id'));
  });

  it('rejects unsafe incoming request ids and generates a new one', async () => {
    const res = await app.request('/definitely-not-a-route', {
      headers: { 'x-request-id': 'bad header value!' },
    });

    expect(res.status).toBe(404);
    const requestId = res.headers.get('x-request-id');
    expect(requestId).toBeTruthy();
    expect(requestId).not.toContain('header value');
  });

  it('sets the x-request-id header on successful responses too', async () => {
    db.user.findUnique.mockResolvedValue(userFixture);

    const res = await app.request('/auth/me', {
      headers: { cookie: await accessCookie(userFixture.id) },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('x-request-id')).toBeTruthy();
  });
});

describe('AppError unit behavior', () => {
  it('defaults to generic internal error parameters', () => {
    const error = new AppError('Something went wrong.');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe(ERROR_CODES.INTERNAL_SERVER_ERROR);
    expect(error.isOperational).toBe(true);
    expect(error.isRetryable).toBe(false);
  });

  it('normalizes an unknown value into an AppError', () => {
    const { appError, original } = normalizeError('string thrown');
    expect(appError.code).toBe(ERROR_CODES.INTERNAL_SERVER_ERROR);
    expect(original).toBe('string thrown');
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});
