import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Star, Trash2, Search, ArrowUp, ArrowDown, X, Code2,
  Sparkles, Layers, Pencil,
} from 'lucide-react';
import { useAuthStore, useSkillsStore, useUiStore } from '@/store';
import { cn } from '@/shared/lib/utils';
import type { SkillLevel, SkillCategory, GlobalSkillTag, HardSkill } from '@/shared/types';

// ── Constants ────────────────────────────────────────────────────────────────

const skillLevels: { value: SkillLevel; label: string }[] = [
  { value: 'Junior', label: 'Junior' },
  { value: 'Mid',    label: 'Mid'    },
  { value: 'Senior', label: 'Senior' },
];

const categories: SkillCategory[] = [
  'Frontend', 'Backend', 'Data', 'Infrastructure', 'Mobile', 'Design',
];

const LEVEL_STYLES: Record<string, string> = {
  Junior: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Mid:    'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
  Senior: 'text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20',
};

const CATEGORY_LABELS: Record<string, string> = {
  Frontend:       'Frontend',
  Backend:        'Backend',
  Data:           'Base de Datos',
  Infrastructure: 'Infraestructura',
  Mobile:         'Mobile',
  Design:         'Diseño',
};

const inputCls =
  'flex h-10 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:border-violet-500/60 transition-all';
const selectCls =
  'flex h-10 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:border-violet-500/60 transition-all cursor-pointer appearance-none';
const textareaCls =
  'flex w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:border-violet-500/60 transition-all';

// ── Primitives ────────────────────────────────────────────────────────────────

function ModalOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const portalRoot = typeof document !== 'undefined'
    ? document.getElementById('portal-root')
    : null;

  const content = (
    <>
      {/* Backdrop — absolute so it's contained inside #portal-root, not covering Topbar/Sidebar */}
      <motion.div
        className="absolute inset-0 z-40 bg-background/75 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
      />
      {/* Dialog — flex-centered, pointer-events passed through wrapper */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-black/20 pointer-events-auto"
          onClick={e => e.stopPropagation()}
        >
          {children}
        </motion.div>
      </div>
    </>
  );

  return portalRoot ? createPortal(content, portalRoot) : content;
}

function LevelBadge({ level }: { level: string }) {
  return (
    <span className={cn(
      'rounded-full border px-2 py-0.5 text-[10px] font-semibold shrink-0',
      LEVEL_STYLES[level] ?? ''
    )}>
      {level}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SkillsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile: profile } = useAuthStore();
  const { addToast } = useUiStore();
  const {
    hardSkills,
    softSkills,
    searchResults,
    loading,
    fetchHardSkills,
    fetchSoftSkills,
    searchTags,
    addHardSkill,
    updateHardSkill,
    createTag,
    removeHardSkill,
    toggleTopSkill,
    reorderTopSkills,
    addSoftSkill,
    updateSoftSkill,
    removeSoftSkill,
  } = useSkillsStore();

  // Modal visibility
  const [showAddModal,     setShowAddModal]     = useState(false);
  const [showSoftModal,    setShowSoftModal]    = useState(false);
  // Hard skill add/edit state
  const [searchQuery,      setSearchQuery]      = useState('');
  const [selectedTag,      setSelectedTag]      = useState<GlobalSkillTag | null>(null);
  const [selectedLevel,    setSelectedLevel]    = useState<SkillLevel>('Mid');
  const [newTagName,       setNewTagName]       = useState('');
  const [newTagCategory,   setNewTagCategory]   = useState<SkillCategory>('Frontend');
  const [editingHardSkill, setEditingHardSkill] = useState<HardSkill | null>(null);
  // Soft skill state
  const [softSkillTitle,      setSoftSkillTitle]      = useState('');
  const [softSkillDesc,       setSoftSkillDesc]       = useState('');
  const [editingSoftSkill,    setEditingSoftSkill]    = useState<string | null>(null);
  const [softTitleError,      setSoftTitleError]      = useState(false);
  const [softDescError,       setSoftDescError]       = useState(false);
  // Filter + delete
  const [filterCategory,   setFilterCategory]   = useState<string>('all');
  const [deleteConfirm,    setDeleteConfirm]    = useState<{ type: 'hard' | 'soft'; id: string } | null>(null);
  // Category hover dimming
  const [hoveredCategory,  setHoveredCategory]  = useState<string | null>(null);

  const onboardingMode = searchParams.get('onboarding') === '1';

  useEffect(() => {
    if (profile) {
      fetchHardSkills(profile.id);
      fetchSoftSkills(profile.id);
    }
  }, [profile, fetchHardSkills, fetchSoftSkills]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchTags(searchQuery);
      // Al borrar la búsqueda limpiamos la selección previa para evitar
      // que el botón "Agregar" quede habilitado con un tag no visible
      if (!searchQuery.trim()) setSelectedTag(null);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchTags]);

  // ── Hard skill handlers ──────────────────────────────────────────────────

  const openEditHard = (skill: HardSkill) => {
    setEditingHardSkill(skill);
    setSelectedTag(skill.skillTag);
    setSelectedLevel(skill.level);
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setSelectedTag(null);
    setSearchQuery('');
    setNewTagName('');
    setEditingHardSkill(null);
  };

  const handleAddSkill = async () => {
    if (!profile) return;

    if (editingHardSkill) {
      await updateHardSkill(profile.id, editingHardSkill.id, selectedLevel);
      addToast({ type: 'success', title: 'Nivel de habilidad actualizado' });
      closeAddModal();
      return;
    }

    if (!selectedTag) return;
    if (hardSkills.some(s => s.skillTag.id === selectedTag.id)) {
      addToast({ type: 'error', title: 'Esta habilidad ya existe en tu perfil' });
      return;
    }
    if (hardSkills.length >= 50) {
      addToast({ type: 'error', title: 'Máximo 50 hard skills permitidas' });
      return;
    }
    await addHardSkill(profile.id, selectedTag.id, selectedLevel);
    addToast({ type: 'success', title: 'Habilidad agregada exitosamente' });
    closeAddModal();
  };

  const handleCreateAndAdd = async () => {
    if (!profile || !newTagName.trim()) return;
    const newTag = await createTag(newTagName.trim(), newTagCategory);
    await addHardSkill(profile.id, newTag.id, selectedLevel);
    addToast({ type: 'success', title: 'Habilidad personalizada creada y agregada' });
    closeAddModal();
  };

  const handleToggleTop = async (skillId: string) => {
    if (!profile) return;
    const skill = hardSkills.find(s => s.id === skillId);
    if (!skill) return;
    if (!skill.isTop && topSkillsCount >= 3) {
      addToast({ type: 'error', title: 'Máximo 3 top skills permitidas' });
      return;
    }
    try { await toggleTopSkill(profile.id, skillId); }
    catch { addToast({ type: 'error', title: 'Error al marcar como favorita' }); }
  };

  const handleMoveTop = async (skillId: string, direction: 'up' | 'down') => {
    if (!profile) return;
    const ordered = [...hardSkills]
      .filter(s => s.isTop)
      .sort((a, b) => (a.topOrder ?? Infinity) - (b.topOrder ?? Infinity));
    const idx = ordered.findIndex(s => s.id === skillId);
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (idx < 0 || target < 0 || target >= ordered.length) return;
    const next = [...ordered];
    [next[idx], next[target]] = [next[target], next[idx]];
    try {
      await reorderTopSkills(profile.id, next.map(s => s.id));
    } catch {
      addToast({ type: 'error', title: 'No se pudo reordenar las top skills' });
    }
  };

  // ── Soft skill handlers ──────────────────────────────────────────────────

  const openEditSoft = (id: string) => {
    const s = softSkills.find(x => x.id === id);
    if (!s) return;
    setSoftSkillTitle(s.title);
    setSoftSkillDesc(s.description || '');
    setEditingSoftSkill(id);
    setShowSoftModal(true);
  };

  const closeSoftModal = () => {
    setShowSoftModal(false);
    setSoftSkillTitle('');
    setSoftSkillDesc('');
    setEditingSoftSkill(null);
    setSoftTitleError(false);
    setSoftDescError(false);
  };

  const handleSoftSkill = async () => {
    const titleOk = softSkillTitle.trim().length >= 3;
    const descOk  = softSkillDesc.trim().length >= 10;
    if (!titleOk) { setSoftTitleError(true); }
    if (!descOk)  { setSoftDescError(true); }
    if (!titleOk || !descOk) return;
    if (!profile) return;
    setSoftTitleError(false);
    setSoftDescError(false);
    if (editingSoftSkill) {
      await updateSoftSkill(editingSoftSkill, softSkillTitle, softSkillDesc);
      addToast({ type: 'success', title: 'Soft skill actualizada' });
    } else {
      await addSoftSkill(profile.id, softSkillTitle, softSkillDesc);
      addToast({ type: 'success', title: 'Soft skill agregada' });
    }
    closeSoftModal();
  };

  // ── Delete handler ───────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteConfirm || !profile) return;
    try {
      if (deleteConfirm.type === 'hard') await removeHardSkill(profile.id, deleteConfirm.id);
      else await removeSoftSkill(profile.id, deleteConfirm.id);
    } catch {
      // toast already shown by the store
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleCompleteOnboarding = () => {
    if (!profile?.email) return;
    localStorage.setItem(
      `ethoshub_skills_onboarding_completed_${profile.email.toLowerCase().trim()}`,
      'true'
    );
    addToast({ type: 'success', title: 'Perfil inicial completado' });
    navigate('/dashboard', { replace: true });
  };

  // ── Derived state ────────────────────────────────────────────────────────

  const topSkillsCount = hardSkills.filter(s => s.isTop).length;
  const orderedTop = [...hardSkills]
    .filter(s => s.isTop)
    .sort((a, b) => (a.topOrder ?? Infinity) - (b.topOrder ?? Infinity));

  const filtered = filterCategory === 'all'
    ? hardSkills
    : hardSkills.filter(s => s.skillTag.category === filterCategory);

  const grouped = categories.reduce((acc, cat) => {
    const skills = filtered.filter(s => s.skillTag.category === cat);
    if (skills.length) acc[cat] = skills;
    return acc;
  }, {} as Record<string, typeof hardSkills>);

  const isEmpty = hardSkills.length === 0;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      className="space-y-5"
    >

        {/* ── Header card ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04, type: 'spring', stiffness: 260, damping: 28 }}
          className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-6 sm:px-8 sm:py-7"
        >
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_50%_at_0%_0%,_hsl(var(--primary)/0.10)_0%,_transparent_100%)]" />
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_40%_60%_at_100%_100%,_hsl(var(--primary)/0.05)_0%,_transparent_100%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2.5 max-w-lg">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                <Code2 className="h-3 w-3 text-violet-500 dark:text-violet-400" />
                Stack técnico
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {t('skills.title', 'Habilidades')}
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Gestiona tu stack técnico y competencias profesionales.
              </p>
            </div>
            <div className="flex flex-col gap-3 shrink-0 lg:items-end">
              <div className="flex items-center gap-2">
                {[
                  { v: hardSkills.length,    l: 'Hard Skills' },
                  { v: softSkills.length,    l: 'Soft Skills' },
                  { v: `${topSkillsCount}/3`, l: 'Top Skills' },
                ].map(s => (
                  <div key={s.l} className="w-[78px] rounded-2xl border border-border bg-background/80 px-2.5 py-2 text-center">
                    <p className="text-base font-bold text-foreground tabular-nums leading-none">{s.v}</p>
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground mt-1 truncate">{s.l}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSoftModal(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-border bg-card hover:bg-accent px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-200"
                >
                  <Plus className="h-4 w-4" />
                  Soft Skill
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-95 px-3 py-2 text-sm font-semibold text-white transition-all duration-150"
                >
                  <Plus className="h-4 w-4" />
                  Hard Skill
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Onboarding banner ────────────────────────────────────────── */}
        {onboardingMode && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-violet-500/20 bg-violet-500/5 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between"
          >
            <div>
              <p className="font-semibold text-foreground">Completa tu registro profesional</p>
              <p className="text-sm text-muted-foreground">Agrega tus Hard Skills, Soft Skills y marca tu stack inicial.</p>
            </div>
            <button
              onClick={handleCompleteOnboarding}
              className="shrink-0 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition-colors"
            >
              Finalizar registro
            </button>
          </motion.div>
        )}

        {/* ── Top 3 Skills ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07, type: 'spring', stiffness: 220, damping: 28 }}
          className="rounded-2xl border border-border overflow-hidden bg-card"
        >
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div className="flex items-center gap-2.5">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400/30" />
              <h2 className="text-sm font-semibold text-foreground">Top Skills</h2>
            </div>
            <span className={cn(
              'rounded-full px-2 py-0.5 text-xs font-semibold',
              topSkillsCount >= 3
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                : 'bg-muted text-muted-foreground'
            )}>
              {topSkillsCount}/3
            </span>
          </div>

          <div className="px-5 py-4">
            {orderedTop.length > 0 ? (
              <div className="space-y-2">
                {orderedTop.map((skill, i) => (
                  <motion.div
                    key={skill.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * i, type: 'spring', stiffness: 300, damping: 30 }}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-2.5 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0">
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{skill.skillTag.name}</p>
                        <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[skill.skillTag.category] ?? skill.skillTag.category}</p>
                      </div>
                      <LevelBadge level={skill.level} />
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleMoveTop(skill.id, 'up')}
                        disabled={i === 0}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveTop(skill.id, 'down')}
                        disabled={i === orderedTop.length - 1}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleTop(skill.id)}
                        className="rounded-lg p-1.5 text-amber-500 hover:bg-amber-500/10 transition-colors"
                        aria-label="Quitar de top"
                      >
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-1">
                Marca hasta 3 habilidades como top usando ☆ en las cards de abajo.
              </p>
            )}
          </div>
        </motion.div>

        {/* ── Category filter ──────────────────────────────────────────── */}
        {!isEmpty && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap items-center gap-1.5"
          >
            {['all', ...categories].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={cn(
                  'rounded-xl border px-3 py-1.5 text-xs font-medium transition-all duration-150',
                  filterCategory === cat
                    ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                {cat === 'all' ? 'Todas' : CATEGORY_LABELS[cat] ?? cat}
              </button>
            ))}
            <span className="ml-auto text-xs text-muted-foreground tabular-nums">
              {filtered.length} habilidades
            </span>
          </motion.div>
        )}

        {/* ── Hard Skills matrix ───────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 rounded-2xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : isEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-dashed border-border p-8 text-center"
          >
            <Code2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">Sin habilidades técnicas</p>
            <p className="text-xs text-muted-foreground mb-4">Agrega tu primera hard skill para construir tu matriz de habilidades.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition-colors"
            >
              <Plus className="h-4 w-4" />
              Agregar primera habilidad
            </button>
          </motion.div>
        ) : Object.keys(grouped).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(grouped).map(([category, skills], gi) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: hoveredCategory && hoveredCategory !== category ? 0.35 : 1,
                  y: 0,
                  scale: hoveredCategory && hoveredCategory !== category ? 0.995 : 1,
                }}
                transition={{
                  opacity: { duration: 0.22, ease: 'easeOut' },
                  scale: { duration: 0.22, ease: 'easeOut' },
                  y: { delay: 0.05 * gi, type: 'spring', stiffness: 220, damping: 28 },
                }}
                className="rounded-2xl border border-border bg-card overflow-hidden"
                onMouseEnter={() => setHoveredCategory(category)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
                  <Layers className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {CATEGORY_LABELS[category] ?? category}
                  </h3>
                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">{skills.length}</span>
                </div>
                <div className="p-4 flex flex-wrap gap-2">
                  {skills.map((skill, si) => (
                    <motion.div
                      key={skill.id}
                      layout
                      initial={{ opacity: 0, scale: 0.82, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: 0.04 * si, type: 'spring', stiffness: 420, damping: 28 }}
                      whileHover={{ scale: 1.06, y: -1 }}
                      className="group flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 hover:border-violet-500/40 hover:bg-violet-500/[0.06] hover:shadow-sm transition-colors duration-150"
                    >
                      {skill.isTop && (
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                      )}
                      <Code2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium text-foreground whitespace-nowrap">{skill.skillTag.name}</span>
                      <LevelBadge level={skill.level} />

                      {/* Hover actions */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5">
                        <button
                          onClick={() => openEditHard(skill)}
                          className="rounded-md p-1 text-muted-foreground hover:text-violet-500 hover:bg-violet-500/10 transition-colors"
                          aria-label="Editar nivel"
                          title="Editar nivel"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleToggleTop(skill.id)}
                          className={cn(
                            'rounded-md p-1 transition-colors',
                            skill.isTop
                              ? 'text-amber-500 hover:bg-amber-500/10'
                              : 'text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10'
                          )}
                          aria-label={skill.isTop ? 'Quitar de top' : 'Marcar como top'}
                          title={skill.isTop ? 'Quitar de top' : 'Marcar como top (máx 3)'}
                        >
                          <Star className={cn('h-3 w-3', skill.isTop && 'fill-amber-400')} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ type: 'hard', id: skill.id })}
                          className="rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border px-5 py-10 text-center">
            <Search className="h-7 w-7 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Sin habilidades en esta categoría.</p>
          </div>
        )}

        {/* ── Soft Skills ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, type: 'spring', stiffness: 220, damping: 28 }}
          className="rounded-2xl border border-border bg-card overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-violet-400" />
              <h2 className="text-sm font-semibold text-foreground">Soft Skills</h2>
              <span className="text-xs text-muted-foreground tabular-nums">
                {softSkills.length}
              </span>
            </div>
            <button
              onClick={() => setShowSoftModal(true)}
              className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar
            </button>
          </div>

          {softSkills.length > 0 ? (
            <div className="p-4 grid gap-3 sm:grid-cols-2">
              {softSkills.map((skill, i) => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.04 * i, type: 'spring', stiffness: 300, damping: 28 }}
                  className="group relative rounded-xl border border-border bg-background p-4 hover:border-violet-500/20 hover:bg-violet-500/[0.02] transition-all duration-200"
                >
                  <p className="text-sm font-semibold text-foreground pr-14 leading-snug">{skill.title}</p>
                  {skill.description && (
                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">{skill.description}</p>
                  )}
                  <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditSoft(skill.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:text-violet-500 hover:bg-violet-500/10 transition-colors"
                      aria-label="Editar soft skill"
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ type: 'soft', id: skill.id })}
                      className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      aria-label="Eliminar soft skill"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-8 text-center">
              <Sparkles className="h-7 w-7 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Sin soft skills. Las habilidades blandas complementan tu perfil técnico.</p>
            </div>
          )}
        </motion.div>

      {/* ── Modals (portaled into #portal-root) ─────────────────────────── */}

      {/* Add / Edit Hard Skill */}
      <AnimatePresence>
        {showAddModal && (
          <ModalOverlay onClose={closeAddModal}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-foreground">
                {editingHardSkill ? 'Editar Hard Skill' : t('skills.addSkill', 'Agregar Hard Skill')}
              </h2>
              <button
                onClick={closeAddModal}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">

              {editingHardSkill ? (
                /* Edit mode — show skill name as read-only chip */
                <div className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/40 px-4 py-3">
                  <Code2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium text-foreground flex-1">{editingHardSkill.skillTag.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {CATEGORY_LABELS[editingHardSkill.skillTag.category] ?? editingHardSkill.skillTag.category}
                  </span>
                </div>
              ) : (
                /* Add mode — search */
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input
                      className={cn(inputCls, 'pl-9')}
                      placeholder="Buscar tecnología..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                  </div>

                  {searchResults.length > 0 && (
                    <div className="max-h-44 space-y-0.5 overflow-y-auto rounded-xl border border-border p-1">
                      {searchResults.map(tag => (
                        <button
                          key={tag.id}
                          onClick={() => setSelectedTag(tag)}
                          className={cn(
                            'w-full rounded-lg px-3 py-2 text-left transition-colors text-sm',
                            selectedTag?.id === tag.id
                              ? 'bg-violet-600 text-white'
                              : 'text-foreground hover:bg-accent'
                          )}
                        >
                          <span className="font-medium">{tag.name}</span>
                          <span className="ml-2 opacity-60 text-xs">{CATEGORY_LABELS[tag.category] ?? tag.category}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchQuery && searchResults.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border p-4 space-y-3">
                      <p className="text-sm text-muted-foreground">
                        No se encontró &ldquo;{searchQuery}&rdquo;. Crea una nueva etiqueta:
                      </p>
                      <input
                        className={inputCls}
                        value={newTagName}
                        onChange={e => setNewTagName(e.target.value)}
                        placeholder="Nombre de la etiqueta"
                      />
                      <select
                        className={selectCls}
                        value={newTagCategory}
                        onChange={e => setNewTagCategory(e.target.value as SkillCategory)}
                      >
                        {categories.map(c => (
                          <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {t('skills.selectLevel', 'Nivel de experiencia')}
                </label>
                <select
                  className={selectCls}
                  value={selectedLevel}
                  onChange={e => setSelectedLevel(e.target.value as SkillLevel)}
                >
                  {skillLevels.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={closeAddModal}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  {t('common.cancel', 'Cancelar')}
                </button>
                {editingHardSkill ? (
                  <button
                    onClick={handleAddSkill}
                    className="rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition-colors"
                  >
                    Actualizar
                  </button>
                ) : newTagName.trim() ? (
                  <button
                    onClick={handleCreateAndAdd}
                    disabled={!newTagName.trim()}
                    className="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white transition-colors"
                  >
                    Crear y agregar
                  </button>
                ) : (
                  <button
                    onClick={handleAddSkill}
                    disabled={!selectedTag || !searchQuery.trim()}
                    className="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white transition-colors"
                  >
                    {t('common.add', 'Agregar')}
                  </button>
                )}
              </div>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Add / Edit Soft Skill */}
      <AnimatePresence>
        {showSoftModal && (
          <ModalOverlay onClose={closeSoftModal}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-foreground">
                {editingSoftSkill ? 'Editar Soft Skill' : 'Agregar Soft Skill'}
              </h2>
              <button
                onClick={closeSoftModal}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Título <span className="text-destructive">*</span>
                </label>
                <input
                  className={cn(inputCls, softTitleError && 'border-destructive focus:border-destructive')}
                  value={softSkillTitle}
                  onChange={e => { setSoftSkillTitle(e.target.value); if (e.target.value.trim()) setSoftTitleError(false); }}
                  placeholder="Ej: Liderazgo técnico"
                  autoFocus
                />
                {softTitleError && (
                  <p className="mt-1 text-xs text-destructive">El título es obligatorio</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {t('skills.successCase', 'Caso de éxito')} <span className="text-destructive">*</span>
                </label>
                <textarea
                  className={cn(textareaCls, 'min-h-[90px]', softDescError && 'border-destructive focus:border-destructive')}
                  value={softSkillDesc}
                  onChange={e => { setSoftSkillDesc(e.target.value); if (e.target.value.trim().length >= 10) setSoftDescError(false); }}
                  placeholder="Describe un caso de éxito donde aplicaste esta habilidad (mín. 10 caracteres)..."
                  maxLength={250}
                />
                {softDescError && (
                  <p className="mt-1 text-xs text-destructive">La descripción es obligatoria (mínimo 10 caracteres)</p>
                )}
                <p className="mt-1 text-right text-[11px] text-muted-foreground">{softSkillDesc.length}/250</p>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={closeSoftModal}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  {t('common.cancel', 'Cancelar')}
                </button>
                <button
                  onClick={handleSoftSkill}
                  disabled={softSkillTitle.trim().length < 3 || softSkillDesc.trim().length < 10}
                  className="rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm font-semibold text-white transition-colors"
                >
                  {editingSoftSkill ? 'Actualizar' : t('common.add', 'Agregar')}
                </button>
              </div>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <ModalOverlay onClose={() => setDeleteConfirm(null)}>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20 shrink-0">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Eliminar habilidad</h2>
                <p className="text-sm text-muted-foreground">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="rounded-xl bg-destructive hover:bg-destructive/90 px-4 py-2 text-sm font-semibold text-destructive-foreground transition-colors"
              >
                {t('common.delete', 'Eliminar')}
              </button>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
