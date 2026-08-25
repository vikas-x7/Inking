import type { Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { isProduction } from '../../../config/env.js';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  AUTH_COOKIE_NAMES,
  OAUTH_STATE_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from '../auth.constants.js';

// All auth traffic goes through the Next.js rewrite proxy, so cookies are
// always set on the frontend origin (vercel.app / localhost). Same-site Lax
// is enough — do NOT use SameSite=None here (third-party cookies get blocked
// by Safari/Chrome tracking protection and break the editor's API calls).
const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'Lax',
  path: '/',
} as const;

export const setAccessCookie = (c: Context, token: string) => {
  setCookie(c, AUTH_COOKIE_NAMES.accessToken, token, {
    ...baseCookieOptions,
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
  });
};

export const getAccessCookie = (c: Context) => getCookie(c, AUTH_COOKIE_NAMES.accessToken);

export const setRefreshCookie = (c: Context, token: string) => {
  setCookie(c, AUTH_COOKIE_NAMES.refreshToken, token, {
    ...baseCookieOptions,
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
  });
};

export const getRefreshCookie = (c: Context) => getCookie(c, AUTH_COOKIE_NAMES.refreshToken);

export const clearAuthCookies = (c: Context) => {
  deleteCookie(c, AUTH_COOKIE_NAMES.accessToken, baseCookieOptions);
  deleteCookie(c, AUTH_COOKIE_NAMES.refreshToken, baseCookieOptions);
};

export const setOAuthCookie = (c: Context, name: string, value: string) => {
  setCookie(c, name, value, {
    ...baseCookieOptions,
    maxAge: OAUTH_STATE_TTL_SECONDS,
  });
};

export const getOAuthCookie = (c: Context, name: string) => getCookie(c, name);

export const clearOAuthCookie = (c: Context, name: string) => {
  deleteCookie(c, name, baseCookieOptions);
};
