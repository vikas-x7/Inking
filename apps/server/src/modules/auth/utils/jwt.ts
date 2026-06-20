import { SignJWT, jwtVerify } from 'jose';
import { env } from '../../../config/env.js';
import { SESSION_TTL_SECONDS } from '../auth.constants.js';

const jwtSecret = new TextEncoder().encode(env.JWT_SECRET);

type SessionJwtPayload = {
  userId: string;
};

export const createSessionJwt = async (payload: SessionJwtPayload) => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .setJti(crypto.randomUUID())
    .sign(jwtSecret);
};

export const verifySessionJwt = async (token: string) => {
  const { payload } = await jwtVerify(token, jwtSecret);

  if (typeof payload.userId !== 'string') {
    return null;
  }

  return {
    userId: payload.userId,
  };
};
