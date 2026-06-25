import type { Context } from 'hono';
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
    const { text } = compileBodySchema.parse(await c.req.json());

    return renderCompileResult(c, text);
  },
};
