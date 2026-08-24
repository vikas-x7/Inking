import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  FRONTEND_URL: z
    .string()
    .url()
    .default('http://localhost:3000')
    .transform((value) => value.replace(/\/+$/, '')),
  API_URL: z.string().url().default('http://localhost:3001'),
  ACCESS_JWT_SECRET: z
    .string({
      error: 'ACCESS_JWT_SECRET is required.',
    })
    .min(32, 'ACCESS_JWT_SECRET must be at least 32 characters.'),
  REFRESH_JWT_SECRET: z
    .string({
      error: 'REFRESH_JWT_SECRET is required.',
    })
    .min(32, 'REFRESH_JWT_SECRET must be at least 32 characters.'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  LATEX_ONLINE_URL: z.string().url().default('https://latexonline.cc'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || 'environment'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Server environment validation failed:\n${issues}`);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === 'production';
