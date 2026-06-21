import { FiDownload, FiRefreshCw } from 'react-icons/fi';

export default function PreviewPane() {
  return (
    <div className="flex w-1/2 flex-col bg-[#F4F4F4]">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <span className="text-sm font-medium text-black">PDF Preview</span>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-[3px] border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 hover:text-black">
            <FiRefreshCw size={14} />
            Refresh
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-[3px] bg-black px-3 py-1.5 text-xs font-medium text-white transition hover:bg-black/80">
            <FiDownload size={14} />
            Download
          </button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="flex h-full w-full max-w-md items-center justify-center rounded-[3px] border border-gray-200 bg-white shadow-sm">
          <p className="text-sm text-gray-400">PDF preview will render here</p>
        </div>
      </div>
    </div>
  );
}
