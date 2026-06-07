import api from '@/shared/api/api';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter, X, Briefcase, ChevronLeft, ChevronRight,
  Heart, MessageSquare, MapPin, Search, SlidersHorizontal,
} from 'lucide-react';
import { useAuthStore } from '@/store';
import { Avatar, Button, EmptyState } from '@/shared/ui';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { cn } from '@/shared/lib/utils';

export interface BackendTalentProfile {
  profileId: string;
  slug: string | null;
  photoUrl: string | null;
  fullName: string;
  professionalTitle: string | null;
  location: string | null;
  countryCode: string | null;
  seniority: string | null;
  bioHeadline: string | null;
  yearsOfExperience: number | null;
  workModality: string | null;
  availabilityStatus: string | null;
  skills: string[];
}

type SeniorityLevel = 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Architect';
type ExperienceRange = '' | '0-2' | '3-5' | '6-10' | '10+';
type StatusType = '' | 'disponible' | 'ocupado' | 'incognito';
type CategoryType = '' | 'Frontend' | 'Backend' | 'DevOps' | 'Data' | 'Mobile' | 'QA' | 'Systems';

const seniorityOptions: { value: SeniorityLevel; label: string }[] = [
  { value: 'Junior', label: 'Junior' },
  { value: 'Mid', label: 'Mid' },
  { value: 'Senior', label: 'Senior' },
  { value: 'Lead', label: 'Lead' },
  { value: 'Architect', label: 'Architect' },
];

const experienceOptions: { value: ExperienceRange; label: string }[] = [
  { value: '0-2', label: '0 – 2 años' },
  { value: '3-5', label: '3 – 5 años' },
  { value: '6-10', label: '6 – 10 años' },
  { value: '10+', label: '10+ años' },
];

const statusOptions: { value: StatusType; label: string }[] = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'ocupado', label: 'Ocupado' },
  { value: 'incognito', label: 'Incógnito' },
];

const categoryOptions: { value: CategoryType; label: string }[] = [
  { value: 'Frontend', label: 'Frontend' },
  { value: 'Backend', label: 'Backend' },
  { value: 'DevOps', label: 'DevOps' },
  { value: 'Data', label: 'Data' },
  { value: 'Mobile', label: 'Mobile' },
  { value: 'QA', label: 'QA' },
  { value: 'Systems', label: 'Systems' },
];

// Convierte un código de país ISO-3166-1-alpha-2 a bandera emoji
function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return '🌐';
  return code.toUpperCase().replace(/./g, char =>
    String.fromCodePoint(127397 + char.charCodeAt(0))
  );
}

// Nombre de país en español según código ISO
const COUNTRY_NAMES: Record<string, string> = {
  BO: 'Bolivia', AR: 'Argentina', CL: 'Chile', PE: 'Perú', CO: 'Colombia',
  MX: 'México', BR: 'Brasil', EC: 'Ecuador', PY: 'Paraguay', UY: 'Uruguay',
  VE: 'Venezuela', US: 'EE.UU.', ES: 'España', DE: 'Alemania', FR: 'Francia',
  GB: 'Reino Unido', CA: 'Canadá', AU: 'Australia', IN: 'India', CN: 'China',
  JP: 'Japón', KR: 'Corea del Sur', RU: 'Rusia', IT: 'Italia', PT: 'Portugal',
  NL: 'Países Bajos', SE: 'Suecia', NO: 'Noruega', FI: 'Finlandia', DK: 'Dinamarca',
  CH: 'Suiza', AT: 'Austria', BE: 'Bélgica', PL: 'Polonia', CZ: 'República Checa',
  HU: 'Hungría', RO: 'Rumania', GR: 'Grecia', TR: 'Turquía', ZA: 'Sudáfrica',
  NG: 'Nigeria', EG: 'Egipto', KE: 'Kenia', PH: 'Filipinas', ID: 'Indonesia',
  MY: 'Malasia', TH: 'Tailandia', SG: 'Singapur', NZ: 'Nueva Zelanda',
};

function getCountryName(code: string): string {
  return COUNTRY_NAMES[code?.toUpperCase()] ?? code;
}

function normalizeText(value: string | null | undefined) {
  if (!value) return '';
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

function getStatusConfig(status: string | null) {
  if (!status) return { label: 'Sin estado', dot: 'bg-muted-foreground/40', badge: 'border-border bg-muted text-muted-foreground' };
  const s = status.toLowerCase();
  if (s.includes('disponible') || s === 'available')
    return { label: 'Disponible', dot: 'bg-emerald-400', badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' };
  if (s.includes('ocupado') || s === 'busy')
    return { label: 'Ocupado', dot: 'bg-red-400', badge: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400' };
  return { label: 'Incógnito', dot: 'bg-amber-400', badge: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400' };
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150 cursor-pointer select-none',
        active
          ? 'border-violet-500 bg-violet-500/15 text-violet-600 dark:text-violet-300 shadow-[0_0_8px_rgba(139,92,246,0.35)]'
          : 'border-border bg-muted text-muted-foreground hover:border-border/80 hover:text-foreground',
      )}
    >
      {label}
    </motion.button>
  );
}


function TalentCard({
  candidate,
  index,
  liked,
  onLike,
  onChat,
}: {
  candidate: BackendTalentProfile;
  index: number;
  liked: boolean;
  onLike: (id: string) => void;
  onChat: (id: string) => void;
}) {
  const navigate = useNavigate();
  const topSkills = candidate.skills?.slice(0, 3) ?? [];
  const status = getStatusConfig(candidate.availabilityStatus);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.3 }}
      whileHover={{ y: -2, boxShadow: '0 0 24px rgba(139,92,246,0.18)' }}
      className="group relative flex h-[340px] flex-col rounded-2xl border border-border bg-card p-5 transition-colors duration-200 hover:border-violet-500/40"
    >
      {/* Action icons */}
      <div className="absolute right-4 top-4 flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => onChat(candidate.profileId)}
          title="Iniciar chat"
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:border-violet-500/60 hover:bg-violet-500/10 hover:text-violet-500"
        >
          <MessageSquare className="h-3.5 w-3.5" />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => onLike(candidate.profileId)}
          title={liked ? 'Quitar me gusta' : 'Dar me gusta'}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-xl border transition-colors',
            liked
              ? 'border-rose-500/60 bg-rose-500/10 text-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
              : 'border-border bg-background text-muted-foreground hover:border-rose-500/60 hover:bg-rose-500/10 hover:text-rose-500',
          )}
        >
          <Heart className={cn('h-3.5 w-3.5', liked && 'fill-rose-500')} />
        </motion.button>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 pr-20">
        <Avatar
          src={candidate.photoUrl || undefined}
          alt={candidate.fullName}
          fallback={candidate.fullName}
          className="h-11 w-11 shrink-0 rounded-full border border-border"
        />
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-bold text-foreground">{candidate.fullName}</h3>
          <p className="truncate text-[13px] font-medium text-violet-500">
            {candidate.professionalTitle ?? 'Profesional'}
          </p>
        </div>
      </div>

      {/* Status + seniority */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
        <span className={cn('rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', status.badge)}>
          {status.label}
        </span>
        {candidate.seniority && (
          <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {candidate.seniority}
          </span>
        )}
        {candidate.countryCode && (
          <span className="text-[13px]" title={getCountryName(candidate.countryCode)}>
            {countryCodeToFlag(candidate.countryCode)}
          </span>
        )}
      </div>

      {/* Bio */}
      <p className="mt-3 line-clamp-2 flex-1 text-[13px] leading-relaxed text-muted-foreground">
        {candidate.bioHeadline ?? 'Sin descripción disponible.'}
      </p>

      {/* Top skills */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {topSkills.map((skill, i) => (
          <span key={i} className="rounded-full bg-muted px-2.5 py-1 text-[12px] font-medium text-foreground">
            {skill}
          </span>
        ))}
        {topSkills.length === 0 && (
          <span className="text-[12px] text-muted-foreground/50">Sin habilidades registradas</span>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-1 text-[12px]">{candidate.location ?? 'Sin ubicación'}</span>
        </div>
        <button
          onClick={() => candidate.slug && navigate(`/p/${candidate.slug}`)}
          disabled={!candidate.slug}
          className="rounded-full bg-violet-600 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Ver
        </button>
      </div>
    </motion.div>
  );
}

export default function TalentDiscoveryPage() {
  const { profile } = useAuthStore();
  const navigate = useNavigate();

  const [talents, setTalents] = useState<BackendTalentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [likePending, setLikePending] = useState<string | null>(null);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [seniorityFilters, setSeniorityFilters] = useState<SeniorityLevel[]>([]);
  const [experienceFilters, setExperienceFilters] = useState<ExperienceRange[]>([]);
  const [statusFilters, setStatusFilters] = useState<StatusType[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<CategoryType[]>([]);
  const [skillFilters, setSkillFilters] = useState<string[]>([]);
  const [countryFilters, setCountryFilters] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  const fetchTalents = useCallback(() => {
    api.get('/v1/talents')
      .then(res => {
        const data = res.data;
        const list: BackendTalentProfile[] = Array.isArray(data) ? data : (data?.data ?? []);
        setTalents(list);
        const codes = [...new Set(list.map(t => t.countryCode).filter(Boolean) as string[])];
        setAvailableCountries(codes);
      })
      .catch(() => setTalents([]))
      .finally(() => setIsLoading(false));
  }, []);

  // Load talents on mount
  useEffect(() => { fetchTalents(); }, [fetchTalents]);

  // Realtime: re-fetch whenever any professional toggles is_published
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel('talent-discovery-portfolio-settings')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'core', table: 'portfolio_settings', filter: undefined },
        () => { fetchTalents(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTalents]);

  // Load liked profiles via RPC (bypasses RLS without needing Supabase JWT)
  useEffect(() => {
    if (!profile?.id || !supabase) return;
    supabase.rpc('get_company_likes', { p_company_id: profile.id })
      .then(({ data }) => {
        if (data) setLikedIds(new Set((data as any[]).map(r => r.basic_profile_id)));
      });
  }, [profile?.id]);

  const toggleMulti = useCallback(<T extends string>(val: T, list: T[], setList: (l: T[]) => void) => {
    setList(list.includes(val) ? list.filter(x => x !== val) : [...list, val]);
  }, []);

  const handleLike = useCallback(async (basicProfileId: string) => {
    if (!profile?.id || likePending || !supabase) return;
    setLikePending(basicProfileId);
    const isLiked = likedIds.has(basicProfileId);
    try {
      if (isLiked) {
        const { error } = await supabase.rpc('remove_like', { p_company_id: profile.id, p_basic_id: basicProfileId });
        if (error) throw error;
        setLikedIds(prev => { const s = new Set(prev); s.delete(basicProfileId); return s; });
        toast.success('Me gusta eliminado');
      } else {
        const { error } = await supabase.rpc('add_like', { p_company_id: profile.id, p_basic_id: basicProfileId });
        if (error) throw error;
        setLikedIds(prev => new Set([...prev, basicProfileId]));
        toast.success('Me gusta guardado');
      }
    } catch {
      toast.error('Error al procesar me gusta');
    } finally {
      setLikePending(null);
    }
  }, [profile?.id, likedIds, likePending]);

  const handleChat = useCallback(async (basicProfileId: string) => {
    if (!profile?.id || !supabase) return;
    try {
      const { data, error } = await supabase.rpc('upsert_chat', { p_company_id: profile.id, p_basic_id: basicProfileId });
      if (error) throw error;
      navigate(`/recruiter/chat/${data}`);
    } catch {
      toast.error('No se pudo abrir el chat');
    }
  }, [profile?.id, navigate]);

  const matchesExperience = (years: number | null, ranges: ExperienceRange[]) => {
    if (ranges.length === 0) return true;
    const y = years ?? 0;
    return ranges.some(r => {
      if (r === '0-2') return y <= 2;
      if (r === '3-5') return y >= 3 && y <= 5;
      if (r === '6-10') return y >= 6 && y <= 10;
      if (r === '10+') return y > 10;
      return true;
    });
  };

  const filteredTalents = useMemo(() => {
    return talents.filter(c => {
      const query = normalizeText(searchQuery);
      if (query && !normalizeText(`${c.fullName} ${c.professionalTitle ?? ''}`).includes(query)) return false;
      if (seniorityFilters.length > 0 && !seniorityFilters.includes(c.seniority as SeniorityLevel)) return false;
      if (!matchesExperience(c.yearsOfExperience, experienceFilters)) return false;
      if (statusFilters.length > 0) {
        const s = normalizeText(c.availabilityStatus);
        const match = statusFilters.some(sf => {
          if (sf === 'disponible') return s.includes('disponible') || s === 'available';
          if (sf === 'ocupado') return s.includes('ocupado') || s === 'busy';
          if (sf === 'incognito') return s.includes('incognito') || s === 'offline';
          return false;
        });
        if (!match) return false;
      }
      if (categoryFilters.length > 0) {
        const inTitle = categoryFilters.some(cat => normalizeText(c.professionalTitle).includes(normalizeText(cat)));
        const inSkills = categoryFilters.some(cat => c.skills?.some(s => normalizeText(s).includes(normalizeText(cat))));
        if (!inTitle && !inSkills) return false;
      }
      if (skillFilters.length > 0) {
        const cSkills = c.skills?.map(s => normalizeText(s)) ?? [];
        if (!skillFilters.every(f => cSkills.some(cs => cs.includes(normalizeText(f))))) return false;
      }
      if (countryFilters.length > 0) {
        if (!c.countryCode || !countryFilters.includes(c.countryCode.toUpperCase())) return false;
      }
      return true;
    });
  }, [talents, searchQuery, seniorityFilters, experienceFilters, statusFilters, categoryFilters, skillFilters, countryFilters]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, seniorityFilters, experienceFilters, statusFilters, categoryFilters, skillFilters, countryFilters]);

  const totalPages = Math.ceil(filteredTalents.length / ITEMS_PER_PAGE);
  const paginatedTalents = filteredTalents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && skillFilters.length < 5 && !skillFilters.includes(trimmed)) {
      setSkillFilters(prev => [...prev, trimmed]);
      setSkillInput('');
    }
  };

  const clearAll = () => {
    setSearchQuery('');
    setSeniorityFilters([]);
    setExperienceFilters([]);
    setStatusFilters([]);
    setCategoryFilters([]);
    setSkillFilters([]);
    setCountryFilters([]);
  };

  const activeFilterCount = seniorityFilters.length + experienceFilters.length + statusFilters.length + categoryFilters.length + skillFilters.length + countryFilters.length;

  return (
    <div className="flex min-h-0 flex-col gap-6">

      {/* Search bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-violet-500 focus:outline-none"
            placeholder="Buscar por nombre o cargo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFiltersOpen(v => !v)}
            className={cn(
              'flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-colors',
              filtersOpen
                ? 'border-violet-500/60 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                : 'border-border bg-background text-muted-foreground hover:border-border/80',
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          <span className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-muted-foreground">
            {filteredTalents.length} perfiles
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">

        {/* Filters panel */}
        <AnimatePresence initial={false}>
          {filtersOpen && (
            <motion.aside
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 288 }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="shrink-0 overflow-hidden lg:w-72"
            >
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-violet-500" />
                    <h2 className="text-sm font-semibold text-foreground">Filtros Avanzados</h2>
                  </div>
                  {activeFilterCount > 0 && (
                    <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      Limpiar todo
                    </button>
                  )}
                </div>

                <div className="space-y-5">

                  {/* Seniority */}
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nivel</label>
                    <div className="flex flex-wrap gap-1.5">
                      {seniorityOptions.map(o => (
                        <FilterChip key={o.value} label={o.label} active={seniorityFilters.includes(o.value)}
                          onClick={() => toggleMulti(o.value, seniorityFilters, setSeniorityFilters)} />
                      ))}
                    </div>
                  </div>

                  {/* Experience */}
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Experiencia</label>
                    <div className="flex flex-wrap gap-1.5">
                      {experienceOptions.map(o => (
                        <FilterChip key={o.value} label={o.label} active={experienceFilters.includes(o.value as ExperienceRange)}
                          onClick={() => toggleMulti(o.value as ExperienceRange, experienceFilters, setExperienceFilters)} />
                      ))}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Disponibilidad</label>
                    <div className="flex flex-wrap gap-1.5">
                      {statusOptions.map(o => (
                        <FilterChip key={o.value} label={o.label} active={statusFilters.includes(o.value as StatusType)}
                          onClick={() => toggleMulti(o.value as StatusType, statusFilters, setStatusFilters)} />
                      ))}
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tipo de perfil</label>
                    <div className="flex flex-wrap gap-1.5">
                      {categoryOptions.map(o => (
                        <FilterChip key={o.value} label={o.label} active={categoryFilters.includes(o.value as CategoryType)}
                          onClick={() => toggleMulti(o.value as CategoryType, categoryFilters, setCategoryFilters)} />
                      ))}
                    </div>
                  </div>

                  {/* País — desplegable cargado dinámicamente de la DB */}
                  {availableCountries.length > 0 && (
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">País</label>
                      <select
                        value={countryFilters[0] ?? ''}
                        onChange={e => {
                          const val = e.target.value;
                          setCountryFilters(val ? [val] : []);
                        }}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-violet-500 focus:outline-none"
                      >
                        <option value="">Todos los países</option>
                        {availableCountries.map(code => (
                          <option key={code} value={code.toUpperCase()}>
                            {countryCodeToFlag(code)} {getCountryName(code)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Skills */}
                  <div>
                    <label className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span>Skills</span>
                      <span>{skillFilters.length}/5</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 rounded-lg border border-border bg-background p-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-violet-500 focus:outline-none"
                        placeholder="Ej: React, Java..."
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') addSkill(); }}
                      />
                      <button
                        onClick={addSkill}
                        className="rounded-lg border border-border bg-muted px-3 text-xs text-muted-foreground hover:border-violet-500/50 hover:text-violet-500 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    {skillFilters.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {skillFilters.map(s => (
                          <span key={s} className="flex items-center gap-1 rounded-full border border-violet-500/40 bg-violet-500/10 px-2.5 py-0.5 text-xs text-violet-600 dark:text-violet-300">
                            {s}
                            <button onClick={() => setSkillFilters(prev => prev.filter(x => x !== s))}>
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Cards grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[340px] animate-pulse rounded-2xl border border-border bg-card" />
              ))}
            </div>
          ) : filteredTalents.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-12">
              <EmptyState
                title="Sin coincidencias"
                description="Ajusta los filtros para encontrar más perfiles."
                icon={Briefcase}
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {paginatedTalents.map((candidate, idx) => (
                  <TalentCard
                    key={candidate.profileId}
                    candidate={candidate}
                    index={idx}
                    liked={likedIds.has(candidate.profileId)}
                    onLike={handleLike}
                    onChat={handleChat}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-4">
                  <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className="flex items-center gap-1">
                    <ChevronLeft className="h-4 w-4" /> Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página <span className="font-bold text-foreground">{currentPage}</span> de {totalPages}
                  </span>
                  <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    className="flex items-center gap-1">
                    Siguiente <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
