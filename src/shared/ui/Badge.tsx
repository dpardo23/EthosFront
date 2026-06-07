import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

/**
 * Pill-shaped label component used to display status tags, role badges, and category chips.
 */
export interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';
  className?: string;
}

const VARIANTS: Record<NonNullable<BadgeProps['variant']>, string> = {
  default:     'bg-primary/15 text-primary border border-primary/20',
  secondary:   'bg-secondary text-secondary-foreground',
  success:     'bg-success/15 text-success border border-success/20',
  warning:     'bg-warning/15 text-warning border border-warning/20',
  destructive: 'bg-destructive/15 text-destructive border border-destructive/20',
  outline:     'border border-border bg-transparent text-foreground',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors', VARIANTS[variant], className)}>
      {children}
    </span>
  );
}
