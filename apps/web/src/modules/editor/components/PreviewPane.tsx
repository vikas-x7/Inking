import { FiChevronDown, FiChevronUp, FiDownload, FiFileText, FiMinus, FiPlus } from 'react-icons/fi';
import { IoWaterOutline } from 'react-icons/io5';

export default function PreviewPane() {
  return (
    <section className="flex min-h-[640px] w-full flex-col bg-[#2f3b4d] lg:w-1/2">
      <header className="flex h-[42px] items-center justify-between bg-[#2f3b4d] px-3 text-white">
        <div className="flex items-center gap-3">
          <button className="inline-flex h-9 items-center gap-4 rounded-full bg-[#0aa15a] px-5 text-base font-bold text-white">
            Recompile
            <FiChevronDown size={18} />
          </button>
          <button className="grid h-8 w-8 place-items-center text-white">
            <FiFileText size={19} />
          </button>
          <button className="grid h-8 w-8 place-items-center text-white">
            <FiDownload size={19} />
          </button>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-white">
          <button className="hidden h-8 w-8 place-items-center sm:grid">
            <IoWaterOutline size={20} />
          </button>
          <button className="hidden h-8 w-8 place-items-center sm:grid">
            <FiChevronUp size={18} />
          </button>
          <button className="hidden h-8 w-8 place-items-center sm:grid">
            <FiChevronDown size={18} />
          </button>
          <div className="flex items-center gap-1">
            <span className="grid h-8 w-10 place-items-center rounded-[5px] border border-white/70">1</span>
            <span>/ 1</span>
          </div>
          <button className="grid h-8 w-8 place-items-center">
            <FiMinus size={18} />
          </button>
          <button className="grid h-8 w-8 place-items-center">
            <FiPlus size={18} />
          </button>
          <span>91%</span>
        </div>
      </header>

      <div className="flex-1 overflow-auto bg-[#2f3b4d] p-4 sm:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-[920px] items-center justify-center bg-white px-6 py-16 text-black shadow-2xl">
          <article className="min-h-[720px] w-full max-w-[560px] pt-44 font-serif">
            <div className="text-center">
              <h1 className="text-xl font-normal">text</h1>
              <p className="mt-5 text-lg">Vikas Pal</p>
              <p className="mt-5 text-lg">August 2026</p>
            </div>

            <div className="mt-11 flex items-baseline gap-7">
              <span className="text-2xl font-bold">1</span>
              <h2 className="text-2xl font-bold">Introduction</h2>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
