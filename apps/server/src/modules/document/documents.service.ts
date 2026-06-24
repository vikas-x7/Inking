import { HTTP_STATUS } from '../../shared/constants/http.constants.js';
import { AppError } from '../../shared/utils/app-error.js';
import { documentsRepository } from './documents.repository.js';
import type { UpdateDocumentInput } from './documents.schema.js';

export const documentsService = {
  async listDocuments(userId: string) {
    return documentsRepository.listByUser(userId);
  },

  async getDocument(userId: string, documentId: string) {
    const document = await documentsRepository.findById(documentId);

    if (!document || document.userId !== userId) {
      throw new AppError('Document not found.', HTTP_STATUS.NOT_FOUND);
    }

    return document;
  },

  async createDocument(userId: string, data: { title: string; content: string; description?: string | null }) {
    return documentsRepository.create(userId, data);
  },

  async updateDocument(
    userId: string,
    documentId: string,
    data: UpdateDocumentInput,
  ) {
    await this.getDocument(userId, documentId);

    return documentsRepository.update(documentId, {
      title: data.title,
      content: data.content,
      description: data.description,
      isArchived: data.isArchived,
      lastOpenedAt: data.lastOpenedAt ? new Date(data.lastOpenedAt) : undefined,
    });
  },

  async deleteDocument(userId: string, documentId: string) {
    await this.getDocument(userId, documentId);

    return documentsRepository.delete(documentId);
  },
};
