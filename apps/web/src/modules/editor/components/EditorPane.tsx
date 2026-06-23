import { FiBold, FiChevronDown, FiFileText, FiImage, FiItalic, FiLink, FiList, FiPlusSquare, FiRotateCcw, FiRotateCw, FiSearch, FiTag, FiType, FiUpload } from 'react-icons/fi';
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

const toolbarButtons = [FiRotateCcw, FiRotateCw, FiType, FiChevronDown, FiBold, FiItalic, TbMathFunction, FiLink, FiPlusSquare, FiTag, FiUpload, FiImage, FiList];

export default function EditorPane() {
  const lineNumbers = Array.from({ length: 15 }, (_, index) => index + 1);

  return (
    <section className="flex h-full w-full flex-col  bg-white lg:w-1/2 border-r-3 border-black">
      <div className="flex py-1.5 items-center justify-between  bg-[#151515] px-3 text-[#ffffff]">
        <div>
          <h1 className="text-[20px]">Untitle</h1>
        </div>
        <div className="flex gap-2">
          <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
            {toolbarButtons.map((Icon, index) => (
              <button key={index} className="grid h-7 w-7 shrink-0 place-items-center rounded-[3px] text-[#eeeeee] transition hover:bg-black/10">
                <Icon size={17} />
              </button>
            ))}
          </div>

          <button className="inline-flex py-1 items-center gap-4 rounded-[3px] bg-[#808080]  px-5 text-base  text-black">Compile</button>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-[64px_minmax(0,1fr)] overflow-hidden bg-white font-sans text-[15px] leading-6 text-black">
        <div className="select-none border-r border-[#e5e5e5] bg-[#f3f3f3] py-1 text-right text-[#374151]">
          {lineNumbers.map((line) => (
            <div key={line} className="h-6 pr-3">
              {line}
            </div>
          ))}
        </div>
        <textarea className="min-w-0 h-full resize-none bg-white px-3 py-1 font-sans text-[15px] leading-6 text-black outline-none" defaultValue={initialDocument} spellCheck={false} />
      </div>
    </section>
  );
}
