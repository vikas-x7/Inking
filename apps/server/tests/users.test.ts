import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import app from '../src/app.js';
import { prisma } from './mocks/prisma.js';
import { accessCookie, userFixture } from './helpers.js';

const db = prisma;

describe('GET /users/me', () => {
  it('returns the authenticated user', async () => {
    db.user.findUnique.mockResolvedValue(userFixture);

    const res = await app.request('/users/me', {
      headers: { cookie: await accessCookie(userFixture.id) },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: { id: string; email: string } };
    expect(body.user.id).toBe(userFixture.id);
    expect(body.user.email).toBe(userFixture.email);
  });

  it('returns 401 without a token', async () => {
    const res = await app.request('/users/me');

    expect(res.status).toBe(401);
  });

  it('returns 401 when the user does not exist', async () => {
    db.user.findUnique.mockResolvedValue(null);

    const res = await app.request('/users/me', {
      headers: { cookie: await accessCookie('ghost-user') },
    });

    expect(res.status).toBe(401);
  });
});

describe('PATCH /users/me', () => {
  it('updates and returns the user', async () => {
    db.user.findUnique.mockResolvedValue(userFixture);
    const updated = { ...userFixture, name: 'New Name', image: 'https://img/x.png' };
    db.user.update.mockResolvedValue(updated);

    const res = await app.request('/users/me', {
      method: 'PATCH',
      headers: {
        cookie: await accessCookie(userFixture.id),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ name: 'New Name', image: 'https://img/x.png' }),
    });

    expect(res.status).toBe(200);
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: userFixture.id },
        data: expect.objectContaining({ name: 'New Name' }),
      }),
    );
    const body = (await res.json()) as { user: { name: string } };
    expect(body.user.name).toBe('New Name');
  });

  it('returns 401 without a token', async () => {
    const res = await app.request('/users/me', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'X' }),
    });

    expect(res.status).toBe(401);
  });

  it('returns 400 when the payload is invalid', async () => {
    const res = await app.request('/users/me', {
      method: 'PATCH',
      headers: {
        cookie: await accessCookie(userFixture.id),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ name: 42 }),
    });

    expect(res.status).toBe(400);
  });
});

beforeEach(() => {
  jest.clearAllMocks();
});
