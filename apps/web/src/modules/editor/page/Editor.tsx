'use client';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { useDocument, useUpdateDocument } from '@/src/modules/documents/hooks';
import { useCompile } from '@/src/modules/compile/hooks';
import { getApiErrorMessage } from '@/src/shared/api/api-error';
import EditorPane from '../components/EditorPane';
import PreviewPane from '../components/PreviewPane';

export interface EditorFormValues {
  title: string;
  content: string;
}

function Editor() {
  const searchParams = useSearchParams();
  const documentId = searchParams.get('id') ?? undefined;

  const { data, isLoading, isError } = useDocument(documentId);
  const updateDocument = useUpdateDocument();
  const compile = useCompile();

  const {
    register,
    handleSubmit,
    reset,
    control,
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

  const content = useWatch({ control, name: 'content' });

  const onSubmit = handleSubmit((values) => {
    if (!documentId) return;
    updateDocument.mutate({ documentId, input: values }, { onSuccess: () => reset(values) });
  });

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#111827] font-sans text-white">
      <div className="flex h-screen w-full flex-col lg:flex-row">
        <EditorPane
          register={register}
          content={content}
          onSubmit={onSubmit}
          isDirty={isDirty}
          isSaving={isSubmitting || updateDocument.isPending}
          isLoading={isLoading}
          isError={isError || !documentId}
        />
        <PreviewPane
          content={content}
          onCompile={() => compile.mutate(content)}
          isCompiling={compile.isPending}
          pdfUrl={compile.pdfUrl}
          compileError={compile.error ? getApiErrorMessage(compile.error) : null}
        />
      </div>
    </div>
  );
}

export default Editor;
