import { generateState } from 'arctic';
import type { OAuth2Tokens } from 'arctic';

export const createOAuthState = () => generateState();

export const getSessionExpiresAt = () => new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

export const getAccessTokenExpiresAt = (tokens: OAuth2Tokens) => {
  try {
    return tokens.accessTokenExpiresAt();
  } catch {
    return null;
  }
};
