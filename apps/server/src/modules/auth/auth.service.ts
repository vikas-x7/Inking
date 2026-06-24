import { env } from '../../config/env.js';
import { HTTP_STATUS } from '../../shared/constants/http.constants.js';
import { AppError } from '../../shared/utils/app-error.js';
import { AUTH_PROVIDER } from './auth.constants.js';
import { authRepository } from './auth.repository.js';
import type { AuthTokenPair, AuthUser } from './auth.types.js';
import { githubProvider } from './providers/github.provider.js';
import { googleProvider } from './providers/google.provider.js';
import { createAccessJwt, createRefreshJwt, verifyAccessJwt, verifyRefreshJwt } from './utils/jwt.js';

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
      throw new AppError('Unsupported OAuth provider.', HTTP_STATUS.BAD_REQUEST);
    }

    const user = await authRepository.upsertOAuthUser(profile, tokens);
    const accessToken = await createAccessJwt(user.id);
    const refreshToken = await createRefreshJwt(user.id);

    return { user, accessToken, refreshToken };
  },

  async getCurrentUser(accessToken?: string): Promise<AuthUser> {
    if (!accessToken) {
      throw new AppError('Unauthorized.', HTTP_STATUS.UNAUTHORIZED);
    }

    const payload = await verifyAccessJwt(accessToken);

    if (!payload) {
      throw new AppError('Unauthorized.', HTTP_STATUS.UNAUTHORIZED);
    }

    const user = await authRepository.findUserById(payload.userId);

    if (!user) {
      throw new AppError('Unauthorized.', HTTP_STATUS.UNAUTHORIZED);
    }

    return user;
  },

  async refreshTokens(refreshToken?: string): Promise<{ user: AuthUser } & AuthTokenPair> {
    if (!refreshToken) {
      throw new AppError('Unauthorized.', HTTP_STATUS.UNAUTHORIZED);
    }

    const payload = await verifyRefreshJwt(refreshToken);

    if (!payload) {
      throw new AppError('Unauthorized.', HTTP_STATUS.UNAUTHORIZED);
    }

    const user = await authRepository.findUserById(payload.userId);

    if (!user) {
      throw new AppError('Unauthorized.', HTTP_STATUS.UNAUTHORIZED);
    }

    const accessToken = await createAccessJwt(user.id);
    const nextRefreshToken = await createRefreshJwt(user.id);

    return { user, accessToken, refreshToken: nextRefreshToken };
  },

  async logout() {},

  getFrontendRedirectUrl(path = '/dashboard') {
    return new URL(path, env.FRONTEND_URL).toString();
  },
};
