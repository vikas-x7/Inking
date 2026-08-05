import Landing from '@/src/modules/landing/page/Landing';
import WorkspaceRedirect from '@/src/modules/landing/components/WorkspaceRedirect';

export default function Home() {
  return (
    <section>
      <WorkspaceRedirect />
      <Landing />
    </section>
  );
}
