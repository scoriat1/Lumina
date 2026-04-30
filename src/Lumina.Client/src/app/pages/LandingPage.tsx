import { AudienceSection, CTASection, FeatureSection, Hero, PricingSection, ProblemReliefSection, TrustSection } from '../components/landing/LandingSections';
import { Seo } from '../components/landing/Seo';

export function LandingPage() {
  return (
    <>
      <Seo
        title="Lumina | Practice management software for session-based practices"
        description="Lumina helps client-based practices organize clients, sessions, notes, scheduling, packages, and payments in one calm workspace."
        path="/"
      />
      <Hero />
      <ProblemReliefSection />
      <FeatureSection />
      <TrustSection />
      <AudienceSection />
      <CTASection />
      <PricingSection compact />
      <CTASection title="Run your practice with less scattered work" body="Start a simple workspace for clients, sessions, notes, packages, and payments." />
    </>
  );
}
