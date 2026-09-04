import { SignJWT, errors as joseErrors, jwtVerify } from 'jose';
import { env } from '../../../config/env.js';
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS } from '../auth.constants.js';

const accessJwtSecret = new TextEncoder().encode(env.ACCESS_JWT_SECRET);
const refreshJwtSecret = new TextEncoder().encode(env.REFRESH_JWT_SECRET);

type TokenType = 'access' | 'refresh';

type SessionJwtPayload = {
  userId: string;
  type: TokenType;
};

export type TokenVerificationResult =
  | { ok: true; userId: string }
  | { ok: false; reason: 'invalid' | 'expired' };

const createJwt = (payload: SessionJwtPayload, secret: Uint8Array, ttlSeconds: number) => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .setJti(crypto.randomUUID())
    .sign(secret);
};

export const createAccessJwt = (userId: string) =>
  createJwt({ userId, type: 'access' }, accessJwtSecret, ACCESS_TOKEN_TTL_SECONDS);

export const createRefreshJwt = (userId: string) =>
  createJwt({ userId, type: 'refresh' }, refreshJwtSecret, REFRESH_TOKEN_TTL_SECONDS);

/**
 * Verifies a token and distinguishes between an invalid token and an expired
 * one so auth errors can carry accurate, non-enumerating error codes.
 */
const verifyJwt = async (
  token: string,
  secret: Uint8Array,
  type: TokenType,
): Promise<TokenVerificationResult> => {
  try {
    const { payload } = await jwtVerify(token, secret);

    if (typeof payload.userId !== 'string' || payload.type !== type) {
      return { ok: false, reason: 'invalid' };
    }

    return { ok: true, userId: payload.userId };
  } catch (error) {
    if (error instanceof joseErrors.JWTExpired) {
      return { ok: false, reason: 'expired' };
    }
    return { ok: false, reason: 'invalid' };
  }
};

export const verifyAccessJwt = (token: string) => verifyJwt(token, accessJwtSecret, 'access');

export const verifyRefreshJwt = (token: string) => verifyJwt(token, refreshJwtSecret, 'refresh');
