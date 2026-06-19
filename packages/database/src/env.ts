import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string({
    error: 'DATABASE_URL is missing. Set it in your .env file.',
  }),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || 'environment'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Environment validation failed:\n${issues}`);
}

export const env = parsed.data;
