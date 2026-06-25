import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import app from '../src/app.js';

const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);

const mockFetch = () => jest.fn<() => Promise<Response>>();

describe('GET /compile', () => {
  it('returns the compiled PDF when the compiler succeeds', async () => {
    globalThis.fetch = mockFetch().mockResolvedValue(
      new Response(pdfBytes, {
        status: 200,
        headers: { 'content-type': 'application/pdf' },
      }),
    ) as unknown as typeof fetch;

    const res = await app.request('/compile?text=%5Cdocumentclass%7Barticle%7D');

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/pdf');
    const body = new Uint8Array(await res.arrayBuffer());
    expect(body).toEqual(pdfBytes);
  });

  it('returns a plain text log when the compiler returns an error', async () => {
    globalThis.fetch = mockFetch().mockResolvedValue(
      new Response('! LaTeX Error: File not found.', {
        status: 400,
        headers: { 'content-type': 'text/plain' },
      }),
    ) as unknown as typeof fetch;

    const res = await app.request('/compile?text=bad');

    expect(res.status).toBe(400);
    expect(res.headers.get('content-type')).toContain('text/plain');
    expect(await res.text()).toContain('LaTeX Error');
  });

  it('returns 500 when the compiler is unreachable', async () => {
    globalThis.fetch = mockFetch().mockRejectedValue(
      new TypeError('fetch failed'),
    ) as unknown as typeof fetch;

    const res = await app.request('/compile?text=hello');

    expect(res.status).toBe(500);
  });

  it('returns 400 when text is missing', async () => {
    const res = await app.request('/compile');

    expect(res.status).toBe(400);
  });
});

describe('POST /compile', () => {
  it('compiles LaTeX sent in the JSON body', async () => {
    globalThis.fetch = mockFetch().mockResolvedValue(
      new Response(pdfBytes, {
        status: 200,
        headers: { 'content-type': 'application/pdf' },
      }),
    ) as unknown as typeof fetch;

    const res = await app.request('/compile', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: '\\documentclass{article}' }),
    });

    expect(res.status).toBe(200);
    const body = new Uint8Array(await res.arrayBuffer());
    expect(body).toEqual(pdfBytes);
  });

  it('returns 400 for an invalid body', async () => {
    const res = await app.request('/compile', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nope: true }),
    });

    expect(res.status).toBe(400);
  });

  it('returns 400 for an empty body', async () => {
    const res = await app.request('/compile', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '',
    });

    expect(res.status).toBe(400);
  });
});

beforeEach(() => {
  jest.restoreAllMocks();
});
