import { HTTP_STATUS } from '../../shared/constants/http.constants.js';
import { AppError } from '../../shared/utils/app-error.js';
import type { AuthUser } from '../auth/auth.types.js';
import { usersRepository } from './users.repository.js';

export const usersService = {
  async getCurrentUser(userId?: string): Promise<AuthUser> {
    if (!userId) {
      throw new AppError('Unauthorized.', HTTP_STATUS.UNAUTHORIZED);
    }

    const user = await usersRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
    }

    return user;
  },

  async updateCurrentUser(userId: string, data: { name?: string; image?: string | null }): Promise<AuthUser> {
    const user = await usersRepository.update(userId, data);

    if (!user) {
      throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
    }

    return user;
  },
};
