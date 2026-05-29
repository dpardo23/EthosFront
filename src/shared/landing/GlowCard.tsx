import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

type GlowOrigin = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

const GLOW_POSITIONS: Record<GlowOrigin, string> = {
  'top-left':     '0% 0%',
  'top-right':    '100% 0%',
  'bottom-left':  '0% 100%',
  'bottom-right': '100% 100%',
  center:         '50% 50%',
};

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowOrigin?: GlowOrigin;
  intensity?: number;
}

export function GlowCard({ children, className, glowOrigin = 'top-left', intensity = 0.08 }: GlowCardProps) {
  const pos = GLOW_POSITIONS[glowOrigin];
  return (
    <div className={cn('relative overflow-hidden rounded-3xl border border-white/[0.06] bg-[#040408]', className)}>
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl"
        style={{ background: `radial-gradient(ellipse at ${pos}, rgba(124,58,237,${intensity}) 0%, transparent 60%)` }}
      />
      <div className="relative flex flex-1 flex-col">{children}</div>
    </div>
  );
}
