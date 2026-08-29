import { AxiosError } from 'axios';
import { httpClient } from '@/src/shared/api/http-client';

export interface CompileErrorInfo {
  type: string;
  message: string;
  file: string | null;
  line: number | null;
  column: number | null;
  raw?: string;
}

export interface LatexLogError {
  text: string;
  line: number | null;
}

const MAX_LOG_ERRORS = 5;

/**
 * Best-effort display extraction used only when the compiler returns a plain
 * LaTeX log instead of a structured error. Pulls the `! ...` error blocks out
 * of the raw log so the actual error is visible instead of being buried.
 */
export const extractLatexLogError = (log: string): LatexLogError | null => {
  const lines = log.split(/\r?\n/);
  const blocks: string[] = [];
  let line: number | null = null;

  for (let i = 0; i < lines.length && blocks.length < MAX_LOG_ERRORS; i += 1) {
    if (!lines[i].startsWith('! ')) continue;

    const block = [lines[i]];
    for (let j = i + 1; j < Math.min(lines.length, i + 6); j += 1) {
      const current = lines[j];
      if (current.startsWith('! ') || current.trim() === '') break;
      if (line === null) {
        const match = current.match(/^l\.\s*(\d+)/);
        if (match) line = Number(match[1]);
      }
      block.push(current);
    }
    blocks.push(block.join('\n'));
  }

  if (blocks.length === 0) return null;
  return { text: blocks.join('\n\n'), line };
};

export class CompileError extends Error {
  readonly info: CompileErrorInfo | null;

  constructor(message: string, info: CompileErrorInfo | null = null) {
    super(message);
    this.name = 'CompileError';
    this.info = info;
  }
}

const parseStructuredError = (text: string): CompileErrorInfo | null => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;

  const { success, error } = parsed as { success?: unknown; error?: unknown };
  if (success !== false || typeof error !== 'object' || error === null) return null;

  const { type, message, file, line, column } = error as Record<string, unknown>;
  if (typeof type !== 'string') return null;

  return {
    type,
    message: typeof message === 'string' ? message : 'LaTeX compilation failed.',
    file: typeof file === 'string' ? file : null,
    line: typeof line === 'number' ? line : null,
    column: typeof column === 'number' ? column : null,
  };
};

export const compileApi = {
  async compile(text: string): Promise<Blob> {
    try {
      const response = await httpClient.post<Blob>('/compile', { text }, { responseType: 'blob' });

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data instanceof Blob) {
        const body = (await error.response.data.text()) || 'Compilation failed.';
        throw new CompileError(body, parseStructuredError(body));
      }

      throw error;
    }
  },
};