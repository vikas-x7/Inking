import { AppError } from '../../../shared/utils/app-error.js';
import { HTTP_STATUS } from '../../../shared/constants/http.constants.js';

export const assertMatchingState = (receivedState: string, storedState?: string) => {
  if (!storedState || storedState !== receivedState) {
    throw new AppError('Invalid OAuth state.', HTTP_STATUS.BAD_REQUEST);
  }
};
