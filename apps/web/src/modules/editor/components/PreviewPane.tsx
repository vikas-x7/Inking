import {
  FiChevronDown,
  FiChevronUp,
  FiDownload,
  FiFileText,
  FiMinus,
  FiPlus,
} from 'react-icons/fi';
import { IoWaterOutline } from 'react-icons/io5';

export default function PreviewPane() {
  return (
    <section className="flex h-full w-full flex-col bg-black lg:w-1/2">
      <header className="flex py-1.5 items-center justify-between bg-[#151515]  px-1 text-white">
        <div className="flex  justify-between w-full">
          <button className="flex items-center rounded-[5px] text-[14px] border border-white/50 px-5  text-white">
            Compile
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
              <button className="grid h-8 w-8 place-items-center text-white">
                <FiDownload size={19} />
              </button>
            </div>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-auto bg-black ">
        <div className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-[920px] items-center justify-center bg-white  text-black shadow-2xl">
          <article className="min-h-[720px] w-full max-w-[560px] font-serif"></article>
        </div>
      </div>
    </section>
  );
}
