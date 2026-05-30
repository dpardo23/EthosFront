import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import { EthosLogoIcon } from '@/components/brand/EthosCoreLogo';

// ─── Auth Hero ────────────────────────────────────────────────────────
export function AuthHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6 flex items-center gap-3 lg:hidden"
      >
        <EthosLogoIcon size={32} />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05 }}
        className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-violet-400"
      >
        {eyebrow}
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="text-[clamp(1.65rem,4vw,2.25rem)] font-black tracking-tight text-white"
      >
        {title}
      </motion.h1>

      {description && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="mt-2 text-sm leading-6 text-white/45"
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}

// ─── Social Auth Buttons ──────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0">
      <path fill="#4285F4" d="M21.6 12.23c0-.68-.06-1.33-.18-1.95H12v3.69h5.39a4.62 4.62 0 0 1-2 3.04v2.52h3.24c1.9-1.75 2.97-4.32 2.97-7.3Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.47l-3.24-2.52c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.12H3.05v2.6A9.99 9.99 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.4 13.85A5.98 5.98 0 0 1 6.09 12c0-.64.11-1.26.31-1.85v-2.6H3.05A9.98 9.98 0 0 0 2 12c0 1.61.39 3.13 1.05 4.45l3.35-2.6Z" />
      <path fill="#EA4335" d="M12 6.03c1.47 0 2.78.5 3.81 1.5l2.85-2.85C16.96 3.1 14.7 2 12 2A9.99 9.99 0 0 0 3.05 7.55l3.35 2.6C7.19 7.79 9.4 6.03 12 6.03Z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0 fill-current">
      <path d="M12 .5a12 12 0 0 0-3.8 23.39c.6.1.82-.26.82-.58v-2.23c-3.34.73-4.04-1.61-4.04-1.61-.55-1.38-1.33-1.75-1.33-1.75-1.08-.74.08-.72.08-.72 1.2.08 1.84 1.22 1.84 1.22 1.06 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.66-.3-5.47-1.33-5.47-5.9 0-1.3.47-2.36 1.22-3.2-.12-.3-.53-1.52.12-3.17 0 0 1-.32 3.3 1.22a11.5 11.5 0 0 1 6 0c2.3-1.54 3.3-1.22 3.3-1.22.65 1.65.24 2.87.12 3.17.76.84 1.22 1.9 1.22 3.2 0 4.58-2.82 5.6-5.5 5.9.43.37.82 1.1.82 2.23v3.3c0 .32.21.69.83.58A12 12 0 0 0 12 .5Z" />
    </svg>
  );
}

export function SocialAuthButton({
  provider,
  label,
  onClick,
  disabled,
  loading,
}: {
  provider: 'google' | 'github';
  label: string;
  onClick?: (provider: 'google' | 'github') => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const Icon = provider === 'google' ? GoogleIcon : GitHubIcon;

  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={() => onClick?.(provider)}
      disabled={disabled || loading}
      whileHover={{ scale: (disabled || loading) ? 1 : 1.015 }}
      whileTap={{ scale: 0.985 }}
      className={cn(
        'inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50',
        provider === 'google'
          ? 'border-white/10 bg-white/5 text-white/80 hover:border-white/18 hover:bg-white/8 hover:text-white'
          : 'border-white/12 bg-white/6 text-white/80 hover:border-white/22 hover:bg-white/10 hover:text-white'
      )}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : (
        <Icon />
      )}
      <span>{label}</span>
    </motion.button>
  );
}

export function SocialAuthGroup({
  googleLabel,
  githubLabel,
  onProviderClick,
  disabled,
  loadingProvider,
}: {
  googleLabel: string;
  githubLabel: string;
  onProviderClick?: (provider: 'google' | 'github') => void;
  disabled?: boolean;
  loadingProvider?: 'google' | 'github' | null;
}) {
  const anyLoading = loadingProvider != null;
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      <SocialAuthButton
        provider="google"
        label={googleLabel}
        onClick={onProviderClick}
        disabled={disabled || (anyLoading && loadingProvider !== 'google')}
        loading={loadingProvider === 'google'}
      />
      <SocialAuthButton
        provider="github"
        label={githubLabel}
        onClick={onProviderClick}
        disabled={disabled || (anyLoading && loadingProvider !== 'github')}
        loading={loadingProvider === 'github'}
      />
    </div>
  );
}

// ─── Auth Footer Link ─────────────────────────────────────────────────
export function AuthFooterLink({
  prompt,
  cta,
  to,
}: {
  prompt: string;
  cta: string;
  to: string;
}) {
  return (
    <p className="text-center text-sm text-white/35">
      {prompt}{' '}
      <Link
        to={to}
        className="inline-flex items-center gap-1 font-semibold text-violet-400 transition-colors hover:text-violet-300 focus-visible:outline-none"
      >
        {cta}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </p>
  );
}

// ─── Auth Divider ─────────────────────────────────────────────────────
export function AuthDivider({ label = 'O continúa con' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-white/8" />
      <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/30">{label}</span>
      <div className="h-px flex-1 bg-white/8" />
    </div>
  );
}
