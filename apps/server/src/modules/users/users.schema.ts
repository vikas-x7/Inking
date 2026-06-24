import { z } from 'zod';

export const updateMeSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  image: z.string().url().nullable().optional(),
});

export const usersMeResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    image: z.string().nullable(),
  }),
});
