import type { Context } from 'hono';
import { HTTP_STATUS } from '../../shared/constants/http.constants.js';
import { AppError } from '../../shared/utils/app-error.js';
import { compileBodySchema, compileQuerySchema } from './compile.schema.js';
import { compileService } from './compile.service.js';

const renderCompileResult = async (c: Context, text: string) => {
  const result = await compileService.compile(text);

  if (!result.ok) {
    return c.text(result.error, 400);
  }

  return new Response(result.pdf, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline',
    },
  });
};

export const compileController = {
  async compileFromQuery(c: Context) {
    const { text } = compileQuerySchema.parse(c.req.query());

    return renderCompileResult(c, text);
  },

  async compileFromBody(c: Context) {
    let body: unknown;

    try {
      body = await c.req.json();
    } catch {
      throw new AppError('Request body must be valid JSON.', HTTP_STATUS.BAD_REQUEST);
    }

    const { text } = compileBodySchema.parse(body);

    return renderCompileResult(c, text);
  },
};
