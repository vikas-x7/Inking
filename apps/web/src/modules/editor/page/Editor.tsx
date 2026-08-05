'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { useCreateDocument, useDocument, useUpdateDocument } from '@/src/modules/documents/hooks';
import { useCompile } from '@/src/modules/compile/hooks';
import { getApiErrorMessage } from '@/src/shared/api/api-error';
import EditorPane from '../components/EditorPane';
import PreviewPane from '../components/PreviewPane';
import TopBar from '../components/TopBar';

export interface EditorFormValues {
  title: string;
  content: string;
}

interface EditorProps {
  documentUid: string;
}

function Editor({ documentUid }: EditorProps) {
  const router = useRouter();

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

  const content = useWatch({ control, name: 'content' });

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
    const title = values.title.trim() || 'Untitled';

    updateDocument.mutate(
      { documentId: documentUid, input: { title, content: values.content } },
      { onSuccess: () => reset({ title, content: values.content }) },
    );
  });

  const isSaving = isSubmitting || updateDocument.isPending || createDocument.isPending;
  const saveError = updateDocument.error ? getApiErrorMessage(updateDocument.error) : null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#111827] font-sans text-white">
      <TopBar
        currentDocumentId={documentUid}
        onSelectDocument={handleSelectDocument}
        onNewDocument={handleNewDocument}
      />
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <EditorPane
          register={register}
          content={content}
          onContentChange={(value) => setValue('content', value, { shouldDirty: true })}
          onSubmit={onSubmit}
          isDirty={isDirty}
          isSaving={isSaving}
          isLoading={isLoading}
          isError={isError}
          saveError={saveError}
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
