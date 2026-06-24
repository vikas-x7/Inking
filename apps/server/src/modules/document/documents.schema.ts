import { z } from 'zod';

export const createDocumentSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(200),
  content: z.string().default(''),
  description: z.string().trim().max(500).nullable().optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().optional(),
  description: z.string().trim().max(500).nullable().optional(),
  isArchived: z.boolean().optional(),
  lastOpenedAt: z.string().datetime().optional(),
});

export const documentIdSchema = z.object({
  documentId: z.string().min(1),
});

export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
