import { cn } from '@/shared/lib/utils';

export function SectionDivider({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent',
        className,
      )}
    />
  );
}
