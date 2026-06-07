import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

/**
 * Inline text component that applies a purple-to-violet gradient fill, used for landing page headlines.
 */
interface GradientTextProps {
  children: ReactNode;
  className?: string;
}

export function GradientText({ children, className }: GradientTextProps) {
  return <span className={cn('gradient-text-animated', className)}>{children}</span>;
}
