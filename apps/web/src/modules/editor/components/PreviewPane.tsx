'use client';
import { FiDownload, FiMinus, FiPlus } from 'react-icons/fi';

interface PreviewPaneProps {
  content: string;
  onCompile: () => void;
  isCompiling: boolean;
  pdfUrl: string | null;
  compileError: string | null;
}

export default function PreviewPane({
  content,
  onCompile,
  isCompiling,
  pdfUrl,
  compileError,
}: PreviewPaneProps) {
  const handleDownload = () => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'document.pdf';
    link.click();
  };

  return (
    <section className="flex h-full w-full flex-col bg-black lg:w-1/2">
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
              <span>1</span>
              <span>/ 1</span>
            </div>

            <button className="grid h-8 w-8 place-items-center">
              <FiMinus size={18} />
            </button>
            <button className="grid h-8 w-8 place-items-center">
              <FiPlus size={18} />
            </button>
            <span>91%</span>
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
      <div className="flex-1 overflow-auto bg-black ">
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            title="Compiled document"
            className="mx-auto h-full w-full max-w-[920px] bg-white"
          />
        ) : (
          <div className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-[920px] flex-col items-center justify-center bg-white  text-black shadow-2xl">
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
