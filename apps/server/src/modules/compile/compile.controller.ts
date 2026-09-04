import type { Context } from 'hono';
import { HTTP_STATUS } from '../../shared/constants/http.constants.js';
import { ValidationError } from '../../shared/errors/app-error.js';
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

  return c.body(result.pdf, 200, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'inline',
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
      throw new ValidationError('Request body must be valid JSON.', {
        details: [{ field: 'body', message: 'Request body must be a valid JSON object.' }],
      });
    }

    const { text } = compileBodySchema.parse(body);

    return renderCompileResult(c, text);
  },
};
