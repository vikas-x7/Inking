'use client';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import { FiLoader } from 'react-icons/fi';
import { useForm, useWatch } from 'react-hook-form';
import { useCreateDocument, useDocument } from '@/src/modules/documents/hooks';
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
  const [editorWidth, setEditorWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useDocument(documentUid);
  const createDocument = useCreateDocument();
  const compile = useCompile();

  const {
    reset,
    control,
    setValue,
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

  const changeZoom = (delta: number) =>
    setZoom((value) =>
      Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((value + delta) * 100) / 100)),
    );

  const startResize = useCallback((e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    setIsResizing(true);

    const onMove = (ev: globalThis.MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setEditorWidth(Math.min(80, Math.max(20, pct)));
    };
    const onUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

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

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-5 bg-black font-sans text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/image/logo.png" alt="Inking Logo" className="h-7 w-7" />
        <div className="flex items-center gap-2 text-white/50">
          <FiLoader size={20} className="animate-spin" />
          <span className="text-sm">Loading your document...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-black font-sans text-white">
        <p className="text-sm text-red-400">Failed to load document.</p>
        <button
          onClick={() => router.push('/')}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:opacity-90"
        >
          Go to home
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-black font-sans text-white">
      <TopBar
        currentDocumentId={documentUid}
        onSelectDocument={handleSelectDocument}
        onNewDocument={handleNewDocument}
        onCompile={() => compile.mutate(content ?? '')}
        isCompiling={compile.isPending}
        hasContent={Boolean(content?.trim())}
        pdfUrl={compile.pdfUrl}
      />
      <div
        ref={containerRef}
        className={`flex min-h-0 flex-1 flex-col lg:flex-row ${
          isResizing ? 'select-none' : ''
        }`}
        style={{ '--editor-w': `${editorWidth}%` } as CSSProperties}
      >
        <EditorPane
          content={content ?? ''}
          onContentChange={(value) => setValue('content', value, { shouldDirty: true })}
          isLoading={isLoading}
          isError={isError}
        />

        <div
          onMouseDown={startResize}
          onDoubleClick={() => setEditorWidth(50)}
          role="separator"
          aria-orientation="vertical"
          title="Drag to resize"
          className="hidden lg:flex relative w-1.5 shrink-0 cursor-col-resize items-stretch bg-[#1E1E1E] hover:bg-[#0055D6] active:bg-[#0055D6] transition-colors"
        >
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/10 pointer-events-none" />
        </div>

        <PreviewPane
          zoom={zoom}
          onZoomChange={(delta) => changeZoom(delta * ZOOM_STEP)}
          onPageInfo={setPageInfo}
          pageInfo={pageInfo}
          pdfUrl={compile.pdfUrl}
          compileError={compile.error ? getApiErrorMessage(compile.error) : null}
        />
      </div>
    </div>
  );
}

export default Editor;
