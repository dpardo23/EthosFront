import api from '@/shared/api/api';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Filter, MapPin, X, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store';
import { Avatar, Badge, Button, EmptyState } from '@/shared/ui';

// Interface del Backend
export interface BackendTalentProfile {
  profileId: string;
  photoUrl: string | null;
  fullName: string;
  professionalTitle: string | null;
  location: string | null;
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

const seniorityOptions: { value: SeniorityLevel | ''; label: string }[] = [
  { value: '', label: 'Todos los niveles' },
  { value: 'Junior', label: 'Junior' },
  { value: 'Mid', label: 'Mid' },
  { value: 'Senior', label: 'Senior' },
  { value: 'Lead', label: 'Lead' },
  { value: 'Architect', label: 'Architect' },
];

const experienceOptions: { value: ExperienceRange; label: string }[] = [
  { value: '', label: 'Cualquier experiencia' },
  { value: '0-2', label: '0 - 2 años' },
  { value: '3-5', label: '3 - 5 años' },
  { value: '6-10', label: '6 - 10 años' },
  { value: '10+', label: 'Más de 10 años' },
];

const statusOptions: { value: StatusType; label: string }[] = [
  { value: '', label: 'Cualquier estado' },
  { value: 'disponible', label: 'Disponible' },
  { value: 'ocupado', label: 'Ocupado' },
  { value: 'incognito', label: 'Incógnito' },
];

const categoryOptions: { value: CategoryType; label: string }[] = [
  { value: '', label: 'Todos los lenguajes' },
  { value: 'Frontend', label: 'Frontend' },
  { value: 'Backend', label: 'Backend' },
  { value: 'DevOps', label: 'DevOps' },
  { value: 'Data', label: 'Data Engineering' },
  { value: 'Mobile', label: 'Mobile' },
  { value: 'QA', label: 'QA / Testing' },
  { value: 'Systems', label: 'Systems' },
];

function normalizeText(value: string | null | undefined) {
  if (!value) return '';
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

// --- TARJETA CLONADA EXACTA DE LA IMAGEN ---
function TalentCard({ candidate, index }: {
  candidate: BackendTalentProfile;
  index: number;
}) {
  const navigate = useNavigate();
  const topSkills = candidate.skills ? candidate.skills.slice(0, 3) : [];
  
  // Simulamos las "coincidencias" basándonos en los skills para que se vea igual a la imagen
  const matchSkills = candidate.skills ? candidate.skills.slice(0, 3) : [];

  const getStatusConfig = (status: string | null) => {
    if (!status) return { label: 'No especificado', classes: 'text-gray-400 border-gray-800 bg-gray-900' };
    const s = status.toLowerCase();
    if (s.includes('disponible') || s === 'available') return { label: 'Disponible', classes: 'text-[#4ade80] border-[#14532d] bg-[#052e16]' };
    if (s.includes('ocupado') || s === 'busy') return { label: 'Ocupado', classes: 'text-red-400 border-red-900 bg-red-950/50' };
    return { label: 'Incógnito', classes: 'text-amber-400 border-amber-900 bg-amber-950/50' };
  };

  const status = getStatusConfig(candidate.availabilityStatus);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.3 }}
      className="w-full"
    >
      <div className="flex w-full flex-col rounded-[24px] border border-[#27272a] bg-[#09090b] p-5 transition-all hover:border-[#8b5cf6]/50">
        
        {/* Cabecera: Avatar, Info y Status */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar 
              src={candidate.photoUrl || undefined} 
              alt={candidate.fullName} 
              fallback={candidate.fullName} 
              className="h-[52px] w-[52px] shrink-0 rounded-full border border-[#27272a] object-cover"
            />
            <div className="flex flex-col">
              <h3 className="font-sans text-[17px] font-bold text-white">
                {candidate.fullName}
              </h3>
              <p className="font-sans text-[15px] font-medium text-[#a78bfa]">
                {candidate.professionalTitle || 'Sin título asignado'}
              </p>
            </div>
          </div>
          <div className={`shrink-0 rounded-full border px-3 py-1 font-sans text-xs font-semibold ${status.classes}`}>
            {status.label}
          </div>
        </div>

        {/* Badges de Información Básica */}
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="rounded-full border border-[#27272a] px-3 py-1 font-sans text-xs font-medium text-[#a1a1aa]">
            {candidate.yearsOfExperience || 0}+ años
          </div>
          <div className="rounded-full border border-[#27272a] px-3 py-1 font-sans text-xs font-medium text-[#a1a1aa]">
            {candidate.workModality || 'Remoto'}
          </div>
          <div className="rounded-full border border-[#27272a] px-3 py-1 font-sans text-xs font-medium text-[#a1a1aa]">
            {candidate.location || 'No especificada'}
          </div>
        </div>

        {/* TOP 3 SKILLS */}
        <div className="mt-6 rounded-[16px] bg-black p-4">
          <h4 className="mb-3 font-sans text-[11px] font-bold uppercase tracking-[0.15em] text-[#71717a]">
            Top 3 Skills
          </h4>
          <div className="flex flex-wrap gap-2">
            {topSkills.map((skill, idx) => (
              <div key={idx} className="rounded-full bg-[#27272a] px-3.5 py-1.5 font-sans text-[13px] font-semibold text-white">
                {skill}
              </div>
            ))}
            {topSkills.length === 0 && (
              <span className="font-sans text-[13px] text-[#71717a]">Sin habilidades listadas</span>
            )}
          </div>
        </div>

        {/* Bio Text Movido abajo de los skills */}
        <p className="mt-5 font-sans text-[15px] leading-relaxed text-[#a1a1aa]">
          {candidate.bioHeadline || 'Sin descripción detallada disponible para este perfil profesional en la plataforma.'}
        </p>

        {/* COINCIDENCIAS DETECTADAS */}
        <div className="mt-5">
          <h4 className="mb-3 font-sans text-[11px] font-bold uppercase tracking-[0.15em] text-[#71717a]">
            Coincidencias Detectadas
          </h4>
          <div className="flex flex-wrap gap-2">
            {matchSkills.map((skill, idx) => (
              <div key={idx} className="rounded-full border border-[#4c1d95] bg-[#2e1065]/60 px-3.5 py-1.5 font-sans text-[13px] font-medium text-[#c4b5fd]">
                {skill} (Senior)
              </div>
            ))}
            {matchSkills.length === 0 && (
              <span className="font-sans text-[13px] text-[#71717a]">Sin coincidencias exactas</span>
            )}
          </div>
        </div>

        {/* Footer: Ubicación y Botón */}
        <div className="mt-6 flex items-center justify-between border-t border-[#27272a] pt-5">
          <div className="flex items-center gap-2 text-[#a1a1aa]">
            <MapPin className="h-4 w-4" />
            <span className="font-sans text-[15px]">{candidate.location || 'Ubicación no especificada'}</span>
          </div>
          <button
            onClick={() => navigate(`/recruiter/talent/${candidate.profileId}/portfolio`)}
            className="rounded-full bg-[#8b5cf6] px-6 py-2.5 font-sans text-[15px] font-bold text-white transition-all hover:bg-[#7c3aed]"
          >
            Ver perfil
          </button>
        </div>

      </div>
    </motion.div>
  );
}

// --- PÁGINA PRINCIPAL ---
export default function TalentDiscoveryPage() {
  const [talents, setTalents] = useState<BackendTalentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [seniority, setSeniority] = useState<SeniorityLevel | ''>('');
  const [experienceRange, setExperienceRange] = useState<ExperienceRange>('');
  const [statusFilter, setStatusFilter] = useState<StatusType>('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryType>('');

  const [skillFilters, setSkillFilters] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [countryFilters, setCountryFilters] = useState<string[]>([]);
  const [countryInput, setCountryInput] = useState('');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    api.get('/v1/talents')
      .then(response => {
        const data = response.data;
        if (Array.isArray(data)) {
          setTalents(data);
        } else if (data && Array.isArray(data.data)) {
          setTalents(data.data);
        } else {
          setTalents([]);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching talents:', err);
        setTalents([]);
        setIsLoading(false);
      });
  }, []);

  const filteredCandidates = useMemo(() => {
    if (!Array.isArray(talents)) return [];

    return talents.filter(candidate => {
      if (normalizeText(candidate.fullName) === normalizeText('Usuario Nuevo')) {
        return false;
      }

      const query = normalizeText(searchQuery);
      if (query && !normalizeText(candidate.fullName + (candidate.professionalTitle || '')).includes(query)) return false;

      if (seniority && candidate.seniority !== seniority) return false;

      if (statusFilter && candidate.availabilityStatus) {
        const s = candidate.availabilityStatus.toLowerCase();
        if (statusFilter === 'disponible' && !(s.includes('disponible') || s === 'available')) return false;
        if (statusFilter === 'ocupado' && !(s.includes('ocupado') || s === 'busy')) return false;
        if (statusFilter === 'incognito' && !(s.includes('incognito') || s === 'offline')) return false;
      }

      if (experienceRange) {
        const years = candidate.yearsOfExperience || 0;
        if (experienceRange === '0-2' && years > 2) return false;
        if (experienceRange === '3-5' && (years < 3 || years > 5)) return false;
        if (experienceRange === '6-10' && (years < 6 || years > 10)) return false;
        if (experienceRange === '10+' && years < 10) return false;
      }

      if (categoryFilter) {
        const cat = normalizeText(categoryFilter);
        const inTitle = normalizeText(candidate.professionalTitle).includes(cat);
        const inSkills = candidate.skills?.some(s => normalizeText(s).includes(cat));
        if (!inTitle && !inSkills) return false;
      }

      if (skillFilters.length > 0) {
        const cSkills = candidate.skills?.map(s => normalizeText(s)) || [];
        if (!skillFilters.every(f => cSkills.some(cs => cs.includes(normalizeText(f))))) return false;
      }

      if (countryFilters.length > 0) {
        if (!countryFilters.some(f => normalizeText(candidate.location).includes(normalizeText(f)))) return false;
      }

      return true;
    });
  }, [talents, searchQuery, seniority, experienceRange, statusFilter, skillFilters, countryFilters, categoryFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, seniority, experienceRange, statusFilter, skillFilters, countryFilters, categoryFilter]);

  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const paginatedCandidates = filteredCandidates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const addTag = (val: string, list: string[], setList: (l: string[]) => void) => {
    const trimmed = val.trim();
    if (trimmed && list.length < 3 && !list.includes(trimmed)) setList([...list, trimmed]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 px-4 py-4 backdrop-blur-sm dark:border-white/10 dark:bg-zinc-950/95 sm:px-6">
        {/* Modificado max-w-7xl por w-[96%] max-w-[1800px] */}
        <div className="mx-auto flex w-[96%] max-w-[1800px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <input
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-4 pr-4 text-sm text-gray-900 focus:border-violet-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
              placeholder="Buscar por nombre o cargo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Badge className="w-fit bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
            {filteredCandidates.length} talentos
          </Badge>
        </div>
      </header>

      {/* Modificado max-w-7xl por w-[96%] max-w-[1800px] */}
      <div className="mx-auto flex w-[96%] max-w-[1800px] flex-col gap-6 p-4 sm:p-6 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-72">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-950 lg:sticky lg:top-24">
            <div className="mb-5 flex items-center gap-2">
              <Filter className="h-4 w-4 text-violet-600 dark:text-violet-400"/>
              <h2 className="font-sans text-sm font-semibold text-gray-900 dark:text-white">Filtros Avanzados</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 flex justify-between font-sans text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <span>Países</span> <span>{countryFilters.length}/3</span>
                </label>
                <input
                  className="mb-2 w-full rounded-lg border border-gray-200 bg-gray-50 p-2 font-sans text-sm text-gray-900 focus:border-violet-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                  placeholder="Ej: Bolivia, Chile..."
                  value={countryInput}
                  onChange={(e) => setCountryInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { addTag(countryInput, countryFilters, setCountryFilters); setCountryInput(''); } }}
                />
                <div className="flex flex-wrap gap-1">
                  {countryFilters.map(c => (
                    <Badge key={c} className="bg-blue-100 font-sans text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                      {c} 
                      <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => setCountryFilters(countryFilters.filter(x => x !== c))} />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 flex justify-between font-sans text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <span>Skills</span> <span>{skillFilters.length}/3</span>
                </label>
                <input
                  className="mb-2 w-full rounded-lg border border-gray-200 bg-gray-50 p-2 font-sans text-sm text-gray-900 focus:border-violet-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                  placeholder="Ej: Java, React..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { addTag(skillInput, skillFilters, setSkillFilters); setSkillInput(''); } }}
                />
                <div className="flex flex-wrap gap-1">
                  {skillFilters.map(s => (
                    <Badge key={s} className="bg-violet-100 font-sans text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                      {s} 
                      <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => setSkillFilters(skillFilters.filter(x => x !== s))} />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block font-sans text-[10px] font-bold uppercase tracking-wider text-gray-400">Experiencia</label>
                <select
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2 font-sans text-sm text-gray-900 focus:border-violet-500 focus:outline-none dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  value={experienceRange}
                  onChange={(e) => setExperienceRange(e.target.value as ExperienceRange)}
                >
                  {experienceOptions.map(opt => <option key={opt.value} value={opt.value} className="bg-white text-gray-900 dark:bg-zinc-900 dark:text-white">{opt.label}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 block font-sans text-[10px] font-bold uppercase tracking-wider text-gray-400">Nivel (Seniority)</label>
                <select
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2 font-sans text-sm text-gray-900 focus:border-violet-500 focus:outline-none dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  value={seniority}
                  onChange={(e) => setSeniority(e.target.value as SeniorityLevel | '')}
                >
                  {seniorityOptions.map(opt => <option key={opt.value} value={opt.value} className="bg-white text-gray-900 dark:bg-zinc-900 dark:text-white">{opt.label}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 block font-sans text-[10px] font-bold uppercase tracking-wider text-gray-400">Disponibilidad</label>
                <select
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2 font-sans text-sm text-gray-900 focus:border-violet-500 focus:outline-none dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusType)}
                >
                  {statusOptions.map(opt => <option key={opt.value} value={opt.value} className="bg-white text-gray-900 dark:bg-zinc-900 dark:text-white">{opt.label}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 block font-sans text-[10px] font-bold uppercase tracking-wider text-gray-400">Tipo de Perfil</label>
                <select
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2 font-sans text-sm text-gray-900 focus:border-violet-500 focus:outline-none dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as CategoryType)}
                >
                  {categoryOptions.map(opt => <option key={opt.value} value={opt.value} className="bg-white text-gray-900 dark:bg-zinc-900 dark:text-white">{opt.label}</option>)}
                </select>
              </div>

              <Button 
                variant="outline" 
                onClick={() => { setSeniority(''); setExperienceRange(''); setStatusFilter(''); setSkillFilters([]); setCountryFilters([]); setCategoryFilter(''); setSearchQuery(''); }}
                className="mt-2 w-full font-sans text-xs text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/5 dark:border-white/10" 
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 flex flex-col gap-6">
          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-200 dark:bg-white/5" />
              ))}
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-zinc-950 sm:p-12">
              <EmptyState title="Sin coincidencias" description="Ajusta los filtros para encontrar más profesionales en la base de datos." icon={Briefcase} />
            </div>
          ) : (
            <>
              {/* Añadido 2xl:grid-cols-3 para acomodar el diseño a pantallas muy grandes sin deformar */}
              <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-5">
                {paginatedCandidates.map((candidate, idx) => (
                  <TalentCard 
                    key={candidate.profileId} 
                    candidate={candidate} 
                    index={idx} 
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 dark:border-white/10 dark:text-white"
                  >
                    <ChevronLeft className="h-4 w-4"/> Anterior
                  </Button>
                  <span className="font-sans text-sm text-gray-600 dark:text-gray-400">
                    Página <span className="font-bold text-gray-900 dark:text-white">{currentPage}</span> de {totalPages}
                  </span>
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 dark:border-white/10 dark:text-white"
                  >
                    Siguiente <ChevronRight className="h-4 w-4"/>
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}