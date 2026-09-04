import type { Context } from 'hono';
import { ZodError } from 'zod';
import { isProductionEnv } from '../../config/env.js';
import { HTTP_STATUS } from '../constants/http.constants.js';
import type { AppBindings } from '../types/app.types.js';
import { AppError, isAppError, ValidationError } from './app-error.js';
import { ERROR_CODES } from './error-codes.js';
import { errorLogger } from './error-logger.js';
import {
  buildErrorResponseBody,
  formatZodErrorIssues,
  type ApiErrorBody,
} from './error-response.js';
import { translatePrismaError } from './prisma-errors.js';

const GENERIC_INTERNAL_MESSAGE = 'An unexpected error occurred.';
const MAX_DEBUG_MESSAGE_LENGTH = 300;

type NormalizedError = {
  appError: AppError;
  original: unknown;
  /** Original message for unknown errors; only surfaced in non-production. */
  debugMessage?: string;
};

const isZodError = (error: unknown): error is ZodError => error instanceof ZodError;

/**
 * Reduces any thrown value into an `AppError` the handler can format and log.
 * Kept as a pure function so the mapping rules are unit-testable.
 */
export const normalizeError = (error: unknown): NormalizedError => {
  if (isAppError(error)) {
    return { appError: error, original: error };
  }

  if (isZodError(error)) {
    return {
      appError: new ValidationError('Request validation failed.', {
        details: formatZodErrorIssues(error),
        cause: error,
      }),
      original: error,
    };
  }

  const prismaError = translatePrismaError(error);
  if (prismaError) {
    return { appError: prismaError, original: error };
  }

  const options = {
    code: ERROR_CODES.INTERNAL_SERVER_ERROR,
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    isOperational: false,
    cause: error,
  };

  if (error instanceof Error) {
    return {
      appError: new AppError(GENERIC_INTERNAL_MESSAGE, options),
      original: error,
      debugMessage: error.message,
    };
  }

  return { appError: new AppError(GENERIC_INTERNAL_MESSAGE, options), original: error };
};

const inferServiceFromPath = (path: string): string => {
  const segment = path.split('/').find((part) => part.length > 0 && part !== 'compile');
  return segment ?? 'root';
};

const getCauseStack = (error: unknown): string | undefined => {
  if (error instanceof Error) return error.stack;
  return String(error);
};

/**
 * The single centralized error handler for the application lifecycle.
 *
 * Singleton: only one instance exists and it is registered exactly once during
 * app initialization. Routes/controllers must not instantiate their own
 * handlers - they either throw `AppError`s or let the handler normalize
 * anything unexpected.
 */
class GlobalErrorHandler {
  private static instance: GlobalErrorHandler | undefined;

  private constructor() {}

  static getInstance(): GlobalErrorHandler {
    GlobalErrorHandler.instance ??= new GlobalErrorHandler();
    return GlobalErrorHandler.instance;
  }

  handle(error: unknown, c: Context<AppBindings>): Response {
    const normalized = normalizeError(error);
    const { appError } = normalized;
    const requestId = this.resolveRequestId(c);
    const details = appError.details;
    const body = buildErrorResponseBody({
      code: appError.code,
      message: this.publicMessage(normalized),
      requestId,
      details,
    });

    this.log(normalized, requestId, c, body);

    return c.json(body, appError.statusCode, { 'x-request-id': requestId });
  }

  /**
   * Reuses a validated incoming request ID or generates one. This guarantees
   * the response body, response header, and logs all share the same value even
   * if the request-id middleware has not run (e.g. unit tests wiring the
   * handler directly).
   */
  private resolveRequestId(c: Context<AppBindings>): string {
    const existing = c.get('requestId');
    if (typeof existing === 'string' && existing.length > 0) {
      return existing;
    }

    const generated = crypto.randomUUID();
    c.set('requestId', generated);
    c.header('x-request-id', generated);
    return generated;
  }

  private publicMessage(normalized: NormalizedError): string {
    const isKnownAppError = isAppError(normalized.original);

    if (isKnownAppError || !normalized.debugMessage) {
      return normalized.appError.message;
    }

    if (!isProductionEnv() && normalized.debugMessage) {
      return truncate(normalized.debugMessage, MAX_DEBUG_MESSAGE_LENGTH);
    }

    return GENERIC_INTERNAL_MESSAGE;
  }

  private log(
    normalized: NormalizedError,
    requestId: string,
    c: Context<AppBindings>,
    body: ApiErrorBody,
  ): void {
    const { appError, original } = normalized;
    const level = appError.isOperational ? 'warn' : 'error';
    const startedAt = c.get('requestStartAt');
    const userId = c.get('userId');

    errorLogger[level]({
      message: appError.message,
      requestId,
      method: c.req.method,
      path: c.req.path,
      statusCode: appError.statusCode,
      errorCode: body.error.code,
      errorName: original instanceof Error ? original.name : typeof original,
      userId,
      service: inferServiceFromPath(c.req.path),
      durationMs: typeof startedAt === 'number' ? Date.now() - startedAt : undefined,
      isRetryable: appError.isRetryable || undefined,
      stack: getCauseStack(original),
    });
  }
}

const truncate = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max)}…` : value;

/** The application-wide singleton error handler. */
export const globalErrorHandler = GlobalErrorHandler.getInstance();
