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
