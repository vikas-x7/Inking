import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string({
    error: 'DATABASE_URL is missing. Set it in your .env file.',
  }),
  DATABASE_POOL_SIZE: z.preprocess(
    (value) => (value === '' || value === undefined ? undefined : value),
    z.coerce
      .number()
      .int('DATABASE_POOL_SIZE must be a whole number.')
      .min(1, 'DATABASE_POOL_SIZE must be at least 1.')
      .max(50, 'DATABASE_POOL_SIZE must be at most 50.')
      .default(10),
  ),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || 'environment'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Environment validation failed:\n${issues}`);
}

export const env = parsed.data;
