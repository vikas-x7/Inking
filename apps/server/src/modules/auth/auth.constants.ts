export const AUTH_COOKIE_NAMES = {
  accessToken: 'ink_access_token',
  refreshToken: 'ink_refresh_token',
  googleState: 'google_oauth_state',
  googleCodeVerifier: 'google_oauth_code_verifier',
  githubState: 'github_oauth_state',
} as const;

export const AUTH_PROVIDER = {
  google: 'google',
  github: 'github',
} as const;

export const ACCESS_TOKEN_TTL_SECONDS = 60 * 15;
export const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;
export const OAUTH_STATE_TTL_SECONDS = 60 * 10;
