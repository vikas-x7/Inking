import { httpClient } from '@/src/shared/api/http-client';
import type { Document } from '@/src/shared/api/types';

export interface CreateDocumentInput {
  title: string;
  content?: string;
  description?: string | null;
}

export interface UpdateDocumentInput {
  title?: string;
  content?: string;
  description?: string | null;
  isArchived?: boolean;
  lastOpenedAt?: string;
}

export const documentsApi = {
  list: async (search?: string) =>
    (
      await httpClient.get<{ documents: Document[] }>('/documents', {
        params: search ? { search } : undefined,
      })
    ).data,

  get: async (documentId: string) =>
    (await httpClient.get<{ document: Document }>(`/documents/${documentId}`)).data,

  create: async (input: CreateDocumentInput) =>
    (await httpClient.post<{ document: Document }>('/documents', input)).data,

  update: async (documentId: string, input: UpdateDocumentInput) =>
    (await httpClient.patch<{ document: Document }>(`/documents/${documentId}`, input)).data,

  remove: async (documentId: string) =>
    (await httpClient.delete<{ success: boolean }>(`/documents/${documentId}`)).data,
};
