import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pencil, MapPin, Mail, Globe, Code2, Briefcase, GraduationCap,
  FolderKanban, Building2, Calendar, CircleDot,
  Star, Eye, Settings2, Check, CheckSquare, Square,
  Loader2, ToggleLeft, ToggleRight, AlertCircle, Copy, ChevronDown,
} from 'lucide-react';
import { useAuthStore, usePortfolioStore } from '@/store';
import type { PublicPortfolio } from '@/shared/services/portfolioService';
import { portfolioService } from '@/shared/services/portfolioService';
import { ExportPortfolioButton } from '@/features/portfolio/ExportPortfolioButton';
import { PortfolioPublicView } from '@/pages/public/PublicPortfolioPage';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'short' });
}
function fmtPeriod(start: string, end: string | null, isCurrent: boolean) {
  return `${fmt(start)} – ${isCurrent || !end ? 'Actualidad' : fmt(end)}`;
}

// ── Skill Pill (used in config editor) ────────────────────────────────────────

const LEVEL_PILL: Record<string, string> = {
  Junior: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
  Mid:    'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
  Senior: 'bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400',
};

// ── Skeleton ───────────────────────────────────────────────────────────────────

function PortfolioSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-5">
      <div className="h-64 w-full rounded-2xl bg-muted/40 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={cn('h-52 rounded-2xl bg-muted/40 animate-pulse', i === 2 || i === 4 ? 'lg:col-span-2' : '')} />
        ))}
        <div className="h-24 rounded-2xl bg-muted/40 animate-pulse md:col-span-2 lg:col-span-3" />
      </div>
    </div>
  );
}

// ── Configuration Editor ───────────────────────────────────────────────────────

type ItemSection = 'projects' | 'experiences' | 'education' | 'hardSkills' | 'softSkills';

function AccordionSection({
  icon: Icon, iconColor, iconBg, title, count, selectedCount, isOpen, onToggle, children,
}: {
  icon: typeof Code2; iconColor: string; iconBg: string; title: string;
  count: number; selectedCount: number; isOpen: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors text-left">
        <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg border shrink-0', iconBg)}>
          <Icon className={cn('h-3.5 w-3.5', iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <span className="ml-2 text-[11px] text-muted-foreground">{count} total</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {selectedCount > 0 ? (
            <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
              {selectedCount} seleccionados
            </span>
          ) : (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">todos visibles</span>
          )}
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-border/50">
              <p className="text-[11px] text-muted-foreground mb-3">
                Selecciona cuáles mostrar en tu portafolio público. Si no seleccionas ninguno, se mostrarán todos.
              </p>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SelectableCard({ isSelected, onClick, children }: { isSelected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl border p-3 transition-all duration-200 relative',
        isSelected
          ? 'border-violet-500/40 bg-violet-500/5 shadow-[0_0_0_1px_rgba(139,92,246,0.2)]'
          : 'border-border bg-background hover:border-violet-500/20 hover:bg-muted/30',
      )}
    >
      <div className="absolute top-2.5 right-2.5">
        {isSelected ? <CheckSquare className="h-4 w-4 text-violet-500" /> : <Square className="h-4 w-4 text-muted-foreground/40" />}
      </div>
      {children}
    </button>
  );
}

function ConfigEditor({ }: { profileId: string }) {
  const { settings, availableItems, loadingItems, saving, fetchAvailableItems, updateSettings, toggleItem } = usePortfolioStore();
  const [openSection, setOpenSection] = useState<ItemSection | null>(null);
  const [slugInput, setSlugInput] = useState('');
  const [slugEditing, setSlugEditing] = useState(false);
  const baseUrl = window.location.origin;

  useEffect(() => {
    if (settings?.slug) setSlugInput(settings.slug);
  }, [settings?.slug]);

  useEffect(() => {
    if (openSection && !availableItems) fetchAvailableItems();
  }, [openSection]);

  const handlePublishToggle = useCallback(async () => {
    if (!settings) return;
    await updateSettings({ isPublished: !settings.isPublished });
    toast.success(settings.isPublished ? 'Portafolio ocultado' : '¡Portafolio publicado!');
  }, [settings, updateSettings]);

  const handleSlugSave = useCallback(async () => {
    if (!slugInput.trim()) return;
    try {
      await updateSettings({ slug: slugInput.trim() });
      setSlugEditing(false);
      toast.success('Slug actualizado');
    } catch {
      toast.error('No se pudo actualizar el slug');
    }
  }, [slugInput, updateSettings]);

  const handleCopyUrl = () => {
    if (!settings?.slug) return;
    navigator.clipboard.writeText(`${baseUrl}/p/${settings.slug}`);
    toast.success('URL copiada');
  };

  const toggleSection = (s: ItemSection) => setOpenSection(prev => prev === s ? null : s);

  const countSelected = (type: string) => {
    if (!settings) return 0;
    return settings.selectedItems.filter(i => i.itemType === type).length;
  };

  if (!settings) return null;

  const publicUrl = settings.slug ? `${baseUrl}/p/${settings.slug}` : null;

  return (
    <div className="space-y-6">
      {/* General */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-violet-500" />Configuración general
        </h3>

        {/* Published toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Portafolio público</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {settings.isPublished ? 'Visible para todos con el enlace' : 'Solo tú puedes verlo'}
            </p>
          </div>
          <button onClick={handlePublishToggle} disabled={saving} className="flex items-center gap-2 text-sm">
            {saving
              ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              : settings.isPublished
                ? <ToggleRight className="h-7 w-7 text-violet-500" />
                : <ToggleLeft className="h-7 w-7 text-muted-foreground" />}
          </button>
        </div>

        {/* Slug + URL */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">URL pública</label>
          {slugEditing ? (
            <div className="mt-1.5 flex gap-2">
              <div className="flex-1 flex items-center rounded-xl border border-violet-500/30 bg-background overflow-hidden">
                <span className="pl-3 text-xs text-muted-foreground shrink-0">{baseUrl}/p/</span>
                <input
                  className="flex-1 bg-transparent px-1 py-2 text-sm text-foreground outline-none"
                  value={slugInput}
                  onChange={e => setSlugInput(
                    e.target.value.toLowerCase()
                      .replace(/[^a-z0-9-]/g, '-')
                      .replace(/-{2,}/g, '-')
                      .replace(/^-|-$/g, '')
                  )}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSlugSave();
                    if (e.key === 'Escape') setSlugEditing(false);
                  }}
                />
              </div>
              <button onClick={handleSlugSave} className="rounded-xl bg-violet-600 hover:bg-violet-500 px-3 py-2 text-xs font-semibold text-white transition-colors flex items-center gap-1">
                <Check className="h-3.5 w-3.5" />Guardar
              </button>
              <button onClick={() => setSlugEditing(false)} className="rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground hover:bg-muted/30 transition-colors">
                Cancelar
              </button>
            </div>
          ) : (
            <div className="mt-1.5 flex items-center gap-2">
              {publicUrl ? (
                <div className="flex-1 flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground truncate flex-1">{publicUrl}</span>
                  <button onClick={handleCopyUrl} className="shrink-0 text-muted-foreground hover:text-violet-500 transition-colors">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No configurada</p>
              )}
              <button
                onClick={() => setSlugEditing(true)}
                className="shrink-0 rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground hover:border-violet-500/30 hover:text-violet-600 transition-all"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              {publicUrl && settings.isPublished && (
                <Link
                  to={`/p/${settings.slug}`} target="_blank"
                  className="shrink-0 rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground hover:border-violet-500/30 hover:text-violet-600 transition-all"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Visibility toggles */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mostrar en público</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {([['showEmail', 'Email', Mail], ['showLocation', 'Ubicación', MapPin], ['showWebsite', 'Sitio web', Globe]] as const).map(([key, label, Icon]) => {
              const value = settings[key as keyof typeof settings] as boolean;
              return (
                <button
                  key={key}
                  onClick={() => updateSettings({ [key]: !value })}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                    value
                      ? 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                      : 'border-border bg-background text-muted-foreground hover:border-violet-500/20',
                  )}
                >
                  <Icon className="h-3 w-3" />{label}
                  {value && <Check className="h-3 w-3" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content selection */}
      <div>
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
          <FolderKanban className="h-4 w-4 text-violet-500" />Contenido del portafolio
        </h3>
        <div className="space-y-2">

          {/* PROJECTS */}
          <AccordionSection
            icon={FolderKanban} iconColor="text-emerald-500 dark:text-emerald-400" iconBg="bg-emerald-500/10 border-emerald-500/20"
            title="Proyectos" count={availableItems?.projects.length ?? 0} selectedCount={countSelected('project')}
            isOpen={openSection === 'projects'} onToggle={() => toggleSection('projects')}
          >
            {loadingItems ? (
              <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(availableItems?.projects ?? []).map((p) => (
                  <SelectableCard key={p.id} isSelected={p.isSelected} onClick={() => toggleItem('project', p.id)}>
                    {p.thumbnail && <img src={p.thumbnail} alt={p.title} className="h-16 w-full object-cover rounded-lg mb-2" />}
                    <p className="text-xs font-semibold text-foreground pr-6 line-clamp-1">{p.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{p.category} · {p.status}</p>
                    {p.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {p.technologies.slice(0, 3).map(t => (
                          <span key={t} className="rounded bg-muted/70 px-1.5 py-0.5 text-[10px] text-muted-foreground">{t}</span>
                        ))}
                      </div>
                    )}
                  </SelectableCard>
                ))}
                {(availableItems?.projects ?? []).length === 0 && (
                  <p className="text-xs text-muted-foreground col-span-2 py-4 text-center">
                    No hay proyectos. <Link to="/dashboard/projects" className="text-violet-500 hover:underline">Crear uno</Link>
                  </p>
                )}
              </div>
            )}
          </AccordionSection>

          {/* EXPERIENCE */}
          <AccordionSection
            icon={Briefcase} iconColor="text-blue-500 dark:text-blue-400" iconBg="bg-blue-500/10 border-blue-500/20"
            title="Experiencia" count={availableItems?.experiences.length ?? 0} selectedCount={countSelected('experience')}
            isOpen={openSection === 'experiences'} onToggle={() => toggleSection('experiences')}
          >
            {loadingItems ? (
              <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="space-y-2">
                {(availableItems?.experiences ?? []).map((e) => (
                  <SelectableCard key={e.id} isSelected={e.isSelected} onClick={() => toggleItem('experience', e.id)}>
                    <div className="flex items-start gap-2.5 pr-6">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50">
                        {e.logoUrl
                          ? <img src={e.logoUrl} alt={e.companyName} className="h-5 w-5 rounded object-contain" />
                          : <Building2 className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground line-clamp-1">{e.jobTitle}</p>
                        <p className="text-[11px] text-violet-600 dark:text-violet-400">{e.companyName}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{fmtPeriod(e.startDate, e.endDate, e.isCurrent)}</p>
                      </div>
                    </div>
                  </SelectableCard>
                ))}
                {(availableItems?.experiences ?? []).length === 0 && (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    No hay experiencias. <Link to="/dashboard/experience" className="text-violet-500 hover:underline">Agregar una</Link>
                  </p>
                )}
              </div>
            )}
          </AccordionSection>

          {/* EDUCATION */}
          <AccordionSection
            icon={GraduationCap} iconColor="text-amber-500 dark:text-amber-400" iconBg="bg-amber-500/10 border-amber-500/20"
            title="Educación" count={availableItems?.education.length ?? 0} selectedCount={countSelected('education')}
            isOpen={openSection === 'education'} onToggle={() => toggleSection('education')}
          >
            {loadingItems ? (
              <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="space-y-2">
                {(availableItems?.education ?? []).map((e) => (
                  <SelectableCard key={e.id} isSelected={e.isSelected} onClick={() => toggleItem('education', e.id)}>
                    <div className="pr-6">
                      <p className="text-xs font-semibold text-foreground line-clamp-1">
                        {e.degree}{e.fieldOfStudy ? ` en ${e.fieldOfStudy}` : ''}
                      </p>
                      <p className="text-[11px] text-violet-600 dark:text-violet-400">{e.institution}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{fmtPeriod(e.startDate, e.endDate, e.inProgress)}</p>
                    </div>
                  </SelectableCard>
                ))}
                {(availableItems?.education ?? []).length === 0 && (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    No hay educación. <Link to="/dashboard/education" className="text-violet-500 hover:underline">Agregar una</Link>
                  </p>
                )}
              </div>
            )}
          </AccordionSection>

          {/* HARD SKILLS */}
          <AccordionSection
            icon={Code2} iconColor="text-violet-500 dark:text-violet-400" iconBg="bg-violet-500/10 border-violet-500/20"
            title="Habilidades técnicas" count={availableItems?.hardSkills.length ?? 0} selectedCount={countSelected('hard_skill')}
            isOpen={openSection === 'hardSkills'} onToggle={() => toggleSection('hardSkills')}
          >
            {loadingItems ? (
              <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(availableItems?.hardSkills ?? []).map((s) => {
                  const levelCls = LEVEL_PILL[s.level ?? ''] ?? 'bg-muted/60 border-border text-muted-foreground';
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleItem('hard_skill', s.id)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200',
                        s.isSelected ? `${levelCls} ring-2 ring-violet-500/30` : 'bg-muted/40 border-border text-muted-foreground hover:border-violet-500/20',
                      )}
                    >
                      {s.isSelected && <Check className="h-3 w-3" />}
                      {s.name}
                      {s.level && <span className="opacity-60">· {s.level}</span>}
                    </button>
                  );
                })}
                {(availableItems?.hardSkills ?? []).length === 0 && (
                  <p className="text-xs text-muted-foreground py-4 w-full text-center">
                    No hay habilidades técnicas. <Link to="/dashboard/skills" className="text-violet-500 hover:underline">Agregar</Link>
                  </p>
                )}
              </div>
            )}
          </AccordionSection>

          {/* SOFT SKILLS */}
          <AccordionSection
            icon={Star} iconColor="text-rose-500 dark:text-rose-400" iconBg="bg-rose-500/10 border-rose-500/20"
            title="Habilidades blandas" count={availableItems?.softSkills.length ?? 0} selectedCount={countSelected('soft_skill')}
            isOpen={openSection === 'softSkills'} onToggle={() => toggleSection('softSkills')}
          >
            {loadingItems ? (
              <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(availableItems?.softSkills ?? []).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggleItem('soft_skill', s.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200',
                      s.isSelected
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/20'
                        : 'bg-muted/40 border-border text-muted-foreground hover:border-rose-500/20',
                    )}
                  >
                    {s.isSelected && <Check className="h-3 w-3" />}
                    {s.name}
                  </button>
                ))}
                {(availableItems?.softSkills ?? []).length === 0 && (
                  <p className="text-xs text-muted-foreground py-4 w-full text-center">
                    No hay habilidades blandas. <Link to="/dashboard/skills" className="text-violet-500 hover:underline">Agregar</Link>
                  </p>
                )}
              </div>
            )}
          </AccordionSection>
        </div>
      </div>

      {/* Hint */}
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
          Si no seleccionas ningún elemento en una sección, se mostrarán <strong>todos</strong> los de esa sección en tu portafolio público.
        </p>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

type Tab = 'preview' | 'config';

export default function PortfolioPage() {
  const { profile } = useAuthStore();
  const { fetchSettings, settings, loadingSettings } = usePortfolioStore();
  const [activeTab, setActiveTab] = useState<Tab>('preview');
  const [previewPortfolio, setPreviewPortfolio] = useState<PublicPortfolio | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState(false);

  // Load settings once
  useEffect(() => {
    fetchSettings();
  }, []);

  // Reload preview whenever the tab is shown (picks up config changes)
  useEffect(() => {
    if (activeTab !== 'preview') return;
    setPreviewLoading(true);
    setPreviewError(false);
    portfolioService.getPreviewPortfolio()
      .then(setPreviewPortfolio)
      .catch(() => setPreviewError(true))
      .finally(() => setPreviewLoading(false));
  }, [activeTab]);

  if (loadingSettings) return <PortfolioSkeleton />;

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Mi Portafolio</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {settings?.isPublished ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />Publicado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />Solo visible para ti
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ExportPortfolioButton />
            {settings?.slug && settings.isPublished && (
              <Link
                to={`/p/${settings.slug}`} target="_blank"
                className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground hover:border-violet-500/30 hover:text-violet-600 transition-all"
              >
                <Eye className="h-3.5 w-3.5" />Ver público
              </Link>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl bg-muted/40 border border-border w-fit">
          {([['preview', 'Vista previa', Eye], ['config', 'Configurar', Settings2]] as const).map(([id, label, Icon]) => (
            <button
              key={id} onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                activeTab === id
                  ? 'bg-background text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5" />{label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === 'preview' ? (
            <motion.div key="preview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {previewLoading ? (
                <div className="grid lg:grid-cols-[1.4fr_0.6fr] gap-6 mt-4">
                  <div className="space-y-4">
                    <div className="h-52 rounded-2xl bg-muted/40 animate-pulse" />
                    {[1, 2, 3].map(i => <div key={i} className="h-40 rounded-2xl bg-muted/40 animate-pulse" />)}
                  </div>
                  <div className="space-y-4">
                    {[1, 2].map(i => <div key={i} className="h-40 rounded-2xl bg-muted/40 animate-pulse" />)}
                  </div>
                </div>
              ) : previewError ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
                  <Eye className="h-9 w-9 text-muted-foreground/25 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-foreground mb-1">No se pudo cargar la vista previa</p>
                  <p className="text-xs text-muted-foreground">Verifica tu conexión o completa tu perfil.</p>
                  <Link to="/dashboard/preferences" className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-semibold text-white transition-colors">
                    <Pencil className="h-3.5 w-3.5" />Completar perfil
                  </Link>
                </div>
              ) : previewPortfolio ? (
                <PortfolioPublicView portfolio={previewPortfolio} isPreview />
              ) : null}
            </motion.div>
          ) : (
            <motion.div key="config" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <ConfigEditor profileId={profile?.id ?? ''} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
