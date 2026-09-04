import { Google, generateCodeVerifier, type OAuth2Tokens } from 'arctic';
import { env } from '../../../config/env.js';
import { AppError, ExternalServiceError } from '../../../shared/errors/app-error.js';
import { ERROR_CODES } from '../../../shared/errors/error-codes.js';
import { HTTP_STATUS } from '../../../shared/constants/http.constants.js';
import type { OAuthAuthorization, OAuthProfile, OAuthTokens } from '../auth.types.js';
import { AUTH_PROVIDER } from '../auth.constants.js';
import { createOAuthState, getAccessTokenExpiresAt } from '../utils/oauth.js';

const getGoogleClient = () => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new AppError('Sign in with Google is temporarily unavailable.', {
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      isOperational: false,
      cause: new Error('Google OAuth client credentials are not configured.'),
    });
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
    let tokens: OAuth2Tokens;

    try {
      tokens = await getGoogleClient().validateAuthorizationCode(code, codeVerifier);
    } catch (error) {
      throw new ExternalServiceError('Failed to sign in with Google.', {
        service: 'google-oauth',
        code: ERROR_CODES.OAUTH_PROVIDER_ERROR,
        cause: error,
      });
    }

    const accessToken = tokens.accessToken();

    let response: Response;
    try {
      response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      throw new ExternalServiceError('Failed to sign in with Google.', {
        service: 'google-oauth',
        code: ERROR_CODES.OAUTH_PROVIDER_ERROR,
        cause: error,
      });
    }

    if (!response.ok) {
      throw new ExternalServiceError('Failed to sign in with Google.', {
        service: 'google-oauth',
        code: ERROR_CODES.OAUTH_PROVIDER_ERROR,
        cause: new Error(`Google userinfo returned HTTP ${response.status}.`),
      });
    }

    const profile = (await response.json()) as GoogleUserResponse;

    if (!profile.email || !profile.email_verified) {
      throw new AppError('Google email is not verified.', {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        code: ERROR_CODES.BAD_REQUEST,
      });
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
