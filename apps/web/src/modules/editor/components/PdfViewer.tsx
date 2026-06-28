'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

const WORKER_SRC = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.2.108/build/pdf.worker.min.mjs';

const loadPdfJs = () =>
  import('pdfjs-dist').then((module) => {
    module.GlobalWorkerOptions.workerSrc = WORKER_SRC;
    return module;
  });

const PAGE_GAP = 10;
const TOP_PAD = 12;

export interface PdfPageInfo {
  current: number;
  total: number;
}

interface PdfViewerProps {
  pdfUrl: string;
  zoom: number;
  onZoomChange?: (delta: number) => void;
  onPageInfo?: (info: PdfPageInfo) => void;
}

export default function PdfViewer({ pdfUrl, zoom, onZoomChange, onPageInfo }: PdfViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const renderTasksRef = useRef<RenderTask[]>([]);
  const pageHeightsRef = useRef<number[]>([]);
  const onPageInfoRef = useRef(onPageInfo);
  const onZoomChangeRef = useRef(onZoomChange);

  useEffect(() => {
    onPageInfoRef.current = onPageInfo;
  }, [onPageInfo]);

  useEffect(() => {
    onZoomChangeRef.current = onZoomChange;
  }, [onZoomChange]);

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;

    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      onZoomChangeRef.current?.(event.deltaY > 0 ? -1 : 1);
    };

    scroll.addEventListener('wheel', onWheel, { passive: false });
    return () => scroll.removeEventListener('wheel', onWheel);
  }, []);

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadingTaskRef.current?.destroy().catch(() => undefined);
    loadingTaskRef.current = null;
    if (pagesRef.current) pagesRef.current.innerHTML = '';

    const load = async () => {
      setStatus('loading');
      setError(null);
      try {
        const pdfjs = await loadPdfJs();
        const buffer = await fetch(pdfUrl).then((response) => response.arrayBuffer());
        if (cancelled) return;
        const loadingTask = pdfjs.getDocument({ data: buffer });
        loadingTaskRef.current = loadingTask;
        const pdf = await loadingTask.promise;
        if (cancelled) {
          void loadingTask.destroy();
          return;
        }
        pdfRef.current = pdf;
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Failed to load the PDF.');
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  const handleScroll = useCallback(() => {
    const scroll = scrollRef.current;
    const heights = pageHeightsRef.current;
    if (!scroll || heights.length === 0) return;

    const center = scroll.scrollTop + scroll.clientHeight / 2;
    let acc = TOP_PAD;
    let current = heights.length;
    for (let i = 0; i < heights.length; i += 1) {
      if (center < acc + heights[i]) {
        current = i + 1;
        break;
      }
      acc += heights[i];
    }
    onPageInfoRef.current?.({ current, total: heights.length });
  }, []);

  const renderPages = useCallback(async () => {
    const pdf = pdfRef.current;
    const container = pagesRef.current;
    const scroll = scrollRef.current;
    if (!pdf || !container || !scroll) return;

    renderTasksRef.current.forEach((task) => {
      try {
        task.cancel();
      } catch {
        // ignore already-finished tasks
      }
    });
    renderTasksRef.current = [];

    const width = scroll.clientWidth;
    const height = scroll.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    container.innerHTML = '';
    pageHeightsRef.current = [];

    const tasks: RenderTask[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const fitScale = Math.max(height / baseViewport.height, width / baseViewport.width);
      const viewport = page.getViewport({ scale: fitScale * zoom });

      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const task = page.render({
        canvas,
        viewport,
        transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
      });
      tasks.push(task);

      const wrapper = document.createElement('div');
      wrapper.className = 'shrink-0 shadow-2xl';
      wrapper.style.marginBottom = `${PAGE_GAP}px`;
      wrapper.appendChild(canvas);
      container.appendChild(wrapper);

      pageHeightsRef.current.push(viewport.height + PAGE_GAP);
    }
    renderTasksRef.current = tasks;

    onPageInfoRef.current?.({ current: 1, total: pdf.numPages });

    try {
      await Promise.all(tasks.map((task) => task.promise));
    } catch {
      // render was cancelled by a newer pass
    }
  }, [zoom]);

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll || status !== 'ready') return;

    const observer = new ResizeObserver(() => void renderPages());
    observer.observe(scroll);
    void renderPages();
    return () => observer.disconnect();
  }, [status, renderPages]);

  useEffect(() => {
    return () => {
      pdfRef.current = null;
      renderTasksRef.current.forEach((task) => {
        try {
          task.cancel();
        } catch {
          // ignore
        }
      });
      loadingTaskRef.current?.destroy().catch(() => undefined);
    };
  }, []);

  return (
    <div ref={scrollRef} onScroll={handleScroll} className="h-full w-full overflow-auto bg-black">
      {status === 'error' ? (
        <div className="grid h-full place-items-center px-6">
          <p className="text-sm text-red-500">{error ?? 'Failed to load the PDF.'}</p>
        </div>
      ) : status === 'loading' ? (
        <div className="grid h-full place-items-center">
          <p className="text-sm text-gray-400">Loading preview...</p>
        </div>
      ) : null}
      <div ref={pagesRef} className="flex flex-col items-center pt-3" />
    </div>
  );
}
