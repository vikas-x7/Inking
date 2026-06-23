import EditorPane from '@/src/modules/editor/components/EditorPane';
import PreviewPane from '@/src/modules/editor/components/PreviewPane';
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';

function Editor() {
  return (
    <div className="relative flex h-screen overflow-hidden bg-[#111827] font-sans text-white">
      <div className="flex h-screen w-full flex-col lg:flex-row">
        <EditorPane />
        <PreviewPane />
      </div>
    </div>
  );
}

export default Editor;
