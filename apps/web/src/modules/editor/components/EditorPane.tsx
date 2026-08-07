'use client';
import { TbMathFunction } from 'react-icons/tb';
import {
  FiBold,
  FiChevronDown,
  FiImage,
  FiItalic,
  FiLink,
  FiList,
  FiPlusSquare,
  FiRotateCcw,
  FiRotateCw,
  FiTag,
  FiType,
  FiUpload,
} from 'react-icons/fi';
import CodeEditor from './CodeEditor';

const toolbarButtons = [
  FiRotateCcw,
  FiRotateCw,
  FiType,
  FiChevronDown,
  FiBold,
  FiItalic,
  TbMathFunction,
  FiLink,
  FiPlusSquare,
  FiTag,
  FiUpload,
  FiImage,
  FiList,
];

interface EditorPaneProps {
  content: string;
  onContentChange: (value: string) => void;
  isLoading: boolean;
  isError: boolean;
}

export default function EditorPane({
  content,
  onContentChange,
  isLoading,
  isError,
}: EditorPaneProps) {
  return (
    <section className="flex h-full w-full flex-col bg-[#1E1E1E] lg:w-1/2 border-r border-white/5">
      {/* ── Format Toolbar Bar ── */}
     

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center bg-[#1E1E1E]">
          <p className="text-sm text-slate-400">Loading document...</p>
        </div>
      ) : isError ? (
        <div className="flex flex-1 items-center justify-center bg-[#1E1E1E]">
          <p className="text-sm text-red-400">Failed to load document.</p>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-hidden">
          <CodeEditor value={content} onChange={onContentChange} />
        </div>
      )}
    </section>
  );
}
