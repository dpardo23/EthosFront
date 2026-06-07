import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';

/**
 * Animated pulsing dot indicator used in the landing hero to signal live/active state.
 */
interface PulseDotProps {
  size?: 'sm' | 'md';
  className?: string;
  animate?: boolean;
}

const SIZES = { sm: 'h-1.5 w-1.5', md: 'h-2 w-2' };

export function PulseDot({ size = 'md', className, animate = true }: PulseDotProps) {
  const base = cn(
    'flex-shrink-0 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(168,85,247,0.9)]',
    SIZES[size],
    className,
  );

  if (!animate) return <div className={base} />;

  return (
    <motion.div
      animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
      className={base}
    />
  );
}
