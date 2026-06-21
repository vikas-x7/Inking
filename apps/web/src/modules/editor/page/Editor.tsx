import EditorPane from '@/src/modules/editor/components/EditorPane';
import PreviewPane from '@/src/modules/editor/components/PreviewPane';

function Editor() {
  return (
    <div className="flex min-h-screen bg-white font-sans">
      <EditorPane />
      <PreviewPane />
    </div>
  );
}

export default Editor;
