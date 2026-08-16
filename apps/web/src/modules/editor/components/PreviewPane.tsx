'use client';
import { FiMinus, FiPlus } from 'react-icons/fi';
import PdfViewer, { type PdfPageInfo } from './PdfViewer';

interface PreviewPaneProps {
  zoom: number;
  onZoomChange: (delta: number) => void;
  onPageInfo: (info: PdfPageInfo) => void;
  pageInfo: PdfPageInfo;
  pdfUrl: string | null;
  compileError: string | null;
}

export default function PreviewPane({
  zoom,
  onZoomChange,
  onPageInfo,
  pageInfo,
  pdfUrl,
  compileError,
}: PreviewPaneProps) {
  return (
    <section className="flex h-full w-full min-w-0 flex-col lg:w-[calc(100%-var(--editor-w))] bg-black">
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
              <span className="font-mono  text-slate-300 text-[16px]">
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
              <span className="font-mono text-[16px]">{Math.round(zoom * 100)}%</span>
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
          <div className="mx-auto flex w-full h-full flex-col items-center justify-center bg-[#1E1E1E] text-slate-300">
            {compileError ? (
              <p className="max-w-md px-6 text-center text-sm text-red-400">{compileError}</p>
            ) : (
              <p className="text-sm text-white/50">Click Compile in the top bar to preview your document.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
