import { HTTP_STATUS } from '../constants/http.constants.js';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: ContentfulStatusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
