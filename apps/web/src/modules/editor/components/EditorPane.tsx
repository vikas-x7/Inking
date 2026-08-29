'use client';
import CodeEditor from './CodeEditor';

interface EditorPaneProps {
  content: string;
  onContentChange: (value: string) => void;
  isLoading: boolean;
  isError: boolean;
  errorLine: number | null;
}

export default function EditorPane({
  content,
  onContentChange,
  isLoading,
  isError,
  errorLine,
}: EditorPaneProps) {
  return (
<section className="flex h-full w-full min-w-0 flex-col bg-[#1E1E1E] border-r border-white/5">
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
          <CodeEditor value={content} onChange={onContentChange} errorLine={errorLine} />
        </div>
      )}
    </section>
  );
}
