import { auth } from '@/auth';
import { Navbar } from '@/components/homepage/navbar';
import { HeroSection } from '@/components/homepage/hero-section';
import { FeaturesSection } from '@/components/homepage/features-section';
import { AISection } from '@/components/homepage/ai-section';
import { PricingSection } from '@/components/homepage/pricing-section';
import { BottomCTA } from '@/components/homepage/bottom-cta';
import { Footer } from '@/components/homepage/footer';
import { ScrollFadeIn } from '@/components/homepage/scroll-fade-in';

export default async function Home() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f0f0f5]">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <AISection />
      <PricingSection isLoggedIn={isLoggedIn} />
      <BottomCTA />
      <Footer />
      <ScrollFadeIn />
    </div>
  );
}
