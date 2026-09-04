import type { ZodError } from 'zod';
import type { ErrorCode } from './error-codes.js';
import type { ErrorDetails } from './app-error.js';

/**
 * Standard error response envelope returned by the global handler for every
 * failed API request. Success responses keep their existing shapes.
 */
export type ApiErrorBody = {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetails[];
    requestId: string;
  };
};

/**
 * Converts Zod issues into clean field-level details. The source shape is not
 * relevant to clients; only `{ field, message }` pairs are exposed.
 */
export const formatZodErrorIssues = (error: ZodError): ErrorDetails[] =>
  error.issues.map((issue) => ({
    field: issue.path.map((segment) => String(segment)).join('.') || 'body',
    message: issue.message,
  }));

export const buildErrorResponseBody = (params: {
  code: ErrorCode;
  message: string;
  requestId: string;
  details?: ErrorDetails[];
}): ApiErrorBody => {
  const body: ApiErrorBody = {
    success: false,
    error: {
      code: params.code,
      message: params.message,
      requestId: params.requestId,
    },
  };

  if (params.details && params.details.length > 0) {
    body.error.details = params.details;
  }

  return body;
};
