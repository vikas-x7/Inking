import type { Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { isProduction } from '../../../config/env.js';
import { AUTH_COOKIE_NAMES, OAUTH_STATE_TTL_SECONDS, SESSION_TTL_SECONDS } from '../auth.constants.js';

const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'Lax',
  path: '/',
} as const;

export const setSessionCookie = (c: Context, token: string) => {
  setCookie(c, AUTH_COOKIE_NAMES.session, token, {
    ...baseCookieOptions,
    maxAge: SESSION_TTL_SECONDS,
  });
};

export const getSessionCookie = (c: Context) => getCookie(c, AUTH_COOKIE_NAMES.session);

export const clearSessionCookie = (c: Context) => {
  deleteCookie(c, AUTH_COOKIE_NAMES.session, {
    path: '/',
    secure: isProduction,
    sameSite: 'Lax',
  });
};

export const setOAuthCookie = (c: Context, name: string, value: string) => {
  setCookie(c, name, value, {
    ...baseCookieOptions,
    maxAge: OAUTH_STATE_TTL_SECONDS,
  });
};

export const getOAuthCookie = (c: Context, name: string) => getCookie(c, name);

export const clearOAuthCookie = (c: Context, name: string) => {
  deleteCookie(c, name, {
    path: '/',
    secure: isProduction,
    sameSite: 'Lax',
  });
};
