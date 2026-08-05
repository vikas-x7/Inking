'use client';
import { useRef } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/modules/auth/auth-provider';
import { useCreateDocument, useDocuments } from '@/src/modules/documents/hooks';

export default function WorkspaceRedirect() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const documents = useDocuments();
  const createDocument = useCreateDocument();
  const resolvedRef = useRef(false);

  useEffect(() => {
    if (isAuthLoading || !user || resolvedRef.current) return;

    if (!documents.isSuccess) return;

    const unarchived = (documents.data.documents ?? [])
      .filter((document) => !document.isArchived)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    if (unarchived.length > 0) {
      resolvedRef.current = true;
      router.replace(`/editor/${unarchived[0].id}`);
      return;
    }

    if (createDocument.isIdle) {
      resolvedRef.current = true;
      createDocument.mutate(
        { title: 'Untitled', content: '' },
        {
          onSuccess: ({ document }) => {
            router.replace(`/editor/${document.id}`);
          },
        },
      );
    }
  }, [isAuthLoading, user, documents, createDocument, router]);

  return null;
}
