export { AppError, isAppError } from './app-error.js';
export {
  AuthenticationError,
  AuthorizationError,
  CompilerError,
  CompilerTimeoutError,
  CompilerUnavailableError,
  ConflictError,
  DatabaseError,
  ExternalServiceError,
  NotFoundError,
  ValidationError,
} from './app-error.js';
export type { AppErrorOptions, ErrorDetails } from './app-error.js';
export { ERROR_CODES } from './error-codes.js';
export type { ErrorCode } from './error-codes.js';
export { globalErrorHandler, normalizeError } from './global-error-handler.js';
export { errorLogger } from './error-logger.js';
export { isPrismaError, translatePrismaError } from './prisma-errors.js';
export { buildErrorResponseBody, formatZodErrorIssues } from './error-response.js';
export type { ApiErrorBody } from './error-response.js';
