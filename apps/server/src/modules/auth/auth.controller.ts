import type { Context } from 'hono';
import { HTTP_STATUS } from '../../shared/constants/http.constants.js';
import { AppError } from '../../shared/utils/app-error.js';
import { AUTH_COOKIE_NAMES } from './auth.constants.js';
import { oauthCallbackSchema } from './auth.schema.js';
import { authService } from './auth.service.js';
import {
  clearOAuthCookie,
  clearSessionCookie,
  getOAuthCookie,
  getSessionCookie,
  setOAuthCookie,
  setSessionCookie,
} from './utils/cookies.js';
import { assertMatchingState } from './utils/state.js';

export const authController = {
  google(c: Context) {
    const authorization = authService.startGoogleOAuth();

    setOAuthCookie(c, AUTH_COOKIE_NAMES.googleState, authorization.state);

    if (!authorization.codeVerifier) {
      throw new AppError('Google code verifier was not generated.', HTTP_STATUS.BAD_REQUEST);
    }

    setOAuthCookie(c, AUTH_COOKIE_NAMES.googleCodeVerifier, authorization.codeVerifier);

    return c.redirect(authorization.url.toString());
  },

  async googleCallback(c: Context) {
    const query = oauthCallbackSchema.parse(c.req.query());
    const storedState = getOAuthCookie(c, AUTH_COOKIE_NAMES.googleState);
    const codeVerifier = getOAuthCookie(c, AUTH_COOKIE_NAMES.googleCodeVerifier);

    assertMatchingState(query.state, storedState);

    if (!codeVerifier) {
      throw new AppError('Missing Google code verifier.', HTTP_STATUS.BAD_REQUEST);
    }

    const { sessionToken } = await authService.handleGoogleCallback(query.code, codeVerifier);

    clearOAuthCookie(c, AUTH_COOKIE_NAMES.googleState);
    clearOAuthCookie(c, AUTH_COOKIE_NAMES.googleCodeVerifier);
    setSessionCookie(c, sessionToken);

    return c.redirect(authService.getFrontendRedirectUrl());
  },

  github(c: Context) {
    const authorization = authService.startGithubOAuth();

    setOAuthCookie(c, AUTH_COOKIE_NAMES.githubState, authorization.state);

    return c.redirect(authorization.url.toString());
  },

  async githubCallback(c: Context) {
    const query = oauthCallbackSchema.parse(c.req.query());
    const storedState = getOAuthCookie(c, AUTH_COOKIE_NAMES.githubState);

    assertMatchingState(query.state, storedState);

    const { sessionToken } = await authService.handleGithubCallback(query.code);

    clearOAuthCookie(c, AUTH_COOKIE_NAMES.githubState);
    setSessionCookie(c, sessionToken);

    return c.redirect(authService.getFrontendRedirectUrl());
  },

  async me(c: Context) {
    const user = await authService.getCurrentUser(getSessionCookie(c));

    return c.json({ user });
  },

  async logout(c: Context) {
    await authService.logout(getSessionCookie(c));
    clearSessionCookie(c);

    return c.json({ success: true });
  },
};
