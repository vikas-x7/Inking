import { ConflictError, DatabaseError, NotFoundError, type AppError } from './app-error.js';
import { ERROR_CODES } from './error-codes.js';
import { HTTP_STATUS } from '../constants/http.constants.js';

/**
 * Prisma database error translation.
 *
 * The server does not depend on `@prisma/client` directly, so errors are
 * detected structurally (stable class names / Prisma `P####` codes) instead of
 * via `instanceof`. Original Prisma errors are never exposed to clients; they
 * are only attached as the `cause` for server logs.
 */

type PrismaErrorLike = Error & { code?: string };

const PRISMA_ERROR_NAMES = new Set([
  'PrismaClientKnownRequestError',
  'PrismaClientUnknownRequestError',
  'PrismaClientInitializationError',
  'PrismaClientValidationError',
  'PrismaClientRustPanicError',
]);

/** Connection-level failures that indicate the database is unreachable. */
const DB_UNAVAILABLE_CODES = new Set([
  'P1001',
  'P1002',
  'P1017',
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'EAI_AGAIN',
  'ENOTFOUND',
]);

export const isPrismaError = (error: unknown): error is PrismaErrorLike => {
  if (!(error instanceof Error)) return false;

  const code = (error as { code?: unknown }).code;
  if (typeof code === 'string' && /^P\d{4}$/.test(code)) return true;

  return PRISMA_ERROR_NAMES.has(error.name);
};

const getPrismaCode = (error: PrismaErrorLike): string | undefined => {
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
};

/**
 * Maps a detected Prisma error into the matching `AppError`.
 *
 * Returns undefined when the error is not a Prisma error so callers can fall
 * through to generic handling.
 */
export const translatePrismaError = (error: unknown): AppError | undefined => {
  if (!isPrismaError(error)) return undefined;

  const code = getPrismaCode(error);

  switch (code) {
    case 'P2002':
      return new ConflictError('A record with this value already exists.', {
        code: ERROR_CODES.RESOURCE_ALREADY_EXISTS,
        cause: error,
      });
    case 'P2025':
      return new NotFoundError('The requested record does not exist.', { cause: error });
    case 'P2003':
      return new ConflictError('The request references a record that does not exist.', {
        cause: error,
      });
    default:
      if (code !== undefined && DB_UNAVAILABLE_CODES.has(code)) {
        return new DatabaseError('The database is temporarily unavailable.', {
          code: ERROR_CODES.DATABASE_UNAVAILABLE,
          statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
          isRetryable: true,
          cause: error,
        });
      }
      return new DatabaseError('A database error occurred.', { cause: error });
  }
};
