import {
  HeroSection,
  SocialProofSection,
  ShowcaseSection,
  IdentitySection,
  DiscoverySection,
  CTASection,
} from './landing';

/**
 * Marketing landing page composed from landing section components for unauthenticated visitors.
 */
export default function PublicLandingPage() {
  return (
    <div className="overflow-x-hidden bg-black">
      <HeroSection />
      <SocialProofSection />
      <ShowcaseSection />
      <IdentitySection />
      <DiscoverySection />
      <CTASection />
    </div>
  );
}
