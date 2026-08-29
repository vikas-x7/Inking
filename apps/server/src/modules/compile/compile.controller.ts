import type { Context } from 'hono';
import { HTTP_STATUS } from '../../shared/constants/http.constants.js';
import { AppError } from '../../shared/utils/app-error.js';
import { compileBodySchema, compileQuerySchema } from './compile.schema.js';
import { compileService } from './compile.service.js';

const renderCompileResult = async (c: Context, text: string) => {
  const result = await compileService.compile(text);

  if (!result.ok) {
    if (result.structured) {
      return c.json(
        {
          success: false,
          error: {
            type: result.structured.type,
            message: result.structured.message,
            file: result.structured.file,
            line: result.structured.line,
            column: result.structured.column,
          },
        },
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    return c.text(result.error, HTTP_STATUS.BAD_REQUEST);
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
