import Editor from '@/src/modules/editor/page/Editor';

export default async function EditorPage({ params }: { params: Promise<{ documentUid: string }> }) {
  const { documentUid } = await params;

  return (
    <section>
      <Editor documentUid={documentUid} />
    </section>
  );
}
