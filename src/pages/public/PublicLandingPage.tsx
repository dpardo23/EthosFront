import {
  HeroSection,
  SocialProofSection,
  ShowcaseSection,
  IdentitySection,
  DiscoverySection,
  CTASection,
} from './landing';

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
