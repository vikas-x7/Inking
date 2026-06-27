'use client';
import type { UseFormRegister } from 'react-hook-form';
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
import type { EditorFormValues } from '../page/Editor';

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
  register: UseFormRegister<EditorFormValues>;
  content: string;
  onSubmit: () => void;
  isDirty: boolean;
  isSaving: boolean;
  isLoading: boolean;
  isError: boolean;
}

export default function EditorPane({
  register,
  content,
  onSubmit,
  isDirty,
  isSaving,
  isLoading,
  isError,
}: EditorPaneProps) {
  const lineCount = content ? content.split('\n').length : 1;
  const lineNumbers = Array.from({ length: lineCount }, (_, index) => index + 1);

  return (
    <section className="flex h-full w-full flex-col  bg-white lg:w-1/2 border-r-3 border-black">
      <div className="flex py-[7px] items-center justify-between  bg-[#151515] px-3 text-[#ffffff]">
        <div className="flex items-center gap-3">
          <input
            {...register('title')}
            className="min-w-0 flex-1 bg-transparent text-[20px] text-white outline-none placeholder:text-white/40"
            placeholder="Untitled"
          />
          {isDirty && (
            <button
              onClick={onSubmit}
              disabled={isSaving}
              className="rounded-[3px] bg-[#7C6BA6] px-3 py-1 text-sm font-medium text-white transition hover:bg-[#655493] disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
            {toolbarButtons.map((Icon, index) => (
              <button
                key={index}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-[3px] text-[#eeeeee] transition hover:bg-black/10"
              >
                <Icon size={17} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center bg-white">
          <p className="text-sm text-gray-400">Loading document...</p>
        </div>
      ) : isError ? (
        <div className="flex flex-1 items-center justify-center bg-white">
          <p className="text-sm text-red-500">Failed to load document.</p>
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-[64px_minmax(0,1fr)] overflow-hidden bg-white font-sans text-[15px] leading-6 text-black">
          <div className="select-none border-r border-[#e5e5e5] bg-[#f3f3f3] py-1 text-right text-[#374151]">
            {lineNumbers.map((line) => (
              <div key={line} className="h-6 pr-3">
                {line}
              </div>
            ))}
          </div>
          <textarea
            {...register('content')}
            className="min-w-0 h-full resize-none bg-white px-3 py-1 font-sans text-[15px] leading-6 text-black outline-none"
            spellCheck={false}
          />
        </div>
      )}
    </section>
  );
}
