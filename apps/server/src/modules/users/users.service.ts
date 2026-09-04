import { AuthenticationError, NotFoundError } from '../../shared/errors/app-error.js';
import { ERROR_CODES } from '../../shared/errors/error-codes.js';
import type { AuthUser } from '../auth/auth.types.js';
import { usersRepository } from './users.repository.js';

export const usersService = {
  async getCurrentUser(userId?: string): Promise<AuthUser> {
    if (!userId) {
      throw new AuthenticationError('Authentication required.', {
        code: ERROR_CODES.AUTHENTICATION_REQUIRED,
      });
    }

    const user = await usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found.');
    }

    return user;
  },

  async updateCurrentUser(
    userId: string,
    data: { name?: string; image?: string | null },
  ): Promise<AuthUser> {
    const user = await usersRepository.update(userId, data);

    if (!user) {
      throw new NotFoundError('User not found.');
    }

    return user;
  },
};
