import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

/**
 * Base card container component providing consistent padding, border, and shadow styles.
 */
interface CardBaseProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className, ...props }: CardBaseProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-xl border border-border bg-card p-6 shadow-sm transition-colors hover:border-border/80', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardBaseProps) {
  return <div className={cn('mb-4', className)}>{children}</div>;
}

export function CardTitle({ children, className }: CardBaseProps) {
  return <h3 className={cn('text-lg font-semibold text-card-foreground', className)}>{children}</h3>;
}

export function CardDescription({ children, className }: CardBaseProps) {
  return <p className={cn('text-sm text-muted-foreground', className)}>{children}</p>;
}

export function CardContent({ children, className }: CardBaseProps) {
  return <div className={cn('', className)}>{children}</div>;
}
