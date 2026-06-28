'use client';
import { useState } from 'react';
import { FiDownload, FiMinus, FiPlus } from 'react-icons/fi';
import PdfViewer, { type PdfPageInfo } from './PdfViewer';

interface PreviewPaneProps {
  content: string;
  onCompile: () => void;
  isCompiling: boolean;
  pdfUrl: string | null;
  compileError: string | null;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

export default function PreviewPane({
  content,
  onCompile,
  isCompiling,
  pdfUrl,
  compileError,
}: PreviewPaneProps) {
  const [zoom, setZoom] = useState(1);
  const [pageInfo, setPageInfo] = useState<PdfPageInfo>({ current: 1, total: 1 });

  const changeZoom = (delta: number) =>
    setZoom((value) =>
      Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((value + delta) * 100) / 100)),
    );

  const zoomIn = () => changeZoom(ZOOM_STEP);
  const zoomOut = () => changeZoom(-ZOOM_STEP);

  const handleDownload = () => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'document.pdf';
    link.click();
  };

  return (
    <section className="flex h-full w-full flex-col lg:w-1/2">
      <header className="flex py-1.5 items-center justify-between bg-[#151515]  px-1 text-white">
        <div className="flex  justify-between w-full">
          <button
            onClick={onCompile}
            disabled={isCompiling || !content.trim()}
            className="flex items-center rounded-[5px] text-[14px] border border-white/50 px-5  text-white disabled:opacity-50"
          >
            {isCompiling ? 'Compiling...' : 'Compile'}
          </button>
          <div className="flex items-center gap-4 text-sm font-medium text-white">
            <div className="flex items-center gap-1 border border-white/60 px-4 rounded-[2px]">
              <span>{pageInfo.current}</span>
              <span>/ {pageInfo.total}</span>
            </div>

            <button
              onClick={zoomOut}
              disabled={zoom <= MIN_ZOOM}
              className="grid h-8 w-8 place-items-center disabled:opacity-40"
              aria-label="Zoom out"
            >
              <FiMinus size={18} />
            </button>
            <button
              onClick={zoomIn}
              disabled={zoom >= MAX_ZOOM}
              className="grid h-8 w-8 place-items-center disabled:opacity-40"
              aria-label="Zoom in"
            >
              <FiPlus size={18} />
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <div>
              <button
                onClick={handleDownload}
                disabled={!pdfUrl}
                className="grid h-8 w-8 place-items-center text-white disabled:opacity-40"
              >
                <FiDownload size={19} />
              </button>
            </div>
          </div>
        </div>
      </header>
      <div className="h-full flex-1 bg-black">
        {pdfUrl && !compileError ? (
          <PdfViewer
            pdfUrl={pdfUrl}
            zoom={zoom}
            onZoomChange={(delta) => changeZoom(delta * ZOOM_STEP)}
            onPageInfo={setPageInfo}
          />
        ) : (
          <div className="mx-auto flex  w-full h-full  flex-col items-center justify-center bg-white  text-black shadow-2xl">
            {compileError ? (
              <p className="max-w-md px-6 text-center text-sm text-red-600">{compileError}</p>
            ) : (
              <p className="text-sm text-gray-400">Click Compile to preview your LaTeX document.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
