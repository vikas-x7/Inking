import type { Context } from 'hono';
import { createDocumentSchema, documentIdSchema, updateDocumentSchema } from './documents.schema.js';
import { documentsService } from './documents.service.js';

export const documentsController = {
  async list(c: Context) {
    const documents = await documentsService.listDocuments(c.get('userId'));

    return c.json({ documents });
  },

  async get(c: Context) {
    const { documentId } = documentIdSchema.parse(c.req.param());
    const document = await documentsService.getDocument(c.get('userId'), documentId);

    return c.json({ document });
  },

  async create(c: Context) {
    const body = createDocumentSchema.parse(await c.req.json());
    const document = await documentsService.createDocument(c.get('userId'), body);

    return c.json({ document }, 201);
  },

  async update(c: Context) {
    const { documentId } = documentIdSchema.parse(c.req.param());
    const body = updateDocumentSchema.parse(await c.req.json());
    const document = await documentsService.updateDocument(c.get('userId'), documentId, body);

    return c.json({ document });
  },

  async remove(c: Context) {
    const { documentId } = documentIdSchema.parse(c.req.param());
    await documentsService.deleteDocument(c.get('userId'), documentId);

    return c.json({ success: true });
  },
};
