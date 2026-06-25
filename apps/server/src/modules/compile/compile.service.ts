import { env } from '../../config/env.js';
import { HTTP_STATUS } from '../../shared/constants/http.constants.js';
import { AppError } from '../../shared/utils/app-error.js';

export type CompileResult = { ok: true; pdf: ArrayBuffer } | { ok: false; error: string };

export const compileService = {
  async compile(text: string): Promise<CompileResult> {
    const url = new URL('/compile', env.LATEX_ONLINE_URL);
    url.searchParams.set('text', text);
    url.searchParams.set('command', 'pdflatex');

    let response: Response;

    try {
      response = await fetch(url);
    } catch {
      throw new AppError('LaTeX compiler is unavailable.', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    const contentType = response.headers.get('content-type') ?? '';

    if (response.ok && contentType.includes('application/pdf')) {
      return { ok: true, pdf: await response.arrayBuffer() };
    }

    return { ok: false, error: await response.text() };
  },
};
