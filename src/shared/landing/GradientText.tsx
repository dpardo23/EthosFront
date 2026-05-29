import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface GradientTextProps {
  children: ReactNode;
  className?: string;
}

export function GradientText({ children, className }: GradientTextProps) {
  return <span className={cn('gradient-text-animated', className)}>{children}</span>;
}
