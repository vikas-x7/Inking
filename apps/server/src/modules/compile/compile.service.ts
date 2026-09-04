import { env } from '../../config/env.js';
import { HTTP_STATUS } from '../../shared/constants/http.constants.js';
import {
  CompilerError,
  CompilerTimeoutError,
  CompilerUnavailableError,
} from '../../shared/errors/app-error.js';
import { compileStructuredErrorSchema } from './compile.schema.js';

/** Hard cap on compiler response time; aborts the upstream request on expiry. */
const COMPILE_TIMEOUT_MS = 30_000;

const MAX_UPSTREAM_BODY_LOG_LENGTH = 500;

export type StructuredCompileError = {
  type: string;
  message: string;
  file: string | null;
  line: number | null;
  column: number | null;
};

export type CompileResult =
  | { ok: true; pdf: ArrayBuffer }
  | {
      ok: false;
      error: string;
      structured?: StructuredCompileError;
      rawLog?: string;
    };

const isAbortError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'name' in error &&
  (error as { name?: unknown }).name === 'AbortError';

const truncate = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max)}…` : value;

/**
 * Compiler integration boundary.
 *
 * Successfully compiled code and client LaTeX failures are returned as a
 * `CompileResult` for the controller to pass through in the compiler contract
 * format. Infrastructure failures (timeouts, network faults, 5xx, protocol
 * violations) are thrown as typed compiler errors so the global handler can
 * format them. This keeps the compiler contract intact while preventing raw
 * upstream bodies, credentials, or internals from reaching clients.
 */
export const compileService = {
  async compile(text: string): Promise<CompileResult> {
    const url = new URL('/compile', env.LATEX_COMPILER_URL);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), COMPILE_TIMEOUT_MS);

    let response: Response;

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${env.COMPILER_INTERNAL_TOKEN}`,
        },
        body: JSON.stringify({ latex: text, command: 'pdflatex' }),
        signal: controller.signal,
      });
    } catch (error) {
      if (isAbortError(error)) {
        throw new CompilerTimeoutError('LaTeX compilation timed out.', { cause: error });
      }
      throw new CompilerUnavailableError('LaTeX compiler service is unavailable.', {
        cause: error,
      });
    } finally {
      clearTimeout(timeout);
    }

    const contentType = response.headers.get('content-type') ?? '';

    // The shared token was rejected: this is our integration configuration, not
    // a client problem. Do not surface the token or credential details.
    if (response.status === HTTP_STATUS.UNAUTHORIZED || response.status === HTTP_STATUS.FORBIDDEN) {
      throw new CompilerError('The LaTeX compiler service rejected the request.', {
        cause: new Error(`Compiler upstream returned HTTP ${response.status}.`),
      });
    }

    // Service-level failures: transient infrastructure issue, retryable.
    if (response.status >= 500) {
      throw new CompilerUnavailableError('LaTeX compiler service is temporarily unavailable.', {
        cause: new Error(`Compiler upstream returned HTTP ${response.status}.`),
      });
    }

    if (response.ok && contentType.includes('application/pdf')) {
      const pdf = await response.arrayBuffer();
      if (pdf.byteLength === 0) {
        throw new CompilerError('The LaTeX compiler service returned an empty response.', {
          cause: new Error('Empty PDF body received from the compiler.'),
        });
      }
      return { ok: true, pdf };
    }

    // A 2xx response that is neither a PDF nor a structured error is a protocol
    // violation (or an empty body); never forward it as a client error.
    if (response.ok) {
      const bodyText = truncate(await response.text(), MAX_UPSTREAM_BODY_LOG_LENGTH);
      throw new CompilerError(
        bodyText.trim() === ''
          ? 'The LaTeX compiler service returned an empty response.'
          : 'The LaTeX compiler service returned an invalid response.',
        { cause: new Error(`Invalid upstream body: ${bodyText}`) },
      );
    }

    // Remaining non-2xx responses are client LaTeX errors (bad source, missing
    // packages, ...) and are passed through in the compiler contract format.
    const bodyText = await response.text();
    const structured = parseStructuredCompileError(bodyText, contentType);

    return {
      ok: false,
      error: structured?.message ?? bodyText,
      structured,
      rawLog: structured?.log,
    };
  },
};

/**
 * Passes through the compiler service's structured LaTeX error without doing
 * any LaTeX parsing on this side. Only JSON responses are considered, and the
 * shape is validated with the compiler contract schema. Returns undefined for
 * plain-text failures (busy/oversized/uploads) and legacy non-JSON logs.
 */
function parseStructuredCompileError(
  text: string,
  contentType: string,
): (StructuredCompileError & { log?: string }) | undefined {
  if (!contentType.includes('application/json')) return undefined;

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return undefined;
  }

  const result = compileStructuredErrorSchema.safeParse(parsed);
  if (!result.success) return undefined;

  const { error, log } = result.data;

  return {
    type: error.type,
    message: error.message,
    file: error.file ?? null,
    line: error.line ?? null,
    column: error.column ?? null,
    log,
  };
}
