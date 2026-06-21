import Features from '@/src/modules/landing/components/Features';
import Hero from '@/src/modules/landing/components/Hero';
import Navbar from '@/src/modules/landing/components/Navbar';
import Workflow from '@/src/modules/landing/components/Workflow';

function Landing() {
  return (
    <section>
      <Navbar />
      <Hero />
      <Features />
      <Workflow />
    </section>
  );
}

export default Landing;
