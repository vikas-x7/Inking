import { Suspense } from 'react';
import Editor from '@/src/modules/editor/page/Editor';

export default function EditorPage() {
  return (
    <section>
      <Suspense fallback={<div className="bg-[#111827] h-screen" />}>
        <Editor />
      </Suspense>
    </section>
  );
}
