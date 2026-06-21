import {
  FiBold,
  FiChevronDown,
  FiFileText,
  FiImage,
  FiItalic,
  FiLink,
  FiList,
  FiPlusSquare,
  FiRotateCcw,
  FiRotateCw,
  FiSearch,
  FiTag,
  FiType,
  FiUpload,
} from 'react-icons/fi';
import { IoMdClose } from 'react-icons/io';
import { TbMathFunction } from 'react-icons/tb';

const initialDocument = `\\documentclass{article}
\\usepackage{graphicx} % Required for inserting images

\\title{text}
\\author{Vikas Pal}
\\date{August 2026}

\\begin{document}

\\maketitle

\\section{Introduction}

\\end{document}`;

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

export default function EditorPane() {
  const lineNumbers = Array.from({ length: 15 }, (_, index) => index + 1);

  return (
    <section className="flex min-h-[640px] w-full flex-col border-r border-[#1f2937] bg-white lg:w-1/2">
      <header className="flex h-[42px] items-center justify-between bg-[#2f3b4d] pr-3 text-white">
        <div className="flex h-full items-center bg-[#243044] px-3">
          <FiFileText size={16} />
          <span className="ml-2 text-sm font-semibold">main.tex</span>
          <IoMdClose className="ml-2 text-white/60" size={18} />
        </div>
        <div className="hidden items-center gap-2 text-xs text-white/60 sm:flex">
          <span>Saved</span>
          <span className="h-2 w-2 rounded-full bg-white" />
        </div>
      </header>

      <div className="flex h-10 items-center justify-between border-b border-[#d7d7d7] bg-[#f7f7f7] px-3 text-[#2f3b4d]">
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
          {toolbarButtons.map((Icon, index) => (
            <button key={index} className="grid h-7 w-7 shrink-0 place-items-center rounded-[3px] text-[#263244] transition hover:bg-black/10">
              <Icon size={17} />
            </button>
          ))}
        </div>
        <div className="ml-3 flex shrink-0 items-center gap-2">
          <div className="flex rounded-full bg-[#2f3b4d] p-0.5 text-sm font-semibold">
            <button className="rounded-full bg-[#0aa15a] px-4 py-1 text-white">Code</button>
            <button className="rounded-full px-4 py-1 text-white/85">Visual</button>
          </div>
          <button className="grid h-8 w-11 place-items-center rounded-[5px] bg-[#2f3b4d] text-white">
            <FiSearch size={18} />
          </button>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-[64px_minmax(0,1fr)] overflow-hidden bg-white font-mono text-[15px] leading-6 text-black">
        <div className="select-none border-r border-[#e5e5e5] bg-[#f3f3f3] py-1 text-right text-[#374151]">
          {lineNumbers.map((line) => (
            <div key={line} className="h-6 pr-3">
              {line}
            </div>
          ))}
        </div>
        <textarea
          className="min-w-0 flex-1 resize-none bg-white px-3 py-1 font-mono text-[15px] leading-6 text-black outline-none"
          defaultValue={initialDocument}
          spellCheck={false}
        />
      </div>
    </section>
  );
}
