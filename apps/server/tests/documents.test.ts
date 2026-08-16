import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import app from '../src/app.js';
import { prisma } from './mocks/prisma.js';
import { accessCookie, documentFixture, userFixture } from './helpers.js';

const db = prisma;

describe('GET /documents', () => {
  it('lists only the current user documents', async () => {
    db.user.findUnique.mockResolvedValue(userFixture);
    db.document.findMany.mockResolvedValue([documentFixture]);

    const res = await app.request('/documents', {
      headers: { cookie: await accessCookie(userFixture.id) },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { documents: Array<{ id: string }> };
    expect(body.documents).toHaveLength(1);
    expect(body.documents[0].id).toBe(documentFixture.id);
    expect(db.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: userFixture.id }) }),
    );
  });

  it('returns 401 without a token', async () => {
    const res = await app.request('/documents');

    expect(res.status).toBe(401);
  });
});

describe('GET /documents?search=', () => {
  it('filters by the search term at the repository level', async () => {
    db.user.findUnique.mockResolvedValue(userFixture);
    db.document.findMany.mockResolvedValue([documentFixture]);

    const res = await app.request('/documents?search=latex', {
      headers: { cookie: await accessCookie(userFixture.id) },
    });

    expect(res.status).toBe(200);
    expect(db.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: userFixture.id,
          title: { contains: 'latex', mode: 'insensitive' },
        }),
      }),
    );
  });

  it('trims the search term before querying', async () => {
    db.user.findUnique.mockResolvedValue(userFixture);
    db.document.findMany.mockResolvedValue([documentFixture]);

    await app.request('/documents?search=%20%20notes%20%20', {
      headers: { cookie: await accessCookie(userFixture.id) },
    });

    expect(db.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          title: { contains: 'notes', mode: 'insensitive' },
        }),
      }),
    );
  });

  it('omits the title filter when search is omitted', async () => {
    db.user.findUnique.mockResolvedValue(userFixture);
    db.document.findMany.mockResolvedValue([documentFixture]);

    await app.request('/documents', {
      headers: { cookie: await accessCookie(userFixture.id) },
    });

    const call = db.document.findMany.mock.calls[0]?.[0] as
      | { where?: Record<string, unknown> }
      | undefined;
    expect(call?.where).not.toHaveProperty('title');
  });

  it('returns 400 for a search term that is too long', async () => {
    db.user.findUnique.mockResolvedValue(userFixture);

    const res = await app.request(`/documents?search=${'x'.repeat(201)}`, {
      headers: { cookie: await accessCookie(userFixture.id) },
    });

    expect(res.status).toBe(400);
  });

  it('returns 401 without a token', async () => {
    const res = await app.request('/documents?search=latex');

    expect(res.status).toBe(401);
  });
});

describe('GET /documents/:documentId', () => {
  it('returns the document', async () => {
    db.user.findUnique.mockResolvedValue(userFixture);
    db.document.findUnique.mockResolvedValue(documentFixture);

    const res = await app.request(`/documents/${documentFixture.id}`, {
      headers: { cookie: await accessCookie(userFixture.id) },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { document: { title: string } };
    expect(body.document.title).toBe(documentFixture.title);
  });

  it('returns 404 for another user document', async () => {
    db.user.findUnique.mockResolvedValue(userFixture);
    db.document.findUnique.mockResolvedValue(null);

    const res = await app.request(`/documents/${documentFixture.id}`, {
      headers: { cookie: await accessCookie(userFixture.id) },
    });

    expect(res.status).toBe(404);
  });
});

describe('POST /documents', () => {
  it('creates and returns a document', async () => {
    db.user.findUnique.mockResolvedValue(userFixture);
    db.document.create.mockResolvedValue(documentFixture);

    const res = await app.request('/documents', {
      method: 'POST',
      headers: {
        cookie: await accessCookie(userFixture.id),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ title: 'My document', content: '\\section{Hello}' }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as { document: { id: string } };
    expect(body.document.id).toBe(documentFixture.id);
  });

  it('returns 400 when the payload is invalid', async () => {
    const res = await app.request('/documents', {
      method: 'POST',
      headers: {
        cookie: await accessCookie(userFixture.id),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ content: 42 }),
    });

    expect(res.status).toBe(400);
  });

  it('returns 401 without a token', async () => {
    const res = await app.request('/documents', { method: 'POST' });

    expect(res.status).toBe(401);
  });
});

describe('PATCH /documents/:documentId', () => {
  it('updates the document', async () => {
    db.user.findUnique.mockResolvedValue(userFixture);
    db.document.findUnique.mockResolvedValue(documentFixture);
    const updated = { ...documentFixture, title: 'Renamed' };
    db.document.update.mockResolvedValue(updated);

    const res = await app.request(`/documents/${documentFixture.id}`, {
      method: 'PATCH',
      headers: {
        cookie: await accessCookie(userFixture.id),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ title: 'Renamed' }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { document: { title: string } };
    expect(body.document.title).toBe('Renamed');
  });

  it('returns 404 when the document belongs to another user', async () => {
    db.user.findUnique.mockResolvedValue(userFixture);
    db.document.findUnique.mockResolvedValue(null);

    const res = await app.request(`/documents/${documentFixture.id}`, {
      method: 'PATCH',
      headers: {
        cookie: await accessCookie(userFixture.id),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ title: 'Renamed' }),
    });

    expect(res.status).toBe(404);
  });

  it('returns 400 when the payload is invalid', async () => {
    const res = await app.request(`/documents/${documentFixture.id}`, {
      method: 'PATCH',
      headers: {
        cookie: await accessCookie(userFixture.id),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ title: 123 }),
    });

    expect(res.status).toBe(400);
  });

  it('does not update updatedAt when only lastOpenedAt is provided', async () => {
    db.user.findUnique.mockResolvedValue(userFixture);
    db.document.findUnique.mockResolvedValue(documentFixture);
    db.document.update.mockResolvedValue({
      ...documentFixture,
      lastOpenedAt: new Date('2026-02-01T00:00:00.000Z'),
    });

    const res = await app.request(`/documents/${documentFixture.id}`, {
      method: 'PATCH',
      headers: {
        cookie: await accessCookie(userFixture.id),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ lastOpenedAt: '2026-02-01T00:00:00.000Z' }),
    });

    expect(res.status).toBe(200);
    const call = db.document.update.mock.calls[0]?.[0] as
      | { data?: Record<string, unknown> }
      | undefined;
    expect(call?.data).not.toHaveProperty('updatedAt');
    expect(call?.data).toHaveProperty('lastOpenedAt');
  });

  it('persists content via PATCH and serves it back via GET', async () => {
    const store = { ...documentFixture };
    db.user.findUnique.mockResolvedValue(userFixture);
    db.document.findUnique.mockImplementation(async (args: unknown) => {
      const where = (args as { where?: { id?: string } }).where;
      return where?.id === store.id ? store : null;
    });
    db.document.update.mockImplementation(async (args: unknown) => {
      const data = (args as { data?: Record<string, unknown> }).data;
      Object.assign(store, data ?? {});
      return store;
    });

    const patchRes = await app.request(`/documents/${documentFixture.id}`, {
      method: 'PATCH',
      headers: {
        cookie: await accessCookie(userFixture.id),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ content: 'UNIQUE_TEST_CONTENT_123' }),
    });

    expect(patchRes.status).toBe(200);

    db.document.update.mockClear();

    const getRes = await app.request(`/documents/${documentFixture.id}`, {
      headers: { cookie: await accessCookie(userFixture.id) },
    });

    expect(getRes.status).toBe(200);
    const body = (await getRes.json()) as { document: { content: string } };
    expect(body.document.content).toBe('UNIQUE_TEST_CONTENT_123');
  });

  it('persists and returns the latest content for rapid successive updates', async () => {
    const store = { ...documentFixture };
    db.user.findUnique.mockResolvedValue(userFixture);
    db.document.findUnique.mockImplementation(async (args: unknown) => {
      const where = (args as { where?: { id?: string } }).where;
      return where?.id === store.id ? store : null;
    });
    db.document.update.mockImplementation(async (args: unknown) => {
      const data = (args as { data?: Record<string, unknown> }).data;
      Object.assign(store, data ?? {});
      return store;
    });

    for (const content of ['A1', 'A2', 'A3', 'A4']) {
      const res = await app.request(`/documents/${documentFixture.id}`, {
        method: 'PATCH',
        headers: {
          cookie: await accessCookie(userFixture.id),
          'content-type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      expect(res.status).toBe(200);
    }

    const getRes = await app.request(`/documents/${documentFixture.id}`, {
      headers: { cookie: await accessCookie(userFixture.id) },
    });

    expect(getRes.status).toBe(200);
    const body = (await getRes.json()) as { document: { content: string } };
    expect(body.document.content).toBe('A4');
  });

  it.each([
    ['title', { title: 'Renamed' }],
    ['content', { content: '\\section{Updated}' }],
    ['description', { description: 'new note' }],
    ['archive state', { isArchived: true }],
  ])('updates updatedAt when %s changes', async (_label, input) => {
    db.user.findUnique.mockResolvedValue(userFixture);
    db.document.findUnique.mockResolvedValue(documentFixture);
    db.document.update.mockResolvedValue({ ...documentFixture, ...input });

    const res = await app.request(`/documents/${documentFixture.id}`, {
      method: 'PATCH',
      headers: {
        cookie: await accessCookie(userFixture.id),
        'content-type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    expect(res.status).toBe(200);
    const call = db.document.update.mock.calls[0]?.[0] as
      | { data?: Record<string, unknown> }
      | undefined;
    expect(call?.data).toHaveProperty('updatedAt');
    expect(call?.data?.updatedAt).toBeInstanceOf(Date);
  });
});

describe('DELETE /documents/:documentId', () => {
  it('deletes the document', async () => {
    db.user.findUnique.mockResolvedValue(userFixture);
    db.document.findUnique.mockResolvedValue(documentFixture);
    db.document.delete.mockResolvedValue(documentFixture);

    const res = await app.request(`/documents/${documentFixture.id}`, {
      method: 'DELETE',
      headers: { cookie: await accessCookie(userFixture.id) },
    });

    expect(res.status).toBe(200);
    expect(db.document.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: documentFixture.id } }),
    );
  });

  it('returns 404 when the document does not exist', async () => {
    db.user.findUnique.mockResolvedValue(userFixture);
    db.document.findUnique.mockResolvedValue(null);

    const res = await app.request(`/documents/${documentFixture.id}`, {
      method: 'DELETE',
      headers: { cookie: await accessCookie(userFixture.id) },
    });

    expect(res.status).toBe(404);
  });
});

beforeEach(() => {
  jest.clearAllMocks();
});
