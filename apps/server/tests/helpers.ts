import { SignJWT } from 'jose';

export const signToken = async (userId: string, type: 'access' | 'refresh') => {
  const secret = new TextEncoder().encode(
    type === 'access'
      ? (process.env.ACCESS_JWT_SECRET as string)
      : (process.env.REFRESH_JWT_SECRET as string),
  );
  const ttl = type === 'access' ? 60 * 15 : 60 * 60 * 24 * 30;

  return new SignJWT({ userId, type })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .setJti(crypto.randomUUID())
    .sign(secret);
};

export const accessCookie = async (userId: string) =>
  `ink_access_token=${await signToken(userId, 'access')}`;

export const authCookies = async (userId: string) =>
  `ink_access_token=${await signToken(userId, 'access')}; ink_refresh_token=${await signToken(
    userId,
    'refresh',
  )}`;

export const refreshCookie = async (userId: string) =>
  `ink_refresh_token=${await signToken(userId, 'refresh')}`;

export const userFixture = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@ink.dev',
  image: null,
};

export const documentFixture = {
  id: 'doc-1',
  userId: 'user-1',
  title: 'My document',
  content: '\\section{Hello}',
  description: 'a note',
  isArchived: false,
  lastOpenedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};
