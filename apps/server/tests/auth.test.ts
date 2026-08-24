import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import app from '../src/app.js';
import { googleProvider } from './mocks/google.provider.js';
import { githubProvider } from './mocks/github.provider.js';
import { prisma } from './mocks/prisma.js';
import { AppError } from '../src/shared/utils/app-error.js';
import { accessCookie, documentFixture, refreshCookie, userFixture } from './helpers.js';

const db = prisma;
const googleMock = googleProvider;
const githubMock = githubProvider;

describe('GET /auth/google', () => {
  it('redirects to Google and stores the OAuth state cookie', async () => {
    googleMock.createAuthorization.mockReturnValue({
      url: new URL('https://accounts.google.com/o/oauth2/v2/auth?client_id=x'),
      state: 'state-123',
      codeVerifier: 'verifier-123',
    });

    const res = await app.request('/auth/google');

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toContain('accounts.google.com');
    expect(res.headers.getSetCookie().join(';')).toContain('google_oauth_state=state-123');
  });

  it('returns 400 when Google is not configured', async () => {
    googleMock.createAuthorization.mockImplementation(() => {
      throw new AppError('Google OAuth is not configured.', 400);
    });

    const res = await app.request('/auth/google');

    expect(res.status).toBe(400);
  });
});

describe('GET /auth/google/callback', () => {
  const oauthProfile = () => ({
    profile: {
      provider: 'google',
      providerAccountId: 'ga-1',
      email: userFixture.email,
      name: userFixture.name,
      image: userFixture.image,
    },
    tokens: { accessToken: 'at', refreshToken: 'rt', expiresAt: new Date() },
  });

  const oauthCookies = 'google_oauth_state=state-123; google_oauth_code_verifier=verifier-123';

  const mockExistingAccount = () =>
    db.account.findUnique.mockResolvedValue({
      id: 'acc-1',
      userId: userFixture.id,
      provider: 'google',
      providerAccountId: 'ga-1',
      user: userFixture,
    });

  it('creates an Untitled document for a new user and redirects to the editor', async () => {
    googleMock.validateCallback.mockResolvedValue(oauthProfile());
    db.account.findUnique.mockResolvedValue(null);
    db.user.findUnique.mockResolvedValue(null);
    db.user.create.mockResolvedValue(userFixture);
    db.document.findFirst.mockResolvedValue(null);
    db.document.create.mockResolvedValue({ ...documentFixture, id: 'new-doc-1' });

    const res = await app.request('/auth/google/callback?code=code-1&state=state-123', {
      headers: { cookie: oauthCookies },
    });

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('http://localhost:3000/editor/new-doc-1');
    expect(db.document.create).toHaveBeenCalledWith({
      data: { userId: userFixture.id, title: 'Untitled', content: '' },
    });
  });

  it('redirects an existing user to their most recent unarchived document', async () => {
    googleMock.validateCallback.mockResolvedValue(oauthProfile());
    mockExistingAccount();
    db.document.findFirst.mockResolvedValue(documentFixture);

    const res = await app.request('/auth/google/callback?code=code-1&state=state-123', {
      headers: { cookie: oauthCookies },
    });

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('http://localhost:3000/editor/doc-1');
    expect(db.document.findFirst).toHaveBeenCalledWith({
      where: { userId: userFixture.id, isArchived: false },
      orderBy: { updatedAt: 'desc' },
    });
  });

  it('creates an Untitled document when the user has only archived documents', async () => {
    googleMock.validateCallback.mockResolvedValue(oauthProfile());
    mockExistingAccount();
    db.document.findFirst.mockResolvedValue(null);
    db.document.create.mockResolvedValue({ ...documentFixture, id: 'new-doc-1' });

    const res = await app.request('/auth/google/callback?code=code-1&state=state-123', {
      headers: { cookie: oauthCookies },
    });

    expect(res.headers.get('location')).toBe('http://localhost:3000/editor/new-doc-1');
    expect(db.document.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: userFixture.id, isArchived: false } }),
    );
    expect(db.document.create).toHaveBeenCalledTimes(1);
  });

  it('redirects to the most recently updated document when the user has several', async () => {
    googleMock.validateCallback.mockResolvedValue(oauthProfile());
    mockExistingAccount();
    db.document.findFirst.mockResolvedValue({ ...documentFixture, id: 'doc-recent' });

    const res = await app.request('/auth/google/callback?code=code-1&state=state-123', {
      headers: { cookie: oauthCookies },
    });

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('http://localhost:3000/editor/doc-recent');
  });

  it('sets auth cookies before redirecting to the editor', async () => {
    googleMock.validateCallback.mockResolvedValue(oauthProfile());
    mockExistingAccount();
    db.document.findFirst.mockResolvedValue(documentFixture);
    db.document.create.mockResolvedValue(documentFixture);

    const res = await app.request('/auth/google/callback?code=code-1&state=state-123', {
      headers: { cookie: oauthCookies },
    });

    const cookies = res.headers.getSetCookie().join(';');
    expect(cookies).toContain('ink_access_token=');
    expect(cookies).toContain('ink_refresh_token=');
    expect(cookies).not.toContain('google_oauth_state=state-123');
    expect(cookies).not.toContain('google_oauth_code_verifier=verifier-123');
  });

  it('returns 400 when the OAuth state does not match', async () => {
    const res = await app.request('/auth/google/callback?code=code-1&state=wrong', {
      headers: { cookie: 'google_oauth_state=state-123' },
    });

    expect(res.status).toBe(400);
  });

  it('returns 400 when the code verifier is missing', async () => {
    const res = await app.request('/auth/google/callback?code=code-1&state=state-123', {
      headers: { cookie: 'google_oauth_state=state-123' },
    });

    expect(res.status).toBe(400);
  });
});

describe('GET /auth/github', () => {
  it('redirects to GitHub and stores the OAuth state cookie', async () => {
    githubMock.createAuthorization.mockReturnValue({
      url: new URL('https://github.com/login/oauth/authorize?client_id=x'),
      state: 'state-456',
    });

    const res = await app.request('/auth/github');

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toContain('github.com');
    expect(res.headers.getSetCookie().join(';')).toContain('github_oauth_state=state-456');
  });
});

describe('GET /auth/github/callback', () => {
  it('exchanges the code, sets auth cookies and redirects to the editor', async () => {
    githubMock.validateCallback.mockResolvedValue({
      profile: {
        provider: 'github',
        providerAccountId: 'gh-1',
        email: userFixture.email,
        name: userFixture.name,
        image: userFixture.image,
      },
      tokens: { accessToken: 'at', refreshToken: null, expiresAt: null },
    });
    db.user.findUnique.mockResolvedValue(null);
    db.account.findUnique.mockResolvedValue(null);
    db.user.create.mockResolvedValue(userFixture);
    db.document.findFirst.mockResolvedValue(null);
    db.document.create.mockResolvedValue({ ...documentFixture, id: 'new-doc-1' });

    const res = await app.request('/auth/github/callback?code=code-1&state=state-456', {
      headers: { cookie: 'github_oauth_state=state-456' },
    });

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('http://localhost:3000/editor/new-doc-1');
    const cookies = res.headers.getSetCookie().join(';');
    expect(cookies).toContain('ink_access_token=');
    expect(cookies).toContain('ink_refresh_token=');
  });
});

describe('GET /auth/me', () => {
  it('returns the current user with a valid access token', async () => {
    db.user.findUnique.mockResolvedValue(userFixture);

    const res = await app.request('/auth/me', {
      headers: { cookie: await accessCookie(userFixture.id) },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: { email: string } };
    expect(body.user.email).toBe(userFixture.email);
  });

  it('returns 401 without a token', async () => {
    const res = await app.request('/auth/me');

    expect(res.status).toBe(401);
  });

  it('returns 401 with an invalid token', async () => {
    const res = await app.request('/auth/me', {
      headers: { cookie: 'ink_access_token=garbage.token.value' },
    });

    expect(res.status).toBe(401);
  });

  it('returns 401 when the user no longer exists', async () => {
    db.user.findUnique.mockResolvedValue(null);

    const res = await app.request('/auth/me', {
      headers: { cookie: await accessCookie('ghost-user') },
    });

    expect(res.status).toBe(401);
  });
});

describe('POST /auth/refresh', () => {
  it('rotates the token pair and returns the user', async () => {
    db.user.findUnique.mockResolvedValue(userFixture);

    const res = await app.request('/auth/refresh', {
      method: 'POST',
      headers: { cookie: await refreshCookie(userFixture.id) },
    });

    expect(res.status).toBe(200);
    const cookies = res.headers.getSetCookie().join(';');
    expect(cookies).toContain('ink_access_token=');
    expect(cookies).toContain('ink_refresh_token=');
    const body = (await res.json()) as { user: { id: string } };
    expect(body.user.id).toBe(userFixture.id);
  });

  it('returns 401 without a refresh token', async () => {
    const res = await app.request('/auth/refresh', { method: 'POST' });

    expect(res.status).toBe(401);
  });

  it('returns 401 with an invalid refresh token', async () => {
    const res = await app.request('/auth/refresh', {
      method: 'POST',
      headers: { cookie: 'ink_refresh_token=not.a.jwt' },
    });

    expect(res.status).toBe(401);
  });
});

describe('POST /auth/logout', () => {
  it('clears the auth cookies', async () => {
    const res = await app.request('/auth/logout', { method: 'POST' });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    const cookies = res.headers.getSetCookie().join(';');
    expect(cookies).toContain('ink_access_token=');
    expect(cookies).toContain('ink_refresh_token=');
  });
});

beforeEach(() => {
  jest.clearAllMocks();
});
