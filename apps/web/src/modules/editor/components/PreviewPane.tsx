'use client';
import { useState } from 'react';
import { FiChevronDown, FiChevronRight, FiMinus, FiPlus } from 'react-icons/fi';
import type { CompileErrorInfo } from '@/src/modules/compile/api';
import PdfViewer, { type PdfPageInfo } from './PdfViewer';

interface PreviewPaneProps {
  zoom: number;
  onZoomChange: (delta: number) => void;
  onPageInfo: (info: PdfPageInfo) => void;
  pageInfo: PdfPageInfo;
  pdfUrl: string | null;
  compileError: CompileErrorInfo | null;
}

const formatErrorLocation = (error: CompileErrorInfo): string | null => {
  const parts: string[] = [];
  if (error.file) parts.push(error.file);
  if (error.line != null) {
    parts.push(`Line ${error.line}`);
    if (error.column != null) parts.push(`Column ${error.column}`);
  } else if (error.column != null) {
    parts.push(`Column ${error.column}`);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
};

export default function PreviewPane({
  zoom,
  onZoomChange,
  onPageInfo,
  pageInfo,
  pdfUrl,
  compileError,
}: PreviewPaneProps) {
  const [showFullLog, setShowFullLog] = useState(false);
  const errorLocation = compileError ? formatErrorLocation(compileError) : null;
  const hasFullLog = Boolean(compileError?.raw && compileError.raw !== compileError.message);

  return (
    <section className="flex h-full w-full min-w-0 flex-col bg-black">
      <div className="h-full flex-1 bg-[#1E1E1E] overflow-hidden relative">
        {pdfUrl && !compileError ? (
          <>
            <PdfViewer
              pdfUrl={pdfUrl}
              zoom={zoom}
              onZoomChange={onZoomChange}
              onPageInfo={onPageInfo}
            />
            <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/10 bg-[#252526]/95  text-xs text-slate-200 shadow-lg select-none">
              <span className="w-16 text-center font-mono  text-slate-300 text-[16px]">
                {pageInfo.current}/{pageInfo.total}
              </span>
              <span className="h-3 w-px " />
              <button
                onClick={() => onZoomChange(-1)}
                disabled={zoom <= 0.5}
                className="text-slate-300 hover:text-white disabled:opacity-30 transition cursor-pointer"
                aria-label="Zoom out"
              >
                <FiMinus size={20} />
              </button>
              <span className="w-12 text-center font-mono text-[16px]">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => onZoomChange(1)}
                disabled={zoom >= 3}
                className="text-slate-300 hover:text-white disabled:opacity-30 transition cursor-pointer "
                aria-label="Zoom in"
              >
                <FiPlus size={20} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex h-full w-full flex-col overflow-hidden bg-[#1E1E1E]">
            {compileError ? (
              <>
                <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#252526] px-4 py-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-red-400">
                    Compilation failed
                  </span>
                  {hasFullLog ? (
                    <button
                      onClick={() => setShowFullLog((v) => !v)}
                      className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-300 transition hover:bg-white/5 hover:text-white cursor-pointer"
                    >
                      {showFullLog ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                      Full log
                    </button>
                  ) : null}
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
                  <p className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-red-400">
                    {compileError.message}
                  </p>
                  {errorLocation ? (
                    <p className="mt-2 font-mono text-xs text-slate-400">{errorLocation}</p>
                  ) : null}
                  {showFullLog && compileError.raw ? (
                    <pre className="mt-3 whitespace-pre-wrap border-t border-white/10 pt-3 font-mono text-[13px] leading-relaxed text-slate-300/80">
                      {compileError.raw}
                    </pre>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-slate-300">
                <p className="text-sm text-white/50">
                  Click Compile in the top bar to preview your document.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}