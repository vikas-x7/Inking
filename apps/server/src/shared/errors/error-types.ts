import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { ErrorCode } from './error-codes.js';
import { ERROR_CODES } from './error-codes.js';
import { HTTP_STATUS } from '../constants/http.constants.js';

/**
 * Broad classification of an error. Each error type carries a default HTTP
 * status code and a default machine-readable code; concrete `AppError`
 * subclasses can override either when the situation requires it.
 */
export const ERROR_TYPES = {
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  NOT_FOUND: 'not-found',
  CONFLICT: 'conflict',
  EXTERNAL_SERVICE: 'external-service',
  COMPILER: 'compiler',
  DATABASE: 'database',
  INTERNAL: 'internal',
} as const;

export type ErrorType = (typeof ERROR_TYPES)[keyof typeof ERROR_TYPES];

export const ERROR_TYPE_DEFAULTS: Record<
  ErrorType,
  { statusCode: ContentfulStatusCode; code: ErrorCode }
> = {
  [ERROR_TYPES.VALIDATION]: {
    statusCode: HTTP_STATUS.BAD_REQUEST,
    code: ERROR_CODES.VALIDATION_ERROR,
  },
  [ERROR_TYPES.AUTHENTICATION]: {
    statusCode: HTTP_STATUS.UNAUTHORIZED,
    code: ERROR_CODES.AUTHENTICATION_REQUIRED,
  },
  [ERROR_TYPES.AUTHORIZATION]: { statusCode: HTTP_STATUS.FORBIDDEN, code: ERROR_CODES.FORBIDDEN },
  [ERROR_TYPES.NOT_FOUND]: {
    statusCode: HTTP_STATUS.NOT_FOUND,
    code: ERROR_CODES.RESOURCE_NOT_FOUND,
  },
  [ERROR_TYPES.CONFLICT]: { statusCode: HTTP_STATUS.CONFLICT, code: ERROR_CODES.CONFLICT },
  [ERROR_TYPES.EXTERNAL_SERVICE]: {
    statusCode: HTTP_STATUS.BAD_GATEWAY,
    code: ERROR_CODES.EXTERNAL_SERVICE_ERROR,
  },
  [ERROR_TYPES.COMPILER]: { statusCode: HTTP_STATUS.BAD_GATEWAY, code: ERROR_CODES.COMPILER_ERROR },
  [ERROR_TYPES.DATABASE]: {
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: ERROR_CODES.DATABASE_ERROR,
  },
  [ERROR_TYPES.INTERNAL]: {
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: ERROR_CODES.INTERNAL_SERVER_ERROR,
  },
};
