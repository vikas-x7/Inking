import FeatureGrid from '@/src/modules/landing/components/FeatureGrid';
import Hero from '@/src/modules/landing/components/Hero';
import Navbar from '@/src/modules/landing/components/Navbar';
import Footer from '../components/Footer';
import Faq from '../components/Faq';
import CtaSection from '../components/CtaSection';

function Landing() {
  return (
    <section className="bg-[#000000] min-h-screen">
      <Navbar />
      <Hero />
      <FeatureGrid />
      <Faq />
      <CtaSection />
      <Footer />
    </section>
  );
}

export default Landing;
