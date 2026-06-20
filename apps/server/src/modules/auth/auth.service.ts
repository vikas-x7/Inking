import { env } from '../../config/env.js';
import { HTTP_STATUS } from '../../shared/constants/http.constants.js';
import { AppError } from '../../shared/utils/app-error.js';
import { AUTH_PROVIDER } from './auth.constants.js';
import { authRepository } from './auth.repository.js';
import type { AuthUser } from './auth.types.js';
import { githubProvider } from './providers/github.provider.js';
import { googleProvider } from './providers/google.provider.js';
import { createSessionJwt, verifySessionJwt } from './utils/jwt.js';
import { getSessionExpiresAt } from './utils/oauth.js';

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
  ) {
    if (profile.provider !== AUTH_PROVIDER.google && profile.provider !== AUTH_PROVIDER.github) {
      throw new AppError('Unsupported OAuth provider.', HTTP_STATUS.BAD_REQUEST);
    }

    const user = await authRepository.upsertOAuthUser(profile, tokens);
    const sessionToken = await createSessionJwt({ userId: user.id });
    const session = await authRepository.createSession(user.id, sessionToken, getSessionExpiresAt());

    return { user, session, sessionToken };
  },

  async getCurrentUser(sessionToken?: string): Promise<AuthUser> {
    if (!sessionToken) {
      throw new AppError('Unauthorized.', HTTP_STATUS.UNAUTHORIZED);
    }

    const payload = await verifySessionJwt(sessionToken).catch(() => null);

    if (!payload) {
      throw new AppError('Unauthorized.', HTTP_STATUS.UNAUTHORIZED);
    }

    const session = await authRepository.findSessionByToken(sessionToken);

    if (!session || session.expiresAt <= new Date()) {
      throw new AppError('Unauthorized.', HTTP_STATUS.UNAUTHORIZED);
    }

    return session.user;
  },

  async logout(sessionToken?: string) {
    if (sessionToken) {
      await authRepository.deleteSessionByToken(sessionToken);
    }
  },

  getFrontendRedirectUrl(path = '/dashboard') {
    return new URL(path, env.FRONTEND_URL).toString();
  },
};
