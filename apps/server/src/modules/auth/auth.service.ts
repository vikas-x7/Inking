import { env } from '../../config/env.js';
import { HTTP_STATUS } from '../../shared/constants/http.constants.js';
import { AppError, AuthenticationError } from '../../shared/errors/app-error.js';
import { ERROR_CODES } from '../../shared/errors/error-codes.js';
import { AUTH_PROVIDER } from './auth.constants.js';
import { authRepository } from './auth.repository.js';
import type { AuthTokenPair, AuthUser } from './auth.types.js';
import { githubProvider } from './providers/github.provider.js';
import { googleProvider } from './providers/google.provider.js';
import {
  createAccessJwt,
  createRefreshJwt,
  verifyAccessJwt,
  verifyRefreshJwt,
} from './utils/jwt.js';

export const authService = {
  startGoogleOAuth() {
    return googleProvider.createAuthorization();
  },

  startGithubOAuth() {
    return githubProvider.createAuthorization();
  },

  async handleGoogleCallback(code: string, codeVerifier: string) {
    const { profile, tokens } = await googleProvider.validateCallback(code, codeVerifier);
    return this.signInWithOAuthProfile(profile, tokens);
  },

  async handleGithubCallback(code: string) {
    const { profile, tokens } = await githubProvider.validateCallback(code);
    return this.signInWithOAuthProfile(profile, tokens);
  },

  async signInWithOAuthProfile(
    profile: Parameters<typeof authRepository.upsertOAuthUser>[0],
    tokens: Parameters<typeof authRepository.upsertOAuthUser>[1],
  ): Promise<{ user: AuthUser } & AuthTokenPair> {
    if (profile.provider !== AUTH_PROVIDER.google && profile.provider !== AUTH_PROVIDER.github) {
      throw new AppError('Unsupported OAuth provider.', {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        code: ERROR_CODES.BAD_REQUEST,
      });
    }

    const user = await authRepository.upsertOAuthUser(profile, tokens);
    const accessToken = await createAccessJwt(user.id);
    const refreshToken = await createRefreshJwt(user.id);

    return { user, accessToken, refreshToken };
  },

  async getOrCreateUserDocument(userId: string) {
    const existing = await authRepository.findMostRecentUnarchived(userId);

    if (existing) {
      return existing;
    }

    return authRepository.createUserDocument(userId, 'Untitled', '');
  },

  async getCurrentUser(accessToken?: string): Promise<AuthUser> {
    if (!accessToken) {
      throw new AuthenticationError('Authentication required.', {
        code: ERROR_CODES.AUTHENTICATION_REQUIRED,
      });
    }

    const result = await verifyAccessJwt(accessToken);

    if (!result.ok) {
      throw new AuthenticationError(
        result.reason === 'expired' ? 'Your session has expired.' : 'Invalid session.',
        {
          code: result.reason === 'expired' ? ERROR_CODES.TOKEN_EXPIRED : ERROR_CODES.INVALID_TOKEN,
        },
      );
    }

    const user = await authRepository.findUserById(result.userId);

    if (!user) {
      // Generic 401: do not reveal whether the account still exists.
      throw new AuthenticationError('Authentication required.', {
        code: ERROR_CODES.AUTHENTICATION_REQUIRED,
      });
    }

    return user;
  },

  async refreshTokens(refreshToken?: string): Promise<{ user: AuthUser } & AuthTokenPair> {
    if (!refreshToken) {
      throw new AuthenticationError('Authentication required.', {
        code: ERROR_CODES.AUTHENTICATION_REQUIRED,
      });
    }

    const result = await verifyRefreshJwt(refreshToken);

    if (!result.ok) {
      throw new AuthenticationError(
        result.reason === 'expired' ? 'Your session has expired.' : 'Invalid session.',
        {
          code: result.reason === 'expired' ? ERROR_CODES.TOKEN_EXPIRED : ERROR_CODES.INVALID_TOKEN,
        },
      );
    }

    const user = await authRepository.findUserById(result.userId);

    if (!user) {
      throw new AuthenticationError('Authentication required.', {
        code: ERROR_CODES.AUTHENTICATION_REQUIRED,
      });
    }

    const accessToken = await createAccessJwt(user.id);
    const nextRefreshToken = await createRefreshJwt(user.id);

    return { user, accessToken, refreshToken: nextRefreshToken };
  },

  async logout() {},

  getFrontendRedirectUrl(path = '/') {
    return new URL(path, env.FRONTEND_URL).toString();
  },
};
