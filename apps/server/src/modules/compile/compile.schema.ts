import { z } from 'zod';

export const compileQuerySchema = z.object({
  text: z.string().min(1, 'LaTeX text is required.'),
});

export const compileBodySchema = z.object({
  text: z.string().min(1, 'LaTeX text is required.'),
});
