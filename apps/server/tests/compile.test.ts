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

  it('preserves the compiler structured error (type, message, file, line, column)', async () => {
    globalThis.fetch = mockFetch().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            type: 'undefined_control_sequence',
            message: "Undefined command '\\helloWorld'.",
            file: 'main.tex',
            line: 6,
            column: null,
          },
          log: 'pdflatex ...\nmain.tex:6: error: Undefined control sequence\n',
        }),
        {
          status: 400,
          headers: { 'content-type': 'application/json; charset=utf-8' },
        },
      ),
    ) as unknown as typeof fetch;

    const res = await app.request('/compile?text=broken');

    expect(res.status).toBe(400);
    expect(res.headers.get('content-type')).toContain('application/json');
    const body = await res.json();

    expect(body).toEqual({
      success: false,
      error: {
        type: 'undefined_control_sequence',
        message: "Undefined command '\\helloWorld'.",
        file: 'main.tex',
        line: 6,
        column: null,
      },
    });
  });

  it('preserves a missing-file structured error', async () => {
    globalThis.fetch = mockFetch().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            type: 'missing_file',
            message: "File 'missing.png' not found.",
            file: 'main.tex',
            line: 4,
            column: null,
          },
        }),
        {
          status: 400,
          headers: { 'content-type': 'application/json; charset=utf-8' },
        },
      ),
    ) as unknown as typeof fetch;

    const res = await app.request('/compile?text=%5Cincludegraphics%7Bmissing.png%7D');

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { type: string; line: number; file: string } };

    expect(body.error.type).toBe('missing_file');
    expect(body.error.message).toContain('missing.png');
    expect(body.error.file).toBe('main.tex');
    expect(body.error.line).toBe(4);
  });

  it('preserves a missing-package structured error', async () => {
    globalThis.fetch = mockFetch().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            type: 'missing_package',
            message: "Package 'nonexistent' not found.",
            file: 'main.tex',
            line: 1,
            column: null,
          },
        }),
        {
          status: 400,
          headers: { 'content-type': 'application/json; charset=utf-8' },
        },
      ),
    ) as unknown as typeof fetch;

    const res = await app.request('/compile?text=%5Cusepackage%7Bnonexistent%7D');

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { type: string; message: string } };

    expect(body.error.type).toBe('missing_package');
    expect(body.error.message).toContain('nonexistent');
  });

  it('preserves a generic compilation_error structured error', async () => {
    globalThis.fetch = mockFetch().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            type: 'compilation_error',
            message: 'TeX capacity exceeded, sorry [...].',
            file: null,
            line: null,
            column: null,
          },
        }),
        {
          status: 400,
          headers: { 'content-type': 'application/json; charset=utf-8' },
        },
      ),
    ) as unknown as typeof fetch;

    const res = await app.request('/compile?text=broken');

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { type: string; message: string } };

    expect(body.error.type).toBe('compilation_error');
    expect(body.error.message).toContain('TeX capacity exceeded');
  });

  it('does not treat a JSON-shaped body served as text/plain as a structured error', async () => {
    globalThis.fetch = mockFetch().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: { type: 'undefined_control_sequence', message: 'should stay plain' },
        }),
        {
          status: 400,
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        },
      ),
    ) as unknown as typeof fetch;

    const res = await app.request('/compile?text=broken');

    expect(res.status).toBe(400);
    expect(res.headers.get('content-type')).toContain('text/plain');
    expect(await res.text()).toContain('should stay plain');
  });

  it('fails gracefully on malformed JSON from the compiler', async () => {
    globalThis.fetch = mockFetch().mockResolvedValue(
      new Response('this is not json {', {
        status: 400,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      }),
    ) as unknown as typeof fetch;

    const res = await app.request('/compile?text=broken');

    expect(res.status).toBe(400);
    expect(res.headers.get('content-type')).toContain('text/plain');
    expect(await res.text()).toBe('this is not json {');
  });

  it('returns an unexpected structured-ish JSON failure as plain text when unsuccessful flag is missing', async () => {
    globalThis.fetch = mockFetch().mockResolvedValue(
      new Response(JSON.stringify({ error: { type: 'x', message: 'ignored' } }), {
        status: 400,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      }),
    ) as unknown as typeof fetch;

    const res = await app.request('/compile?text=broken');

    expect(res.status).toBe(400);
    expect(res.headers.get('content-type')).toContain('text/plain');
    expect(await res.text()).toContain('"message":"ignored"');
  });

  it('passes through a plain-text compiler failure untouched', async () => {
    globalThis.fetch = mockFetch().mockResolvedValue(
      new Response('Compiler is busy, please retry later.', {
        status: 503,
        headers: { 'content-type': 'text/plain' },
      }),
    ) as unknown as typeof fetch;

    const res = await app.request('/compile?text=hello');

    expect(res.status).toBe(400);
    expect(await res.text()).toBe('Compiler is busy, please retry later.');
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
