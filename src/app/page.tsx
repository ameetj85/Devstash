import { Navbar } from '@/components/homepage/navbar';
import { HeroSection } from '@/components/homepage/hero-section';
import { FeaturesSection } from '@/components/homepage/features-section';
import { AISection } from '@/components/homepage/ai-section';
import { PricingSection } from '@/components/homepage/pricing-section';
import { BottomCTA } from '@/components/homepage/bottom-cta';
import { Footer } from '@/components/homepage/footer';
import { ScrollFadeIn } from '@/components/homepage/scroll-fade-in';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f0f0f5]">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <AISection />
      <PricingSection />
      <BottomCTA />
      <Footer />
      <ScrollFadeIn />
    </div>
  );
}
