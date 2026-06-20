import type { AUTH_PROVIDER } from './auth.constants.js';

export type OAuthProvider = (typeof AUTH_PROVIDER)[keyof typeof AUTH_PROVIDER];

export type OAuthProfile = {
  provider: OAuthProvider;
  providerAccountId: string;
  email: string;
  name: string;
  image?: string | null;
};

export type OAuthTokens = {
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: Date | null;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

export type AuthSession = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
};

export type OAuthAuthorization = {
  url: URL;
  state: string;
  codeVerifier?: string;
};
