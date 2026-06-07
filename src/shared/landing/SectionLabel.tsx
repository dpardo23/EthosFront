import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

/**
 * Small uppercase label chip displayed above section headings on the landing page.
 */
interface SectionLabelProps {
  children: ReactNode;
  className?: string;
}

export function SectionLabel({ children, className }: SectionLabelProps) {
  return (
    <p className={cn('text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-400', className)}>
      {children}
    </p>
  );
}
