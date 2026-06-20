export const AUTH_COOKIE_NAMES = {
  session: 'ink_session',
  googleState: 'google_oauth_state',
  googleCodeVerifier: 'google_oauth_code_verifier',
  githubState: 'github_oauth_state',
} as const;

export const AUTH_PROVIDER = {
  google: 'google',
  github: 'github',
} as const;

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
export const OAUTH_STATE_TTL_SECONDS = 60 * 10;
