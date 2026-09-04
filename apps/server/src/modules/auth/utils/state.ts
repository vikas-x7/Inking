import { AppError } from '../../../shared/errors/app-error.js';
import { ERROR_CODES } from '../../../shared/errors/error-codes.js';
import { HTTP_STATUS } from '../../../shared/constants/http.constants.js';

export const assertMatchingState = (receivedState: string, storedState?: string) => {
  if (!storedState || storedState !== receivedState) {
    throw new AppError('Invalid OAuth state.', {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.INVALID_OAUTH_STATE,
    });
  }
};
