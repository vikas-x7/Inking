'use client';
import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { FiLoader } from 'react-icons/fi';
import { documentsApi } from '@/src/modules/documents/api';
import { documentsKeys, useCreateDocument, useDocument } from '@/src/modules/documents/hooks';
import { useCompile } from '@/src/modules/compile/hooks';
import { getApiErrorMessage } from '@/src/shared/api/api-error';
import { API_URL } from '@/src/shared/config/env';
import EditorPane from '../components/EditorPane';
import PreviewPane from '../components/PreviewPane';
import TopBar from '../components/TopBar';
import type { Document as ApiDocument } from '@/src/shared/api/types';
import type { PdfPageInfo } from '../components/PdfViewer';

export type EditorSaveState = 'idle' | 'saving' | 'saved' | 'error';

interface EditorProps {
  documentUid: string;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.05;

function Editor({ documentUid }: EditorProps) {
  const router = useRouter();
  const [zoom, setZoom] = useState(1);
  const [pageInfo, setPageInfo] = useState<PdfPageInfo>({ current: 1, total: 1 });
  const [editorWidth, setEditorWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const [saveState, setSaveState] = useState<EditorSaveState>('idle');
  const [hasContent, setHasContent] = useState(false);
  const contentRef = useRef('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const { data, isLoading, isError } = useDocument(documentUid);
  const createDocument = useCreateDocument();
  const compile = useCompile();

  const handleContentChange = useCallback((value: string) => {
    contentRef.current = value;
    setHasContent(Boolean(value.trim()));
  }, []);

  const handleCompile = () => compile.mutate(contentRef.current);

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

  if (isMobile) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-5 bg-black px-8 text-center font-sans text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/image/logo.png" alt="Inking Logo" className="h-8 w-8" />
        <h1 className="text-2xl font-semibold">Editor is desktop-only</h1>
        <p className="max-w-sm text-sm leading-relaxed text-white/60">
          The Inking editor is designed for large screens. Please open it on a desktop or laptop to
          write, preview, and export your LaTeX documents.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-5 bg-black font-sans text-white">
        
        <img src="/image/logo.png" alt="Inking Logo" className="h-7 w-7" />
        <div className="flex flex-col items-center gap-3 text-white/50">
          <div className="flex items-center gap-2">
          
            <span className="text-sm">Loading your document...</span>
          </div>
          <div className="loading-bar w-40" />
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
        onCompile={handleCompile}
        isCompiling={compile.isPending}
        hasContent={hasContent}
        pdfUrl={compile.pdfUrl}
        saveState={saveState}
      />
      <div
        ref={containerRef}
        className={`flex min-h-0 flex-1 flex-col lg:flex-row ${
          isResizing ? 'select-none' : ''
        }`}
        style={{ '--editor-w': `${editorWidth}%` } as CSSProperties}
      >
        <DocumentEditor
          key={documentUid}
          documentUid={documentUid}
          document={data?.document}
          onContentChange={handleContentChange}
          onSaveStateChange={setSaveState}
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

interface DocumentEditorProps {
  documentUid: string;
  document?: ApiDocument;
  onContentChange: (value: string) => void;
  onSaveStateChange: (state: EditorSaveState) => void;
}

function DocumentEditor({
  documentUid,
  document,
  onContentChange,
  onSaveStateChange,
}: DocumentEditorProps) {
  const [content, setContent] = useState('');
  const queryClient = useQueryClient();

  const mountedRef = useRef(true);
  const hydratedRef = useRef(false);
  const savedContentRef = useRef<string | null>(null);
  const latestContentRef = useRef('');
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());
  const lastOpenedAtSentRef = useRef(false);

  const emitSaveState = useCallback(
    (state: EditorSaveState) => {
      if (mountedRef.current) onSaveStateChange(state);
    },
    [onSaveStateChange],
  );

  const handleContentChange = useCallback(
    (value: string) => {
      setContent(value);
      latestContentRef.current = value;
      onContentChange(value);
    },
    [onContentChange],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!document || document.id !== documentUid || hydratedRef.current) return;

    hydratedRef.current = true;
    savedContentRef.current = document.content;
    latestContentRef.current = document.content;
    setContent(document.content);
    onContentChange(document.content);
    emitSaveState('idle');
  }, [document, documentUid, onContentChange, emitSaveState]);

  const sendLatest = useCallback(async () => {
    if (!hydratedRef.current) return;

    const docId = documentUid;
    const value = latestContentRef.current;
    if (value === savedContentRef.current) return;

    emitSaveState('saving');
    try {
      const { document: updated } = await documentsApi.update(docId, { content: value });
      savedContentRef.current = value;
      queryClient.setQueryData(documentsKeys.detail(docId), { document: updated });
      emitSaveState(value === latestContentRef.current ? 'saved' : 'saving');
    } catch {
      emitSaveState('error');
    }
  }, [documentUid, emitSaveState, queryClient]);

  const queueSave = useCallback(() => {
    saveChainRef.current = saveChainRef.current.catch(() => {}).then(sendLatest);
  }, [sendLatest]);

  useEffect(() => {
    if (!hydratedRef.current || content === savedContentRef.current) return;

    const timer = setTimeout(() => {
      void queueSave();
    }, 1000);

    return () => clearTimeout(timer);
  }, [content, queueSave]);

  useEffect(() => {
    return () => {
      if (!hydratedRef.current) return;
      const value = latestContentRef.current;
      if (value === savedContentRef.current) return;
      void documentsApi
        .update(documentUid, { content: value })
        .then(({ document }) => {
          queryClient.setQueryData(documentsKeys.detail(documentUid), { document });
        })
        .catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const flushOnUnload = () => {
      if (!hydratedRef.current || latestContentRef.current === savedContentRef.current) return;

      void fetch(`${API_URL}/documents/${encodeURIComponent(documentUid)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: latestContentRef.current }),
        keepalive: true,
      }).catch(() => {});
    };

    window.addEventListener('beforeunload', flushOnUnload);
    return () => window.removeEventListener('beforeunload', flushOnUnload);
  }, [documentUid]);

  useEffect(() => {
    if (!document || document.id !== documentUid || lastOpenedAtSentRef.current) return;

    lastOpenedAtSentRef.current = true;
    void documentsApi
      .update(documentUid, { lastOpenedAt: new Date().toISOString() })
      .catch(() => {});
  }, [document, documentUid]);

  return (
    <EditorPane
      content={content}
      onContentChange={handleContentChange}
      isLoading={false}
      isError={false}
    />
  );
}

export default Editor;