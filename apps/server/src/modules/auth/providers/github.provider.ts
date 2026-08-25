import { GitHub } from 'arctic';
import { env } from '../../../config/env.js';
import { AppError } from '../../../shared/utils/app-error.js';
import { HTTP_STATUS } from '../../../shared/constants/http.constants.js';
import type { OAuthAuthorization, OAuthProfile, OAuthTokens } from '../auth.types.js';
import { AUTH_PROVIDER } from '../auth.constants.js';
import { createOAuthState, getAccessTokenExpiresAt } from '../utils/oauth.js';

const getGithubClient = () => {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    throw new AppError('GitHub OAuth is not configured.', HTTP_STATUS.BAD_REQUEST);
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
  const response = await fetch('https://api.github.com/user/emails', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!response.ok) {
    throw new AppError('Failed to fetch GitHub email.', HTTP_STATUS.BAD_REQUEST);
  }

  const emails = (await response.json()) as GithubEmailResponse[];
  const primaryEmail = emails.find((email) => email.primary && email.verified);

  if (!primaryEmail) {
    throw new AppError('GitHub primary email is not verified.', HTTP_STATUS.BAD_REQUEST);
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
    const tokens = await getGithubClient().validateAuthorizationCode(code);
    const accessToken = tokens.accessToken();

    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!response.ok) {
      throw new AppError('Failed to fetch GitHub profile.', HTTP_STATUS.BAD_REQUEST);
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
