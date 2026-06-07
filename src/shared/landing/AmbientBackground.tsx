import { cn } from '@/shared/lib/utils';

/**
 * Full-bleed animated gradient background used on the landing page hero section.
 */
interface AmbientBackgroundProps {
  className?: string;
  variant?: 'hero' | 'section' | 'cta';
  showGrid?: boolean;
  showNoise?: boolean;
  showBottomFade?: boolean;
}

const INTENSITIES = {
  hero:    { primary: 0.15, secondary: 0.09, tertiary: 0.08 },
  section: { primary: 0.06, secondary: 0.04, tertiary: 0.03 },
  cta:     { primary: 0.16, secondary: 0.10, tertiary: 0.07 },
} as const;

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`;

export function AmbientBackground({
  className,
  variant = 'section',
  showGrid = true,
  showNoise = true,
  showBottomFade = false,
}: AmbientBackgroundProps) {
  const { primary, secondary, tertiary } = INTENSITIES[variant];

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      <div
        className="animate-blob absolute -left-40 -top-16 h-[700px] w-[700px] rounded-full"
        style={{ background: `radial-gradient(circle, rgba(124,58,237,${primary}) 0%, transparent 65%)` }}
      />
      <div
        className="animate-blob absolute -right-24 top-1/4 h-[580px] w-[580px] rounded-full"
        style={{ background: `radial-gradient(circle, rgba(168,85,247,${secondary}) 0%, transparent 65%)`, animationDelay: '-5s' }}
      />
      <div
        className="animate-blob absolute bottom-1/4 left-1/3 h-[480px] w-[480px] rounded-full"
        style={{ background: `radial-gradient(circle, rgba(139,92,246,${tertiary}) 0%, transparent 65%)`, animationDelay: '-10s' }}
      />

      {showGrid && (
        <div
          className="absolute inset-0 opacity-[0.013]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />
      )}

      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 70%)' }}
      />

      {showNoise && (
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: NOISE_SVG, backgroundSize: '200px 200px' }}
        />
      )}

      {showBottomFade && (
        <div
          className="absolute inset-x-0 bottom-0 h-40"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.7))' }}
        />
      )}
    </div>
  );
}
