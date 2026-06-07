import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Globe, MapPin, Users,
  ExternalLink, ChevronRight, Briefcase, Building2,
  Star, Zap, Code2, Award,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Avatar } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

interface BasicProfile {
  id_auth: string;
  first_name: string;
  last_name: string;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  seniority: string | null;
  availability_status: string | null;
  website: string | null;
  skills: string | null;
  job_title: string | null;
  portfolio_slug: string | null;
  is_published: boolean | null;
}

interface CompanyProfile {
  id_auth: string;
  first_name: string;
  last_name: string;
  company_name: string | null;
  industry: string | null;
  company_size: string | null;
  company_description: string | null;
  company_website: string | null;
  avatar_url: string | null;
  location: string | null;
}

type ContactType = 'basic' | 'company';

interface Props {
  profileId: string;
  contactType: ContactType;
  onClose: () => void;
}

const AVAILABILITY_CONFIG: Record<string, { label: string; color: string; dot: string; glow: string }> = {
  'Disponible': {
    label: 'Disponible',
    color: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20',
    dot: 'bg-emerald-400',
    glow: 'shadow-emerald-500/30',
  },
  'Ocupado': {
    label: 'Ocupado',
    color: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20',
    dot: 'bg-amber-400',
    glow: 'shadow-amber-500/30',
  },
  'Incógnito': {
    label: 'Incógnito',
    color: 'bg-muted text-muted-foreground ring-1 ring-border/40',
    dot: 'bg-muted-foreground',
    glow: '',
  },
};

const SENIORITY_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  'Junior':    { label: 'Junior',      icon: <Star className="h-3 w-3" />,  color: 'text-sky-400 bg-sky-500/10 ring-sky-500/20' },
  'Mid':       { label: 'Mid Level',   icon: <Star className="h-3 w-3" />,  color: 'text-violet-400 bg-violet-500/10 ring-violet-500/20' },
  'Senior':    { label: 'Senior',      icon: <Zap className="h-3 w-3" />,   color: 'text-amber-400 bg-amber-500/10 ring-amber-500/20' },
  'Lead':      { label: 'Lead',        icon: <Award className="h-3 w-3" />, color: 'text-orange-400 bg-orange-500/10 ring-orange-500/20' },
  'Architect': { label: 'Arquitecto',  icon: <Award className="h-3 w-3" />, color: 'text-rose-400 bg-rose-500/10 ring-rose-500/20' },
};

export function ChatContactPanel({ profileId, contactType, onClose }: Props) {
  const [basicProfile, setBasicProfile] = useState<BasicProfile | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !profileId) return;
    setLoading(true);
    const fn = contactType === 'basic'
      ? 'get_basic_profile_for_chat'
      : 'get_company_profile_for_chat';
    supabase.rpc(fn, { p_profile_id: profileId }).then(({ data }) => {
      const row = (data as any[])?.[0] ?? null;
      if (contactType === 'basic') setBasicProfile(row);
      else setCompanyProfile(row);
      setLoading(false);
    });
  }, [profileId, contactType]);

  const profile = contactType === 'basic' ? basicProfile : companyProfile;
  const displayName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ')
    : '';

  const availCfg = contactType === 'basic' && basicProfile?.availability_status
    ? AVAILABILITY_CONFIG[basicProfile.availability_status]
    : null;

  const seniorityCfg = contactType === 'basic' && basicProfile?.seniority
    ? SENIORITY_CONFIG[basicProfile.seniority]
    : null;

  const skills = contactType === 'basic' && basicProfile?.skills
    ? basicProfile.skills.split(', ').filter(Boolean)
    : [];

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 320 }}
      className="flex h-full w-72 flex-col border-l border-border/60 bg-card overflow-hidden"
    >
      {/* ── Header ── */}
      <div className="relative flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-gradient-to-r from-violet-500/5 to-transparent px-4">
        <span className="text-sm font-bold text-foreground">Perfil</span>
        <motion.button
          whileHover={{ scale: 1.08, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 p-6 pt-8"
            >
              <div className="relative">
                <div className="h-20 w-20 animate-pulse rounded-full bg-muted" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/10 to-transparent animate-pulse" />
              </div>
              <div className="space-y-2 w-full flex flex-col items-center">
                <div className="h-4 w-36 animate-pulse rounded-full bg-muted" />
                <div className="h-3 w-24 animate-pulse rounded-full bg-muted/60" />
              </div>
              <div className="w-full space-y-2 mt-2">
                {[80, 60, 70, 50].map((w, i) => (
                  <div key={i} className={`h-3 animate-pulse rounded-full bg-muted/50`} style={{ width: `${w}%` }} />
                ))}
              </div>
            </motion.div>
          ) : profile ? (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* ── Hero section ── */}
              <div className="relative overflow-hidden">
                {/* Background gradient header */}
                <div className="absolute inset-0 bg-gradient-to-b from-violet-500/8 via-violet-500/3 to-transparent" />
                {/* Decorative orb */}
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.06, 0.1, 0.06] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-500"
                  style={{ filter: 'blur(24px)' }}
                />

                <div className="relative flex flex-col items-center gap-3 px-4 pt-8 pb-5">
                  {/* Avatar with ring */}
                  <div className="relative">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.05 }}
                      className="rounded-full p-0.5 bg-gradient-to-br from-violet-400 via-violet-500 to-violet-700 shadow-xl shadow-violet-500/25"
                    >
                      <div className="rounded-full p-0.5 bg-card">
                        <Avatar
                          src={profile.avatar_url ?? undefined}
                          alt={displayName}
                          fallback={displayName}
                          className="h-20 w-20 rounded-full"
                        />
                      </div>
                    </motion.div>
                    {/* Availability dot */}
                    {availCfg && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 400, delay: 0.2 }}
                        className={cn(
                          'absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-card shadow-md',
                          availCfg.dot,
                          availCfg.glow,
                        )}
                      />
                    )}
                  </div>

                  {/* Name & title */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center"
                  >
                    <p className="text-base font-bold text-foreground leading-tight">{displayName}</p>
                    {contactType === 'basic' && basicProfile?.job_title && (
                      <p className="mt-0.5 text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Briefcase className="h-3 w-3 shrink-0" />
                        {basicProfile.job_title}
                      </p>
                    )}
                    {contactType === 'company' && companyProfile?.company_name && (
                      <p className="mt-0.5 text-xs font-semibold text-violet-400 flex items-center justify-center gap-1">
                        <Building2 className="h-3 w-3 shrink-0" />
                        {companyProfile.company_name}
                      </p>
                    )}
                  </motion.div>

                  {/* Badges row */}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="flex flex-wrap justify-center gap-1.5"
                  >
                    {seniorityCfg && (
                      <span className={cn(
                        'flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1',
                        seniorityCfg.color,
                      )}>
                        {seniorityCfg.icon}
                        {seniorityCfg.label}
                      </span>
                    )}
                    {availCfg && (
                      <span className={cn(
                        'flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                        availCfg.color,
                      )}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', availCfg.dot)} />
                        {availCfg.label}
                      </span>
                    )}
                    {contactType === 'company' && companyProfile?.industry && (
                      <span className="flex items-center gap-1 rounded-full bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-violet-400 ring-1 ring-violet-500/20">
                        {companyProfile.industry}
                      </span>
                    )}
                  </motion.div>
                </div>
              </div>

              {/* ── Info sections ── */}
              <div className="px-3 pb-6 space-y-1.5 mt-1">

                {/* Bio / Description */}
                {(contactType === 'basic' ? basicProfile?.bio : companyProfile?.company_description) && (
                  <Section
                    title="Sobre"
                    icon={<Star className="h-3 w-3" />}
                    delay={0.18}
                  >
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {contactType === 'basic' ? basicProfile!.bio : companyProfile!.company_description}
                    </p>
                  </Section>
                )}

                {/* Location */}
                {profile.location && (
                  <InfoRow
                    icon={<MapPin className="h-3.5 w-3.5" />}
                    label={profile.location}
                    delay={0.2}
                  />
                )}

                {/* Company size */}
                {contactType === 'company' && companyProfile?.company_size && (
                  <InfoRow
                    icon={<Users className="h-3.5 w-3.5" />}
                    label={`${companyProfile.company_size} empleados`}
                    delay={0.22}
                  />
                )}

                {/* Website */}
                {contactType === 'basic' && basicProfile?.website && (
                  <InfoRow
                    icon={<Globe className="h-3.5 w-3.5" />}
                    label={basicProfile.website}
                    href={basicProfile.website}
                    delay={0.24}
                  />
                )}
                {contactType === 'company' && companyProfile?.company_website && (
                  <InfoRow
                    icon={<Globe className="h-3.5 w-3.5" />}
                    label={companyProfile.company_website}
                    href={companyProfile.company_website}
                    delay={0.24}
                  />
                )}

                {/* Portfolio */}
                {contactType === 'basic' && basicProfile?.is_published && basicProfile?.portfolio_slug && (
                  <InfoRow
                    icon={<ExternalLink className="h-3.5 w-3.5" />}
                    label="Ver portafolio"
                    href={`/p/${basicProfile.portfolio_slug}`}
                    highlight
                    delay={0.26}
                  />
                )}

                {/* Skills */}
                {skills.length > 0 && (
                  <Section title="Habilidades" icon={<Code2 className="h-3 w-3" />} delay={0.28}>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((s, i) => (
                        <motion.span
                          key={s}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.28 + i * 0.03, type: 'spring', damping: 20, stiffness: 300 }}
                          className="rounded-lg bg-muted/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground border border-border/40 hover:border-violet-500/30 hover:text-violet-400 hover:bg-violet-500/5 transition-colors cursor-default"
                        >
                          {s}
                        </motion.span>
                      ))}
                    </div>
                  </Section>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center px-6"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <Users className="h-6 w-6 text-muted-foreground/30" />
              </div>
              <p className="text-sm text-muted-foreground">No se pudo cargar el perfil</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function Section({
  title,
  icon,
  children,
  delay = 0,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', damping: 25, stiffness: 300 }}
      className="rounded-2xl bg-muted/40 border border-border/30 px-3.5 py-3"
    >
      <div className="mb-2.5 flex items-center gap-1.5">
        {icon && <span className="text-muted-foreground/60">{icon}</span>}
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">{title}</p>
      </div>
      {children}
    </motion.div>
  );
}

function InfoRow({
  icon,
  label,
  href,
  highlight,
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
  highlight?: boolean;
  delay?: number;
}) {
  const inner = (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, type: 'spring', damping: 25, stiffness: 300 }}
      className={cn(
        'flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all',
        href ? 'cursor-pointer hover:bg-muted/60' : '',
        highlight
          ? 'bg-violet-500/8 border border-violet-500/20 hover:bg-violet-500/12'
          : 'bg-muted/30 border border-border/20',
      )}
    >
      <span className={cn(
        'shrink-0',
        highlight ? 'text-violet-400' : 'text-muted-foreground/60',
      )}>
        {icon}
      </span>
      <span className={cn(
        'flex-1 truncate text-xs',
        highlight ? 'font-semibold text-violet-400' : 'text-muted-foreground',
      )}>
        {label}
      </span>
      {href && (
        <ChevronRight className={cn(
          'h-3 w-3 shrink-0',
          highlight ? 'text-violet-400/60' : 'text-muted-foreground/30',
        )} />
      )}
    </motion.div>
  );

  if (href) {
    const isExternal = href.startsWith('http');
    return isExternal
      ? <a href={href} target="_blank" rel="noreferrer">{inner}</a>
      : <a href={href}>{inner}</a>;
  }
  return inner;
}
