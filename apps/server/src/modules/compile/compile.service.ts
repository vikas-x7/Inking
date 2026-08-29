import { env } from '../../config/env.js';
import { HTTP_STATUS } from '../../shared/constants/http.constants.js';
import { AppError } from '../../shared/utils/app-error.js';
import { compileStructuredErrorSchema } from './compile.schema.js';

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

export const compileService = {
  async compile(text: string): Promise<CompileResult> {
    const url = new URL('/compile', env.LATEX_ONLINE_URL);

    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (env.LATEX_COMPILER_TOKEN) {
      headers.authorization = `Bearer ${env.LATEX_COMPILER_TOKEN}`;
    }

    const body = JSON.stringify({ latex: text, command: 'pdflatex' });

    let response: Response;

    try {
      response = await fetch(url, { method: 'POST', headers, body });
    } catch {
      throw new AppError('LaTeX compiler is unavailable.', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const contentType = response.headers.get('content-type') ?? '';

    if (response.ok && contentType.includes('application/pdf')) {
      return { ok: true, pdf: await response.arrayBuffer() };
    }

    const bodyText = await response.text();
    const structured = parseStructuredCompileError(bodyText, contentType);

    return { ok: false, error: structured?.message ?? bodyText, structured, rawLog: structured?.log };
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