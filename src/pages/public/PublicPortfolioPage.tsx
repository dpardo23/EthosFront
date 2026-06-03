import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight, Award, BadgeCheck, Briefcase, Building2, Calendar,
  ChevronRight, CircleDot, Code2, ExternalLink, Eye, FolderKanban,
  Globe, GraduationCap, Link2, Lock, Mail, MapPin, MessageSquare,
  Sparkles, Star,
} from 'lucide-react';
import { EthosLogoIcon } from '@/components/brand/EthosCoreLogo';
import { useAuthStore } from '@/store/authStore';
import { portfolioService, type PublicPortfolio } from '@/shared/services/portfolioService';
import { cn } from '@/shared/lib/utils';

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'short' });
}
function fmtPeriod(start: string, end: string | null, isCurrent: boolean) {
  return `${fmt(start)} – ${isCurrent || !end ? 'Actualidad' : fmt(end)}`;
}

const LEVEL_COLOR: Record<string, string> = {
  Junior: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400',
  Mid:    'bg-blue-500/10 border-blue-500/25 text-blue-600 dark:text-blue-400',
  Senior: 'bg-violet-500/10 border-violet-500/25 text-violet-600 dark:text-violet-400',
};

const STATUS_INFO: Record<string, { dot: string; label: string }> = {
  draft:       { dot: 'bg-zinc-400',    label: 'Borrador' },
  in_progress: { dot: 'bg-amber-400',   label: 'En progreso' },
  completed:   { dot: 'bg-emerald-400', label: 'Completado' },
  archived:    { dot: 'bg-zinc-600',    label: 'Archivado' },
};

// ── Animations ─────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 200, damping: 26 } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

// ── Protected section (for guests) ────────────────────────────────────────────

function ProtectedSection({
  isLocked, title, description, children,
}: {
  isLocked: boolean; title: string; description: string; children: ReactNode;
}) {
  if (!isLocked) return <>{children}</>;
  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="pointer-events-none select-none blur-sm saturate-50 opacity-60">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-xs rounded-2xl border border-border bg-card/95 p-5 text-center shadow-2xl">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20 mx-auto mb-3">
            <Lock className="h-4 w-4 text-violet-500" />
          </div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
          <Link to="/login" className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-semibold text-white transition-colors">
            Crear cuenta o iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Section title ──────────────────────────────────────────────────────────────

function SectionTitle({ title, icon: Icon, accent = 'violet' }: { title: string; icon: React.ElementType; accent?: string }) {
  const accentMap: Record<string, string> = {
    violet:  'bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400',
    blue:    'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    amber:   'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
    rose:    'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400',
  };
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={cn('flex h-8 w-8 items-center justify-center rounded-xl border', accentMap[accent] ?? accentMap.violet)}>
        <Icon className="h-4 w-4" />
      </div>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
    </div>
  );
}

// ── Skeletons / fallbacks ──────────────────────────────────────────────────────

function PublicPortfolioSkeleton() {
  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="h-64 rounded-2xl bg-muted/40 animate-pulse" />
        <div className="grid lg:grid-cols-[1.4fr_0.6fr] gap-6">
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-40 rounded-2xl bg-muted/40 animate-pulse" />)}
          </div>
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-48 rounded-2xl bg-muted/40 animate-pulse" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function PortfolioNotFound({ slug }: { slug?: string }) {
  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 border border-border mx-auto mb-5">
          <FolderKanban className="h-7 w-7 text-muted-foreground/40" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Portafolio no encontrado</h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          {slug ? `El portafolio "@${slug}" no existe o no está publicado.` : 'Este portafolio no está disponible.'}
        </p>
        <Link to="/" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors">
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}

// ── PortfolioPublicView — reusable exported component ─────────────────────────

export function PortfolioPublicView({
  portfolio,
  isPreview = false,
  isGuest = false,
}: {
  portfolio: PublicPortfolio;
  isPreview?: boolean;
  isGuest?: boolean;
}) {
  const {
    name, professionalTitle, bio, location, email, website, photoUrl,
    accentColor, viewsCount, projects, experiences, education, hardSkills, softSkills,
  } = portfolio;

  const hasContent = bio || experiences.length > 0 || projects.length > 0
    || hardSkills.length > 0 || softSkills.length > 0 || education.length > 0;

  return (
    <div className={cn('bg-background', !isPreview && 'min-h-screen pt-20')}>

      {/* Preview banner */}
      {isPreview && (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-4 pb-2">
          <div className="flex items-center gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
            <Eye className="h-4 w-4 text-blue-500 shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
              <strong>Vista previa</strong> — así es como ven tu portafolio los visitantes.
              Los cambios en tu perfil se reflejarán aquí automáticamente.
            </p>
          </div>
        </div>
      )}

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
        className="relative overflow-hidden"
      >
        <div
          className="h-44 sm:h-52"
          style={{
            background: `linear-gradient(135deg, ${accentColor}33 0%, ${accentColor}15 40%, transparent 70%), linear-gradient(220deg, rgba(139,92,246,0.12) 0%, transparent 50%)`,
            backgroundColor: 'hsl(var(--background))',
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{ backgroundImage: `radial-gradient(circle at 25% 50%, ${accentColor} 0%, transparent 60%)` }}
          />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="-mt-16 sm:-mt-20 pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">

              {/* Avatar */}
              {photoUrl ? (
                <img
                  src={photoUrl} alt={name}
                  className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl border-4 border-background object-cover shadow-xl shrink-0 ring-2 ring-white/10"
                />
              ) : (
                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl border-4 border-background bg-gradient-to-br from-violet-500/30 to-violet-600/20 shadow-xl shrink-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-violet-600/60 dark:text-violet-400/60">
                    {name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Name + meta */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{name}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-violet-600 dark:text-violet-400">
                    <BadgeCheck className="h-3 w-3" />Verificado
                  </span>
                </div>
                {professionalTitle && (
                  <p className="text-base sm:text-lg text-muted-foreground font-medium leading-snug">{professionalTitle}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                  {location && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />{location}
                    </span>
                  )}
                  {email && !isGuest && (
                    <a href={`mailto:${email}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-violet-500 transition-colors">
                      <Mail className="h-3.5 w-3.5" />{email}
                    </a>
                  )}
                  {website && (
                    <a href={website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-violet-500 transition-colors">
                      <Globe className="h-3.5 w-3.5" />{website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>
              </div>

              {/* Contact button — public view only */}
              {!isPreview && (
                <div className="flex gap-2.5 shrink-0">
                  {isGuest ? (
                    <Link to="/login" className="flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-lg shadow-violet-500/20">
                      <MessageSquare className="h-4 w-4" />Contactar
                    </Link>
                  ) : email ? (
                    <a href={`mailto:${email}`} className="flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-lg shadow-violet-500/20">
                      <Mail className="h-4 w-4" />Contactar
                    </a>
                  ) : null}
                </div>
              )}
            </div>

            {/* Stats bar */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Visualizaciones', value: viewsCount.toLocaleString('es-ES'), icon: Eye },
                { label: 'Proyectos',        value: String(projects.length),             icon: FolderKanban },
                { label: 'Experiencias',     value: String(experiences.length),          icon: Briefcase },
                { label: 'Habilidades',      value: String(hardSkills.length + softSkills.length), icon: Sparkles },
              ].map(({ label, value, icon: Icon }) => (
                <motion.div
                  key={label} variants={fadeUp} initial="hidden" animate="show"
                  className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</p>
                    <p className="text-xl font-bold text-foreground mt-0.5">{value}</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/15">
                    <Icon className="h-4 w-4 text-violet-500" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Guest banner — public view only */}
      {!isPreview && (
        <AnimatePresence>
          {isGuest && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-5xl px-4 sm:px-6 mb-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-violet-500/20 bg-violet-500/5 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Estás en modo invitado</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Crea una cuenta para ver el perfil completo y contactar a este profesional.</p>
                </div>
                <Link to="/login" className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-semibold text-white transition-colors">
                  Crear cuenta <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <motion.div
        variants={stagger} initial="hidden" animate="show"
        className="mx-auto max-w-5xl px-4 sm:px-6 pb-16 mt-2"
      >
        {!hasContent && isPreview ? (
          /* Empty state for preview when no data */
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
            <Sparkles className="h-9 w-9 text-muted-foreground/25 mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground mb-1">Tu portafolio está vacío</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Completa tu bio, agrega experiencias, proyectos y habilidades para que aparezcan aquí.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr] lg:gap-8">

            {/* ── LEFT COLUMN ───────────────────────────────────────────── */}
            <div className="space-y-6">

              {/* BIO */}
              {bio && (
                <ProtectedSection
                  isLocked={!isPreview && isGuest}
                  title="Desbloquea el resumen completo"
                  description="Crea tu cuenta para ver el contexto profesional completo."
                >
                  <motion.div variants={fadeUp} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                    <SectionTitle title="Acerca de" icon={Sparkles} />
                    <p className="text-sm leading-7 text-muted-foreground">{bio}</p>
                  </motion.div>
                </ProtectedSection>
              )}

              {/* EXPERIENCE */}
              {experiences.length > 0 && (
                <ProtectedSection
                  isLocked={!isPreview && isGuest}
                  title="Experiencia reservada"
                  description="Inicia sesión para ver empresas, roles y trayectoria profesional."
                >
                  <motion.div variants={fadeUp} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                    <SectionTitle title="Experiencia" icon={Briefcase} accent="blue" />
                    <div className="space-y-4">
                      {experiences.map((exp, idx) => (
                        <motion.article
                          key={exp.id} variants={fadeUp}
                          className={cn('flex gap-4', idx < experiences.length - 1 && 'pb-4 border-b border-border/50')}
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/50">
                            {exp.logoUrl
                              ? <img src={exp.logoUrl} alt={exp.companyName} className="h-6 w-6 rounded-lg object-contain" />
                              : <Building2 className="h-4 w-4 text-muted-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-foreground">{exp.jobTitle}</p>
                                <p className="text-xs text-violet-600 dark:text-violet-400 font-medium mt-0.5">{exp.companyName}</p>
                              </div>
                              {exp.isCurrent && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                                  <CircleDot className="h-2.5 w-2.5" />Actual
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {fmtPeriod(exp.startDate, exp.endDate, exp.isCurrent)}
                            </p>
                            {exp.description && (
                              <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-3">{exp.description}</p>
                            )}
                          </div>
                        </motion.article>
                      ))}
                    </div>
                  </motion.div>
                </ProtectedSection>
              )}

              {/* PROJECTS */}
              {projects.length > 0 && (
                <ProtectedSection
                  isLocked={!isPreview && isGuest}
                  title="Proyectos visibles al registrarte"
                  description="Crea una cuenta para ver el detalle de proyectos, stack y resultados."
                >
                  <motion.div variants={fadeUp} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                    <SectionTitle title="Proyectos" icon={FolderKanban} accent="emerald" />
                    <div className="grid gap-4 sm:grid-cols-2">
                      {projects.map((project) => {
                        const status = STATUS_INFO[project.status] ?? STATUS_INFO.draft;
                        return (
                          <motion.article
                            key={project.id} variants={fadeUp}
                            className="group overflow-hidden rounded-xl border border-border bg-background hover:border-violet-500/25 hover:shadow-[0_0_20px_rgba(139,92,246,0.07)] transition-all duration-300"
                          >
                            {project.thumbnail ? (
                              <div className="relative h-36 overflow-hidden">
                                <img
                                  src={project.thumbnail} alt={project.title}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                {project.isFeatured && (
                                  <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-amber-500/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-white">
                                    <Star className="h-2.5 w-2.5 fill-white" />Destacado
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex h-20 items-center justify-center bg-gradient-to-br from-muted/60 to-muted/30 border-b border-border relative">
                                {project.isFeatured && (
                                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                                    <Star className="h-2.5 w-2.5 fill-white" />Destacado
                                  </span>
                                )}
                                <FolderKanban className="h-8 w-8 text-muted-foreground/25" />
                              </div>
                            )}
                            <div className="p-4">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                  {project.title}
                                </h3>
                                {project.repositoryUrl && (
                                  <a href={project.repositoryUrl} target="_blank" rel="noreferrer" className="shrink-0 text-muted-foreground hover:text-violet-500 transition-colors">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 mb-2">
                                <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', status.dot)} />
                                <span className="text-[10px] text-muted-foreground">{status.label}</span>
                                {project.role && (
                                  <><span className="text-muted-foreground/30">·</span><span className="text-[10px] text-muted-foreground">{project.role}</span></>
                                )}
                              </div>
                              {project.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">{project.description}</p>
                              )}
                              {project.technologies.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {project.technologies.slice(0, 4).map(t => (
                                    <span key={t} className="rounded-full bg-muted/70 border border-border/50 px-2 py-0.5 text-[10px] text-muted-foreground">{t}</span>
                                  ))}
                                  {project.technologies.length > 4 && (
                                    <span className="rounded-full bg-muted/70 border border-border/50 px-2 py-0.5 text-[10px] text-muted-foreground/60">
                                      +{project.technologies.length - 4}
                                    </span>
                                  )}
                                </div>
                              )}
                              {project.results && (
                                <div className="mt-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 px-3 py-2">
                                  <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">Resultado</p>
                                  <p className="text-[11px] text-muted-foreground line-clamp-2">{project.results}</p>
                                </div>
                              )}
                            </div>
                          </motion.article>
                        );
                      })}
                    </div>
                  </motion.div>
                </ProtectedSection>
              )}
            </div>

            {/* ── RIGHT COLUMN ──────────────────────────────────────────── */}
            <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">

              {/* HARD SKILLS */}
              {hardSkills.length > 0 && (
                <ProtectedSection
                  isLocked={!isPreview && isGuest}
                  title="Skills protegidas"
                  description="Regístrate para ver habilidades técnicas y niveles."
                >
                  <motion.div variants={fadeUp} className="rounded-2xl border border-border bg-card p-5">
                    <SectionTitle title="Habilidades técnicas" icon={Code2} accent="violet" />
                    <div className="flex flex-wrap gap-2">
                      {hardSkills.map((skill) => {
                        const cls = LEVEL_COLOR[skill.level ?? ''] ?? 'bg-muted/60 border-border text-muted-foreground';
                        return (
                          <span key={skill.id} className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold', cls)}>
                            <Code2 className="h-3 w-3 opacity-60" />
                            {skill.name}
                            {skill.level && <span className="opacity-55">· {skill.level}</span>}
                          </span>
                        );
                      })}
                    </div>
                  </motion.div>
                </ProtectedSection>
              )}

              {/* SOFT SKILLS */}
              {softSkills.length > 0 && (
                <ProtectedSection
                  isLocked={!isPreview && isGuest}
                  title="Habilidades blandas"
                  description="Inicia sesión para ver las habilidades interpersonales."
                >
                  <motion.div variants={fadeUp} className="rounded-2xl border border-border bg-card p-5">
                    <SectionTitle title="Habilidades blandas" icon={Sparkles} accent="rose" />
                    <div className="flex flex-wrap gap-2">
                      {softSkills.map((skill) => (
                        <span
                          key={skill.id}
                          className="inline-flex items-center rounded-full border border-rose-500/20 bg-rose-500/[0.08] px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400"
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                </ProtectedSection>
              )}

              {/* EDUCATION */}
              {education.length > 0 && (
                <ProtectedSection
                  isLocked={!isPreview && isGuest}
                  title="Educación privada"
                  description="Inicia sesión para ver formación e instituciones."
                >
                  <motion.div variants={fadeUp} className="rounded-2xl border border-border bg-card p-5">
                    <SectionTitle title="Educación" icon={GraduationCap} accent="amber" />
                    <div className="space-y-4">
                      {education.map((edu, idx) => (
                        <div
                          key={edu.id}
                          className={cn('flex gap-3', idx < education.length - 1 && 'pb-4 border-b border-border/50')}
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/50">
                            {edu.logoUrl
                              ? <img src={edu.logoUrl} alt={edu.institution} className="h-5 w-5 rounded object-contain" />
                              : <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-foreground line-clamp-1">
                              {edu.degree}{edu.fieldOfStudy ? ` en ${edu.fieldOfStudy}` : ''}
                            </p>
                            <p className="text-[11px] text-violet-600 dark:text-violet-400 mt-0.5">{edu.institution}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {fmtPeriod(edu.startDate, edu.endDate, edu.inProgress)}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {edu.inProgress && (
                                <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-violet-600 dark:text-violet-400">
                                  EN CURSO
                                </span>
                              )}
                              {edu.credentialUrl && (
                                <a href={edu.credentialUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-violet-500 transition-colors">
                                  <Award className="h-3 w-3" />Ver credencial
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </ProtectedSection>
              )}

              {/* CONTACT LINKS */}
              {(email || website) && (
                <ProtectedSection
                  isLocked={!isPreview && isGuest}
                  title="Contacto disponible al iniciar sesión"
                  description="Entra para ver y usar los enlaces de contacto."
                >
                  <motion.div variants={fadeUp} className="rounded-2xl border border-border bg-card p-5">
                    <SectionTitle title="Contacto" icon={Link2} accent="violet" />
                    <div className="space-y-2">
                      {email && (
                        <a
                          href={`mailto:${email}`}
                          className="flex items-center justify-between rounded-xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/40 hover:border-violet-500/25 group"
                        >
                          <span className="inline-flex items-center gap-2 text-xs font-medium">
                            <Mail className="h-4 w-4 text-violet-500" />Correo profesional
                          </span>
                          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-violet-500 transition-colors" />
                        </a>
                      )}
                      {website && (
                        <a
                          href={website} target="_blank" rel="noreferrer"
                          className="flex items-center justify-between rounded-xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/40 hover:border-violet-500/25 group"
                        >
                          <span className="inline-flex items-center gap-2 text-xs font-medium">
                            <Globe className="h-4 w-4 text-violet-500" />Sitio personal
                          </span>
                          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-violet-500 transition-colors" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                </ProtectedSection>
              )}

              {/* EthosHub badge */}
              <motion.div variants={fadeUp} className="flex items-center justify-center gap-2 py-2">
                <EthosLogoIcon size={14} animate={false} />
                <span className="text-[10px] text-muted-foreground/50 font-medium">Portafolio creado en EthosHub</span>
              </motion.div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ── Route component ────────────────────────────────────────────────────────────

export default function PublicPortfolioPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuthStore();
  const [portfolio, setPortfolio] = useState<PublicPortfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) { setLoading(false); setNotFound(true); return; }
    portfolioService.getPublicPortfolio(slug)
      .then(setPortfolio)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <PublicPortfolioSkeleton />;
  if (notFound || !portfolio) return <PortfolioNotFound slug={slug} />;

  return <PortfolioPublicView portfolio={portfolio} isGuest={!isAuthenticated} />;
}
