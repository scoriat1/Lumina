import { AudienceSection, CTASection, FeatureSection, Hero, PricingSection } from '../components/landing/LandingSections';
import { Seo } from '../components/landing/Seo';

export function LandingPage() {
  return (
    <>
      <Seo
        title="Lumina | Practice management for client sessions"
        description="Lumina brings client profiles, scheduling, session notes, billing, and packages into one calm practice management system."
        path="/"
      />
      <Hero />
      <FeatureSection />
      <AudienceSection />
      <PricingSection compact />
      <CTASection />
    </>
  );
}
