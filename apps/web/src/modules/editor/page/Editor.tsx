'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { useCreateDocument, useDocument, useUpdateDocument } from '@/src/modules/documents/hooks';
import { useCompile } from '@/src/modules/compile/hooks';
import { getApiErrorMessage } from '@/src/shared/api/api-error';
import EditorPane from '../components/EditorPane';
import PreviewPane from '../components/PreviewPane';
import TopBar from '../components/TopBar';
import type { PdfPageInfo } from '../components/PdfViewer';

export interface EditorFormValues {
  title: string;
  content: string;
}

interface EditorProps {
  documentUid: string;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

function Editor({ documentUid }: EditorProps) {
  const router = useRouter();
  const [zoom, setZoom] = useState(1);
  const [pageInfo, setPageInfo] = useState<PdfPageInfo>({ current: 1, total: 1 });

  const { data, isLoading, isError } = useDocument(documentUid);
  const createDocument = useCreateDocument();
  const updateDocument = useUpdateDocument();
  const compile = useCompile();

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { isDirty, isSubmitting },
  } = useForm<EditorFormValues>({
    defaultValues: { title: '', content: '' },
  });

  useEffect(() => {
    if (data?.document) {
      reset({
        title: data.document.title,
        content: data.document.content,
      });
    }
  }, [data, reset]);

  const title = useWatch({ control, name: 'title' });
  const content = useWatch({ control, name: 'content' });

  const changeZoom = (delta: number) =>
    setZoom((value) =>
      Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((value + delta) * 100) / 100)),
    );

  const handleSelectDocument = (id: string) => {
    compile.reset();
    router.push(`/editor/${id}`);
  };

  const handleNewDocument = () => {
    compile.reset();
    createDocument.mutate(
      { title: 'Untitled', content: '' },
      {
        onSuccess: ({ document }) => {
          router.push(`/editor/${document.id}`);
        },
      },
    );
  };

  const onSubmit = handleSubmit((values) => {
    const cleanTitle = values.title.trim() || 'Untitled';

    updateDocument.mutate(
      { documentId: documentUid, input: { title: cleanTitle, content: values.content } },
      { onSuccess: () => reset({ title: cleanTitle, content: values.content }) },
    );
  });

  const isSaving = isSubmitting || updateDocument.isPending || createDocument.isPending;
  const saveError = updateDocument.error ? getApiErrorMessage(updateDocument.error) : null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-black font-sans text-white">
      <TopBar
        currentDocumentId={documentUid}
        onSelectDocument={handleSelectDocument}
        onNewDocument={handleNewDocument}
        title={title ?? ''}
        onTitleChange={(val) => setValue('title', val, { shouldDirty: true })}
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={onSubmit}
        saveError={saveError}
        onCompile={() => compile.mutate(content ?? '')}
        isCompiling={compile.isPending}
        hasContent={Boolean(content?.trim())}
        zoom={zoom}
        onZoomIn={() => changeZoom(ZOOM_STEP)}
        onZoomOut={() => changeZoom(-ZOOM_STEP)}
        pageInfo={pageInfo}
        pdfUrl={compile.pdfUrl}
      />
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <EditorPane
          content={content ?? ''}
          onContentChange={(value) => setValue('content', value, { shouldDirty: true })}
          isLoading={isLoading}
          isError={isError}
        />
        <PreviewPane
          zoom={zoom}
          onZoomChange={(delta) => changeZoom(delta * ZOOM_STEP)}
          onPageInfo={setPageInfo}
          pdfUrl={compile.pdfUrl}
          compileError={compile.error ? getApiErrorMessage(compile.error) : null}
        />
      </div>
    </div>
  );
}

export default Editor;
