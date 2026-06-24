import { generateState } from 'arctic';
import type { OAuth2Tokens } from 'arctic';

export const createOAuthState = () => generateState();

export const getAccessTokenExpiresAt = (tokens: OAuth2Tokens) => {
  try {
    return tokens.accessTokenExpiresAt();
  } catch {
    return null;
  }
};
