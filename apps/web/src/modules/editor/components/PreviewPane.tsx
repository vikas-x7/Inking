'use client';
import PdfViewer, { type PdfPageInfo } from './PdfViewer';

interface PreviewPaneProps {
  zoom: number;
  onZoomChange: (delta: number) => void;
  onPageInfo: (info: PdfPageInfo) => void;
  pdfUrl: string | null;
  compileError: string | null;
}

export default function PreviewPane({
  zoom,
  onZoomChange,
  onPageInfo,
  pdfUrl,
  compileError,
}: PreviewPaneProps) {
  return (
    <section className="flex h-full w-full flex-col lg:w-1/2 bg-black">
      <div className="h-full flex-1 bg-[#1E1E1E] overflow-hidden">
        {pdfUrl && !compileError ? (
          <PdfViewer
            pdfUrl={pdfUrl}
            zoom={zoom}
            onZoomChange={onZoomChange}
            onPageInfo={onPageInfo}
          />
        ) : (
          <div className="mx-auto flex w-full h-full flex-col items-center justify-center bg-[#1E1E1E] text-slate-300">
            {compileError ? (
              <p className="max-w-md px-6 text-center text-sm text-red-400">{compileError}</p>
            ) : (
              <p className="text-sm text-slate-400">Click Compile in the top bar to preview your document.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
