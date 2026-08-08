import FeatureGrid from '@/src/modules/landing/components/FeatureGrid';
import Hero from '@/src/modules/landing/components/Hero';
import Navbar from '@/src/modules/landing/components/Navbar';
import PricingSection from '@/src/modules/landing/components/PricingSection';
import WhyInking from '@/src/modules/landing/components/WhyInking';
import Footer from '../components/Footer';
import Faq from '../components/Faq';
import CtaSection from '../components/CtaSection';
import EditorShowcase from '../components/EditorShowcase';

function Landing() {
  return (
    <section className="">
      <Navbar />
      <Hero />
      <WhyInking />  
      <Faq />
      <CtaSection />
      <Footer />
    </section>
  );
}

export default Landing;
