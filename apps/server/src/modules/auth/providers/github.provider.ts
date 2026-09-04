import { GitHub, type OAuth2Tokens } from 'arctic';
import { env } from '../../../config/env.js';
import { AppError, ExternalServiceError } from '../../../shared/errors/app-error.js';
import { ERROR_CODES } from '../../../shared/errors/error-codes.js';
import { HTTP_STATUS } from '../../../shared/constants/http.constants.js';
import type { OAuthAuthorization, OAuthProfile, OAuthTokens } from '../auth.types.js';
import { AUTH_PROVIDER } from '../auth.constants.js';
import { createOAuthState, getAccessTokenExpiresAt } from '../utils/oauth.js';

const getGithubClient = () => {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    throw new AppError('Sign in with GitHub is temporarily unavailable.', {
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      isOperational: false,
      cause: new Error('GitHub OAuth client credentials are not configured.'),
    });
  }

  return new GitHub(
    env.GITHUB_CLIENT_ID,
    env.GITHUB_CLIENT_SECRET,
    `${env.API_URL}/auth/github/callback`,
  );
};

type GithubUserResponse = {
  id: number;
  name: string | null;
  login: string;
  avatar_url: string | null;
  email: string | null;
};

type GithubEmailResponse = {
  email: string;
  primary: boolean;
  verified: boolean;
};

const fetchPrimaryGithubEmail = async (accessToken: string) => {
  let response: Response;
  try {
    response = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    });
  } catch (error) {
    throw new ExternalServiceError('Failed to sign in with GitHub.', {
      service: 'github-oauth',
      code: ERROR_CODES.OAUTH_PROVIDER_ERROR,
      cause: error,
    });
  }

  if (!response.ok) {
    throw new ExternalServiceError('Failed to sign in with GitHub.', {
      service: 'github-oauth',
      code: ERROR_CODES.OAUTH_PROVIDER_ERROR,
      cause: new Error(`GitHub emails API returned HTTP ${response.status}.`),
    });
  }

  const emails = (await response.json()) as GithubEmailResponse[];
  const primaryEmail = emails.find((email) => email.primary && email.verified);

  if (!primaryEmail) {
    throw new AppError('GitHub primary email is not verified.', {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.BAD_REQUEST,
    });
  }

  return primaryEmail.email.toLowerCase();
};

export const githubProvider = {
  createAuthorization(): OAuthAuthorization {
    const state = createOAuthState();
    const url = getGithubClient().createAuthorizationURL(state, ['user:email']);

    return { url, state };
  },

  async validateCallback(code: string): Promise<{ profile: OAuthProfile; tokens: OAuthTokens }> {
    let tokens: OAuth2Tokens;

    try {
      tokens = await getGithubClient().validateAuthorizationCode(code);
    } catch (error) {
      throw new ExternalServiceError('Failed to sign in with GitHub.', {
        service: 'github-oauth',
        code: ERROR_CODES.OAUTH_PROVIDER_ERROR,
        cause: error,
      });
    }

    const accessToken = tokens.accessToken();

    let response: Response;
    try {
      response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
        },
      });
    } catch (error) {
      throw new ExternalServiceError('Failed to sign in with GitHub.', {
        service: 'github-oauth',
        code: ERROR_CODES.OAUTH_PROVIDER_ERROR,
        cause: error,
      });
    }

    if (!response.ok) {
      throw new ExternalServiceError('Failed to sign in with GitHub.', {
        service: 'github-oauth',
        code: ERROR_CODES.OAUTH_PROVIDER_ERROR,
        cause: new Error(`GitHub user API returned HTTP ${response.status}.`),
      });
    }

    const profile = (await response.json()) as GithubUserResponse;
    const email = profile.email?.toLowerCase() ?? (await fetchPrimaryGithubEmail(accessToken));

    return {
      profile: {
        provider: AUTH_PROVIDER.github,
        providerAccountId: String(profile.id),
        email,
        name: profile.name ?? profile.login,
        image: profile.avatar_url,
      },
      tokens: {
        accessToken,
        refreshToken: tokens.hasRefreshToken() ? tokens.refreshToken() : null,
        expiresAt: getAccessTokenExpiresAt(tokens),
      },
    };
  },
};
