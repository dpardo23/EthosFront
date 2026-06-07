import { cn } from '../lib/utils';

/**
 * Reusable avatar component rendering a profile photo with fallback initials.
 */
const SIZES = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base', xl: 'h-16 w-16 text-lg', '2xl': 'h-24 w-24 text-2xl' };

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  fallback?: string;
  size?: keyof typeof SIZES;
  className?: string;
}

export function Avatar({ src, alt, name, fallback, size = 'md', className }: AvatarProps) {
  const text = (fallback ?? name ?? alt ?? '?').charAt(0).toUpperCase();
  return (
    <div className={cn('relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted', SIZES[size], className)}>
      {src
        ? <img src={src} alt={alt} className="h-full w-full object-cover" />
        : <span className="font-medium text-muted-foreground">{text}</span>
      }
    </div>
  );
}

export interface AvatarGroupProps {
  avatars: { src: string; name: string }[];
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarGroup({ avatars, max = 3, size = 'sm' }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;
  const countSize = size === 'sm' ? 'h-8 w-8' : size === 'md' ? 'h-10 w-10' : 'h-12 w-12';

  return (
    <div className="flex -space-x-2">
      {visible.map((avatar, i) => (
        <Avatar key={i} src={avatar.src} alt={avatar.name} size={size} className="border-2 border-background" />
      ))}
      {remaining > 0 && (
        <div className={cn('flex items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground', countSize)}>
          +{remaining}
        </div>
      )}
    </div>
  );
}
