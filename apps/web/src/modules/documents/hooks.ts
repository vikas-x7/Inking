import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from './api';
import type { UpdateDocumentInput } from './api';

export const documentsKeys = {
  all: ['documents'] as const,
  detail: (id: string) => ['documents', id] as const,
};

export function useDocuments() {
  return useQuery({
    queryKey: documentsKeys.all,
    queryFn: documentsApi.list,
  });
}

export function useDocument(documentId?: string) {
  return useQuery({
    queryKey: documentsKeys.detail(documentId ?? ''),
    queryFn: () => documentsApi.get(documentId as string),
    enabled: Boolean(documentId),
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: documentsApi.create,
    onSuccess: ({ document }) => {
      queryClient.setQueryData(documentsKeys.detail(document.id), { document });
      queryClient.invalidateQueries({ queryKey: documentsKeys.all });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, input }: { documentId: string; input: UpdateDocumentInput }) =>
      documentsApi.update(documentId, input),
    onSuccess: ({ document }) => {
      queryClient.setQueryData(documentsKeys.detail(document.id), { document });
      queryClient.invalidateQueries({ queryKey: documentsKeys.all });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: documentsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsKeys.all });
    },
  });
}

export function useRestoreDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => documentsApi.update(documentId, { isArchived: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsKeys.all });
    },
  });
}
