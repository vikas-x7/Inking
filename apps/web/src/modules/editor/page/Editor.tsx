import EditorPane from '@/src/modules/editor/components/EditorPane';
import PreviewPane from '@/src/modules/editor/components/PreviewPane';
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';

function Editor() {
  return (
    <div className="relative flex min-h-screen bg-[#111827] font-sans text-white">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        <EditorPane />
        <PreviewPane />
      </div>

      <div className="absolute left-1/2 top-[45%] z-20 hidden -translate-x-1/2 overflow-hidden rounded-full border border-white/10 bg-[#121821] shadow-lg lg:block">
        <button className="grid h-8 w-8 place-items-center border-b border-white/10 text-white">
          <FiArrowRight size={20} />
        </button>
        <button className="grid h-8 w-8 place-items-center text-white">
          <FiArrowLeft size={20} />
        </button>
      </div>
    </div>
  );
}

export default Editor;
