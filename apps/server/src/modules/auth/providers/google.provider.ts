import { Google, generateCodeVerifier } from 'arctic';
import { env } from '../../../config/env.js';
import { AppError } from '../../../shared/utils/app-error.js';
import { HTTP_STATUS } from '../../../shared/constants/http.constants.js';
import type { OAuthAuthorization, OAuthProfile, OAuthTokens } from '../auth.types.js';
import { AUTH_PROVIDER } from '../auth.constants.js';
import { createOAuthState, getAccessTokenExpiresAt } from '../utils/oauth.js';

const getGoogleClient = () => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new AppError('Google OAuth is not configured.', HTTP_STATUS.BAD_REQUEST);
  }

  return new Google(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    `${env.API_URL}/auth/google/callback`,
  );
};

type GoogleUserResponse = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
};

export const googleProvider = {
  createAuthorization(): OAuthAuthorization {
    const state = createOAuthState();
    const codeVerifier = generateCodeVerifier();
    const url = getGoogleClient().createAuthorizationURL(state, codeVerifier, [
      'openid',
      'profile',
      'email',
    ]);

    return { url, state, codeVerifier };
  },

  async validateCallback(
    code: string,
    codeVerifier: string,
  ): Promise<{ profile: OAuthProfile; tokens: OAuthTokens }> {
    const tokens = await getGoogleClient().validateAuthorizationCode(code, codeVerifier);
    const accessToken = tokens.accessToken();

    const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new AppError('Failed to fetch Google profile.', HTTP_STATUS.BAD_REQUEST);
    }

    const profile = (await response.json()) as GoogleUserResponse;

    if (!profile.email || !profile.email_verified) {
      throw new AppError('Google email is not verified.', HTTP_STATUS.BAD_REQUEST);
    }

    return {
      profile: {
        provider: AUTH_PROVIDER.google,
        providerAccountId: profile.sub,
        email: profile.email.toLowerCase(),
        name: profile.name ?? profile.email,
        image: profile.picture ?? null,
      },
      tokens: {
        accessToken,
        refreshToken: tokens.hasRefreshToken() ? tokens.refreshToken() : null,
        expiresAt: getAccessTokenExpiresAt(tokens),
      },
    };
  },
};
