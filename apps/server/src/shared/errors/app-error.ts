import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { HTTP_STATUS } from '../constants/http.constants.js';
import { ERROR_CODES, type ErrorCode } from './error-codes.js';
import { ERROR_TYPE_DEFAULTS, ERROR_TYPES, type ErrorType } from './error-types.js';

/**
 * A single field-level validation issue exposed in API responses.
 */
export type ErrorDetails = {
  field: string;
  message: string;
};

export interface AppErrorOptions {
  /** Error type; determines default status code and default error code. */
  type?: ErrorType;
  /** HTTP status code to return. Defaults to the error type's default. */
  statusCode?: ContentfulStatusCode;
  /** Stable machine-readable code. Defaults to the error type's default. */
  code?: ErrorCode;
  /**
   * Optional field-level validation details. Only data deemed safe for public
   * exposure should be attached here; anything sensitive belongs in `cause`.
   */
  details?: ErrorDetails[];
  /** Internal cause. Never serialized into API responses, server logs only. */
  cause?: unknown;
  /**
   * True for recoverable/expected failures (e.g. validation, not-found),
   * false for unexpected faults. Drives the log level and retry decisions.
   */
  isOperational?: boolean;
  /** Whether retrying the request could succeed. */
  isRetryable?: boolean;
}

/**
 * Base application error. Every error that crosses the HTTP boundary should be
 * (or be wrapped by) an `AppError` so the global handler can produce a safe,
 * consistent response.
 *
 * Constructor contract:
 * - The message is the public message shown to clients. Never embed secrets,
 *   tokens, SQL, filesystem paths, or internal configuration here.
 * - Sensitive internals belong in `cause`, which is only written to server logs.
 */
export class AppError extends Error {
  readonly statusCode: ContentfulStatusCode;
  readonly code: ErrorCode;
  readonly type: ErrorType;
  readonly details?: ErrorDetails[];
  readonly isOperational: boolean;
  readonly isRetryable: boolean;
  readonly cause?: unknown;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'AppError';

    const type = options.type ?? ERROR_TYPES.INTERNAL;
    const defaults = ERROR_TYPE_DEFAULTS[type];

    this.type = type;
    this.code = options.code ?? defaults.code;
    this.statusCode = options.statusCode ?? defaults.statusCode;
    this.details = options.details;
    this.isOperational = options.isOperational ?? true;
    this.isRetryable = options.isRetryable ?? false;

    if (options.cause !== undefined) {
      this.cause = options.cause;
    }

    Error.captureStackTrace?.(this, this.constructor);
  }
}

export const isAppError = (error: unknown): error is AppError => error instanceof AppError;

/** Primary input/contract validation failed. Always HTTP 400. */
export class ValidationError extends AppError {
  constructor(message = 'Request validation failed.', options: AppErrorOptions = {}) {
    super(message, {
      ...options,
      type: ERROR_TYPES.VALIDATION,
      code: ERROR_CODES.VALIDATION_ERROR,
      statusCode: HTTP_STATUS.BAD_REQUEST,
      isOperational: true,
    });
  }
}

/**
 * The request is not authenticated. The specific code distinguishes:
 * - `AUTHENTICATION_REQUIRED`  missing credentials / unknown principal
 * - `INVALID_TOKEN`             token present but invalid
 * - `TOKEN_EXPIRED`             token present but expired
 * Always HTTP 401. Public messages never reveal whether an account exists.
 */
export class AuthenticationError extends AppError {
  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, {
      ...options,
      type: ERROR_TYPES.AUTHENTICATION,
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      isOperational: true,
    });
  }
}

/** The authenticated principal is not allowed to perform the action. HTTP 403. */
export class AuthorizationError extends AppError {
  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, {
      ...options,
      type: ERROR_TYPES.AUTHORIZATION,
      code: ERROR_CODES.FORBIDDEN,
      statusCode: HTTP_STATUS.FORBIDDEN,
      isOperational: true,
    });
  }
}

/** A resource does not exist or is not visible to the requester. HTTP 404. */
export class NotFoundError extends AppError {
  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, {
      ...options,
      type: ERROR_TYPES.NOT_FOUND,
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      statusCode: HTTP_STATUS.NOT_FOUND,
      isOperational: true,
    });
  }
}

/** The request conflicts with the current state of a resource. HTTP 409. */
export class ConflictError extends AppError {
  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, {
      ...options,
      type: ERROR_TYPES.CONFLICT,
      statusCode: HTTP_STATUS.CONFLICT,
      isOperational: true,
    });
  }
}

/** A dependency outside the process (database, OAuth, etc.) failed. HTTP 502 by default. */
export class ExternalServiceError extends AppError {
  readonly service: string;

  constructor(message: string, options: AppErrorOptions & { service?: string } = {}) {
    super(message, {
      ...options,
      type: ERROR_TYPES.EXTERNAL_SERVICE,
      code: options.code ?? ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      isOperational: true,
    });
    this.name = 'ExternalServiceError';
    this.service = options.service ?? 'external';
  }
}

/** A database operation failed. Defaults to HTTP 500; override for availability errors. */
export class DatabaseError extends AppError {
  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, {
      ...options,
      type: ERROR_TYPES.DATABASE,
      code: options.code ?? ERROR_CODES.DATABASE_ERROR,
      isOperational: false,
    });
    this.name = 'DatabaseError';
  }
}

/** Generic compiler integration failure (invalid response, rejected request). HTTP 502. */
export class CompilerError extends ExternalServiceError {
  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, {
      ...options,
      service: 'compiler',
      type: ERROR_TYPES.COMPILER,
      code: options.code ?? ERROR_CODES.COMPILER_ERROR,
      statusCode: options.statusCode ?? HTTP_STATUS.BAD_GATEWAY,
    });
    this.name = 'CompilerError';
  }
}

/** The compiler request timed out or was aborted. HTTP 504. */
export class CompilerTimeoutError extends CompilerError {
  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, {
      ...options,
      code: ERROR_CODES.COMPILER_TIMEOUT,
      statusCode: HTTP_STATUS.GATEWAY_TIMEOUT,
      isRetryable: true,
    });
    this.name = 'CompilerTimeoutError';
  }
}

/** The compiler is unreachable or returned a server error. HTTP 503. */
export class CompilerUnavailableError extends CompilerError {
  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, {
      ...options,
      code: ERROR_CODES.COMPILER_UNAVAILABLE,
      statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
      isRetryable: true,
    });
    this.name = 'CompilerUnavailableError';
  }
}
