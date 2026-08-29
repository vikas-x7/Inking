import { z } from 'zod';

export const compileQuerySchema = z.object({
  text: z.string().min(1, 'LaTeX text is required.'),
});

export const compileBodySchema = z.object({
  text: z.string().min(1, 'LaTeX text is required.'),
});

/**
 * Validates the structured error contract returned by the LaTeX compiler at the
 * service boundary. The compiler owns LaTeX error classification; this schema
 * only shapes/validates the transport so the Backend can forward it unchanged.
 */
export const compileStructuredErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    type: z.string(),
    message: z.string(),
    file: z.string().nullable().optional(),
    line: z.number().nullable().optional(),
    column: z.number().nullable().optional(),
  }),
  log: z.string().optional(),
});
