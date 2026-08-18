import type { Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { isProduction } from '../../../config/env.js';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  AUTH_COOKIE_NAMES,
  OAUTH_STATE_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from '../auth.constants.js';

const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'None' : 'Lax',
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
  deleteCookie(c, AUTH_COOKIE_NAMES.accessToken, {
    path: '/',
    secure: isProduction,
    sameSite: isProduction ? 'None' : 'Lax',
  });
  deleteCookie(c, AUTH_COOKIE_NAMES.refreshToken, {
    path: '/',
    secure: isProduction,
    sameSite: isProduction ? 'None' : 'Lax',
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
    sameSite: isProduction ? 'None' : 'Lax',
  });
};
