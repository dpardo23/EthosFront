import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import { useUiStore } from '@/store';

/**
 * EthosHub brand logo component used in the navbar, auth pages, and landing header.
 */
type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface EthosCoreLogoProps {
  size?: LogoSize;
  showText?: boolean;
  className?: string;
  animate?: boolean;
}

const sizeConfig: Record<LogoSize, { icon: number; text: string; gap: string }> = {
  xs: { icon: 20, text: 'text-sm',  gap: 'gap-1.5' },
  sm: { icon: 26, text: 'text-base', gap: 'gap-2' },
  md: { icon: 34, text: 'text-lg',  gap: 'gap-2.5' },
  lg: { icon: 44, text: 'text-2xl', gap: 'gap-3' },
  xl: { icon: 68, text: 'text-4xl', gap: 'gap-4' },
};

function OwlSVG({ size }: { size: number }) {
  const { resolvedTheme } = useUiStore();
  const isDark = resolvedTheme !== 'light';

  
  const hoodieGrad0         = isDark ? '#1A0530' : '#EEE5FF';
  const hoodieGrad1         = isDark ? '#0A0A14' : '#DDD5F8';
  const faceGrad0           = isDark ? '#13102A' : '#F5F0FF';
  const faceGrad1           = isDark ? '#0C0C1C' : '#EAE0FF';
  const headFill            = isDark ? '#0E0E1C' : '#F8F5FF';
  const headStrokeOpacity   = isDark ? '0.45' : '0.55';
  const eyeStroke           = isDark ? '#A855F7' : '#7C3AED';
  const hoodieStroke        = isDark ? '#A855F7' : '#7C3AED';
  const hoodieStrokeOpacity = isDark ? '0.55' : '0.7';
  const beakFill            = isDark ? '#C084FC' : '#9333EA';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="owlHoodieGrad" x1="40" y1="0" x2="40" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={hoodieGrad0} />
          <stop offset="100%" stopColor={hoodieGrad1} />
        </linearGradient>
        <radialGradient id="owlFaceGrad" cx="50%" cy="40%" r="55%">
          <stop offset="0%"   stopColor={faceGrad0} />
          <stop offset="100%" stopColor={faceGrad1} />
        </radialGradient>
        <radialGradient id="eyeHaloL" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#A855F7" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="eyeHaloR" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#A855F7" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
        </radialGradient>
        <filter id="eyeGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {}
      <path
        d="
          M40 84
          C22 84 11 73 11 61
          L9 48
          C9 34 17 22 28 18
          L20 4
          L34 16
          C36 15 38 14 40 14
          C42 14 44 15 46 16
          L60 4
          L52 18
          C63 22 71 34 71 48
          L69 61
          C69 73 58 84 40 84Z
        "
        fill="url(#owlHoodieGrad)"
        stroke={hoodieStroke}
        strokeWidth="1.1"
        strokeOpacity={hoodieStrokeOpacity}
        strokeLinejoin="round"
      />

      {}
      <circle
        cx="40"
        cy="44"
        r="23"
        fill={headFill}
        stroke="#7C3AED"
        strokeWidth="1"
        strokeOpacity={headStrokeOpacity}
        filter="url(#softGlow)"
      />

      {}
      <ellipse
        cx="40"
        cy="45"
        rx="16"
        ry="15"
        fill="url(#owlFaceGrad)"
      />

      {}
      <circle cx="31" cy="41" r="9"  fill="url(#eyeHaloL)" />
      <circle cx="49" cy="41" r="9"  fill="url(#eyeHaloR)" />

      {}
      <path
        d="M35 35 L27 41 L35 47"
        stroke={eyeStroke}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#eyeGlow)"
      />

      {}
      <path
        d="M45 35 L53 41 L45 47"
        stroke={eyeStroke}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#eyeGlow)"
      />

      {}
      <path
        d="M37.5 51 L40 56.5 L42.5 51 Z"
        fill={beakFill}
        opacity="0.88"
      />

      {}
      <path
        d="M27 73 Q40 69 53 73 L51 79 Q40 81 29 79 Z"
        fill="#A855F7"
        opacity="0.07"
        stroke="#A855F7"
        strokeWidth="0.8"
        strokeOpacity="0.22"
      />

      {}
      <path
        d="M37 63 Q35 69 34 75"
        stroke="#A855F7"
        strokeWidth="0.75"
        strokeLinecap="round"
        opacity="0.28"
      />
      <path
        d="M43 63 Q45 69 46 75"
        stroke="#A855F7"
        strokeWidth="0.75"
        strokeLinecap="round"
        opacity="0.28"
      />
    </svg>
  );
}

export function EthosCoreLogo({
  size = 'md',
  showText = true,
  className,
  animate = true,
}: EthosCoreLogoProps) {
  const cfg = sizeConfig[size];

  const icon = animate ? (
    <motion.div
      className="relative flex-shrink-0"
      whileHover={{
        scale: 1.06,
        filter: 'drop-shadow(0 0 14px rgba(168, 85, 247, 0.55))',
      }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
    >
      <OwlSVG size={cfg.icon} />
    </motion.div>
  ) : (
    <div className="relative flex-shrink-0">
      <OwlSVG size={cfg.icon} />
    </div>
  );

  return (
    <div className={cn('flex items-center', cfg.gap, className)}>
      {icon}
      {showText && (
        <span className={cn('font-sora tracking-tight', cfg.text)}>
          <span className="font-bold text-foreground dark:text-white">Ethos</span>
          <span className="font-light text-violet-600 dark:text-violet-400">Hub</span>
        </span>
      )}
    </div>
  );
}

export function EthosLogoIcon({
  size = 32,
  className,
  animate = true,
}: {
  size?: number;
  className?: string;
  animate?: boolean;
}) {
  if (animate) {
    return (
      <motion.div
        className={className}
        whileHover={{
          scale: 1.06,
          filter: 'drop-shadow(0 0 12px rgba(168, 85, 247, 0.5))',
        }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      >
        <OwlSVG size={size} />
      </motion.div>
    );
  }
  return <OwlSVG size={size} />;
}

export function EthosOwlMascot({
  size = 120,
  className,
  floating = true,
}: {
  size?: number;
  className?: string;
  floating?: boolean;
}) {
  return (
    <motion.div
      className={cn('relative select-none', className)}
      animate={floating ? { y: [0, -14, 0] } : undefined}
      transition={floating ? { duration: 6, ease: 'easeInOut', repeat: Infinity } : undefined}
      style={{ filter: 'drop-shadow(0 0 32px rgba(168, 85, 247, 0.35))' }}
    >
      <OwlSVG size={size} />
    </motion.div>
  );
}
