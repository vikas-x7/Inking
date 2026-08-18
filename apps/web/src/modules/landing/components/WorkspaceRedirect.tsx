'use client';
import { useRef } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/modules/auth/hooks';
import { useCreateDocument, useDocuments } from '@/src/modules/documents/hooks';

export default function WorkspaceRedirect() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const documents = useDocuments();
  const createDocument = useCreateDocument();
  const resolvedRef = useRef(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current !== null) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isAuthLoading || !user || resolvedRef.current) return;

    if (documents.isLoading) return;

    const guardHardNavigation = (editorUrl: string) => {
      if (fallbackTimerRef.current !== null) {
        clearTimeout(fallbackTimerRef.current);
      }
      fallbackTimerRef.current = setTimeout(() => {
        fallbackTimerRef.current = null;
        if (window.location.pathname === '/') {
          window.location.replace(editorUrl);
        }
      }, 100);
    };

    if (documents.isSuccess) {
      const unarchived = (documents.data?.documents ?? [])
        .filter((document) => !document.isArchived)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      if (unarchived.length > 0) {
        resolvedRef.current = true;
        const editorUrl = `/editor/${unarchived[0].id}`;
        router.replace(editorUrl);
        guardHardNavigation(editorUrl);
        return;
      }
    }

    if (documents.isSuccess || documents.isError) {
      if (createDocument.isIdle || createDocument.isError) {
        resolvedRef.current = true;
        createDocument.mutate(
          { title: 'Untitled', content: '' },
          {
            onSuccess: ({ document }) => {
              const editorUrl = `/editor/${document.id}`;
              router.replace(editorUrl);
              guardHardNavigation(editorUrl);
            },
            onError: () => {
              resolvedRef.current = false;
            },
          },
        );
      }
    }
  }, [isAuthLoading, user, documents, createDocument, router]);

  return null;
}
