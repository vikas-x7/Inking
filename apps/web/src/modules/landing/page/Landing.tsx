import Hero from '@/src/modules/landing/components/Hero';
import Navbar from '@/src/modules/landing/components/Navbar';
import Features from '@/src/modules/landing/components/Features';
import Footer from '../components/Footer';
import Faq from '../components/Faq';
import CtaSection from '../components/CtaSection';

function Landing() {
  return (
    <section className="bg-[#000000]">
      <Navbar />
      <Hero />
      <Features />
      <Faq />
      <CtaSection />
      <Footer />
    </section>
  );
}

export default Landing;
