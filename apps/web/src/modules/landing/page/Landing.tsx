import Hero from '@/src/modules/landing/components/Hero';
import Navbar from '@/src/modules/landing/components/Navbar';
import Features from '@/src/modules/landing/components/Features';
import FeatureShowcase from '@/src/modules/landing/components/FeatureShowcase';
import Footer from '../components/Footer';
import Faq from '../components/Faq';
import CtaSection from '../components/CtaSection';
import QuerySection from '../components/QuerySection';

function Landing() {
  return (
    <section className="bg-[#000000]">
      <Navbar />
      <Hero />
      <Features />
       <QuerySection />
      <FeatureShowcase />
      <Faq />
      <CtaSection />
      <Footer />
    </section>
  );
}

export default Landing;

