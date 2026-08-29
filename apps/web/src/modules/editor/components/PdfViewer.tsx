'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist';

/* eslint-disable react-hooks/immutability -- imperative DOM/canvas manipulation, no props/state mutation */

const WORKER_SRC = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.2.108/build/pdf.worker.min.mjs';

const loadPdfJs = () =>
  import('pdfjs-dist').then((module) => {
    module.GlobalWorkerOptions.workerSrc = WORKER_SRC;
    return module;
  });

const PAGE_GAP = 10;
const TOP_PAD = 12;
const ZOOM_WHEEL_ACCUM = 36;
const RENDER_BUFFER = 1.5;

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
  const pdfPagesRef = useRef<Map<number, PDFPageProxy>>(new Map());
  const pageOffsetsRef = useRef<number[]>([]);
  const pageHeightsRef = useRef<number[]>([]);
  const visibleRenderTasksRef = useRef<Map<number, RenderTask>>(new Map());
  const wheelAccumulatorRef = useRef(0);
  const layoutDimsRef = useRef({ width: 0, height: 0 });
  const buildIdRef = useRef(0);
  const rafRef = useRef(0);
  const onPageInfoRef = useRef(onPageInfo);
  const onZoomChangeRef = useRef(onZoomChange);
  const zoomRef = useRef(zoom);

  useEffect(() => {
    onPageInfoRef.current = onPageInfo;
  }, [onPageInfo]);

  useEffect(() => {
    onZoomChangeRef.current = onZoomChange;
  }, [onZoomChange]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

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

  const cancelAllPageTasks = () => {
    visibleRenderTasksRef.current.forEach((task) => {
      try {
        task.cancel();
      } catch {
        // ignore already-finished tasks
      }
    });
    visibleRenderTasksRef.current.clear();
  };

  const updatePageInfo = useCallback(() => {
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

  const renderPageInto = useCallback(async (pageNumber: number, wrapper: HTMLElement, dpr: number) => {
    const pdfPage = pdfPagesRef.current.get(pageNumber);
    if (!pdfPage) return;

    const { width, height } = layoutDimsRef.current;
    const base = pdfPage.getViewport({ scale: 1 });
    const fitScale = width > 0 ? Math.max(height / base.height, width / base.width) : 1;
    const viewport = pdfPage.getViewport({ scale: fitScale * zoomRef.current });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;
    wrapper.appendChild(canvas);

    const task = pdfPage.render({
      canvas,
      viewport,
      transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
    });
    visibleRenderTasksRef.current.set(pageNumber, task);

    try {
      await task.promise;
    } catch {
      // render was cancelled
    } finally {
      if (visibleRenderTasksRef.current.get(pageNumber) === task) {
        visibleRenderTasksRef.current.delete(pageNumber);
      }
    }
  }, []);

  const renderVisiblePages = useCallback(() => {
    const scroll = scrollRef.current;
    if (!scroll || pageOffsetsRef.current.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const viewTop = scroll.scrollTop;
    const viewBottom = viewTop + scroll.clientHeight;
    const buffer = scroll.clientHeight * RENDER_BUFFER;

    for (let n = 1; n <= pageOffsetsRef.current.length; n += 1) {
      const wrapper = pagesRef.current?.children[n - 1] as HTMLElement | undefined;
      if (!wrapper) continue;

      const top = pageOffsetsRef.current[n - 1];
      const bottom = top + pageHeightsRef.current[n - 1];
      const visible = bottom >= viewTop - buffer && top <= viewBottom + buffer;

      if (visible && wrapper.dataset.rendered !== '1') {
        wrapper.dataset.rendered = '1';
        void renderPageInto(n, wrapper, dpr);
      } else if (!visible && wrapper.dataset.rendered === '1') {
        wrapper.dataset.rendered = '';
        visibleRenderTasksRef.current.get(n)?.cancel();
        visibleRenderTasksRef.current.delete(n);
        wrapper.querySelector('canvas')?.remove();
      }
    }
  }, [renderPageInto]);

  const renderPages = useCallback(async () => {
    const pdf = pdfRef.current;
    const container = pagesRef.current;
    const scroll = scrollRef.current;
    if (!pdf || !container || !scroll) return;

    const buildId = ++buildIdRef.current;
    cancelAllPageTasks();
    pdfPagesRef.current = new Map();
    layoutDimsRef.current = { width: scroll.clientWidth, height: scroll.clientHeight };
    const { width, height } = layoutDimsRef.current;
    const dpr = window.devicePixelRatio || 1;

    container.innerHTML = '';
    pageOffsetsRef.current = [];
    pageHeightsRef.current = [];

    let offset = TOP_PAD;
    for (let n = 1; n <= pdf.numPages; n += 1) {
      const pdfPage = await pdf.getPage(n);
      if (buildId !== buildIdRef.current) return;
      pdfPagesRef.current.set(n, pdfPage);
      const base = pdfPage.getViewport({ scale: 1 });
      const fitScale = Math.max(height / base.height, width / base.width);
      const viewport = pdfPage.getViewport({ scale: fitScale * zoomRef.current });

      const wrapper = document.createElement('div');
      wrapper.className = 'shrink-0';
      wrapper.style.width = `${Math.floor(viewport.width)}px`;
      wrapper.style.height = `${Math.floor(viewport.height)}px`;
      wrapper.style.marginBottom = `${PAGE_GAP}px`;
      container.appendChild(wrapper);

      pageOffsetsRef.current.push(offset);
      pageHeightsRef.current.push(viewport.height + PAGE_GAP);
      offset += viewport.height + PAGE_GAP;
    }

    if (buildId !== buildIdRef.current) return;
    onPageInfoRef.current?.({ current: 1, total: pdf.numPages });
    void renderVisiblePages();
  }, [renderVisiblePages]);

  useEffect(() => {
    if (status !== 'ready') return;
    void renderPages();
  }, [status, zoom, renderPages]);

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll || status !== 'ready') return;

    const observer = new ResizeObserver(() => void renderPages());
    observer.observe(scroll);
    return () => observer.disconnect();
  }, [status, renderPages]);

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;

    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();

      const step =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? event.deltaY * 16
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? event.deltaY * 100
            : event.deltaY;

      wheelAccumulatorRef.current += step;

      while (Math.abs(wheelAccumulatorRef.current) >= ZOOM_WHEEL_ACCUM) {
        onZoomChangeRef.current?.(-Math.sign(wheelAccumulatorRef.current));
        wheelAccumulatorRef.current -= Math.sign(wheelAccumulatorRef.current) * ZOOM_WHEEL_ACCUM;
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        updatePageInfo();
        renderVisiblePages();
      });
    };

    scroll.addEventListener('wheel', onWheel, { passive: false });
    scroll.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      scroll.removeEventListener('wheel', onWheel);
      scroll.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [renderVisiblePages, updatePageInfo]);

  useEffect(() => {
    return () => {
      pdfRef.current = null;
      cancelAllPageTasks();
      loadingTaskRef.current?.destroy().catch(() => undefined);
    };
  }, []);

  return (
    <div ref={scrollRef} className="h-full w-full overflow-auto bg-black">
      {status === 'error' ? (
        <div className="grid overflow-y-scroll place-items-center px-6">
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