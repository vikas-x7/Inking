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
    console.log('[WorkspaceRedirect]', {
      isAuthLoading,
      user,
      userId: user?.id,
      documentsIsLoading: documents.isLoading,
      documentsIsSuccess: documents.isSuccess,
      documentsIsError: documents.isError,
      documentsData: documents.data,
      documentCount: documents.data?.documents?.length,
      resolved: resolvedRef.current,
      createStatus: createDocument.status,
      pathname: window.location.pathname,
    });

    if (isAuthLoading) {
      console.log('[WorkspaceRedirect] EARLY RETURN - auth loading');
      return;
    }
    if (!user) {
      console.log('[WorkspaceRedirect] EARLY RETURN - no user');
      return;
    }
    if (resolvedRef.current) {
      console.log('[WorkspaceRedirect] EARLY RETURN - already resolved');
      return;
    }

    if (documents.isLoading) {
      console.log('[WorkspaceRedirect] EARLY RETURN - documents loading');
      return;
    }

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
        console.log('[WorkspaceRedirect] NAVIGATING TO EXISTING', editorUrl);
        router.replace(editorUrl);
        guardHardNavigation(editorUrl);
        return;
      }
    }

    if (documents.isSuccess || documents.isError) {
      if (createDocument.isIdle || createDocument.isError) {
        resolvedRef.current = true;
        console.log('[WorkspaceRedirect] CREATING NEW DOCUMENT');
        createDocument.mutate(
          { title: 'Untitled', content: '' },
          {
            onSuccess: ({ document }) => {
              console.log('[WorkspaceRedirect] CREATE SUCCESS', { document });
              const editorUrl = `/editor/${document.id}`;
              router.replace(editorUrl);
              guardHardNavigation(editorUrl);
            },
            onError: (error) => {
              console.log('[WorkspaceRedirect] CREATE ERROR', error);
              resolvedRef.current = false;
            },
          },
        );
      }
    }
  }, [isAuthLoading, user, documents, createDocument, router]);

  return null;
}
