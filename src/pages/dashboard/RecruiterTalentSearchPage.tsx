import { useEffect, useMemo, useState, type ElementType } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Filter,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '@/store';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Select,
  Skeleton,
} from '@/shared/ui';
import { recruiterTalentProfiles } from '@/shared/mocks/recruiterTalent';

type SkillScope = 'all' | 'hard' | 'soft';
type LevelFilter = '' | 'Junior' | 'Mid' | 'Senior';
type WorkModeFilter = '' | 'Remoto' | 'Hibrido' | 'Presencial';
type AvailabilityFilter = '' | 'Disponible' | 'Entrevistas' | 'Explorando';

const RESULTS_PER_PAGE = 10;
const smartSearches = ['React', 'Java', 'JavaScript', 'Python', 'AWS', 'Cobol'];

const scopeOptions = [
  { value: 'all', label: 'Todas las habilidades' },
  { value: 'hard', label: 'Solo hard skills' },
  { value: 'soft', label: 'Solo soft skills' },
];

const levelOptions = [
  { value: '', label: 'Todos los niveles' },
  { value: 'Junior', label: 'Junior' },
  { value: 'Mid', label: 'Mid' },
  { value: 'Senior', label: 'Senior' },
];

const workModeOptions = [
  { value: '', label: 'Cualquier modalidad' },
  { value: 'Remoto', label: 'Remoto' },
  { value: 'Hibrido', label: 'Hibrido' },
  { value: 'Presencial', label: 'Presencial' },
];

const availabilityOptions = [
  { value: '', label: 'Cualquier disponibilidad' },
  { value: 'Disponible', label: 'Disponible' },
  { value: 'Entrevistas', label: 'En entrevistas' },
  { value: 'Explorando', label: 'Explorando' },
];

const locationOptions = [
  { value: '', label: 'Todas las ubicaciones' },
  ...Array.from(
    new Set(
      recruiterTalentProfiles
        .map((profile) => profile.user.location)
        .filter((loc): loc is string => !!loc) // Filtra valores undefined o vacíos
    )
  ).map((location) => ({
    value: location,
    label: location,
  })),
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function getCandidateMatches(candidate: (typeof recruiterTalentProfiles)[number], query: string, scope: SkillScope) {
  const normalizedQuery = normalizeText(query);
  const candidateText = normalizeText(
    [
      candidate.user.name,
      candidate.user.profession,
      candidate.user.headline,
      candidate.summary,
      candidate.expectedRole,
      candidate.user.location,
    ]
      .filter(Boolean)
      .join(' ')
  );

  const hardMatches =
    scope === 'soft'
      ? []
      : candidate.hardSkills.filter((skill) =>
        normalizeText(`${skill.name} ${skill.category} ${skill.level}`).includes(normalizedQuery)
      );
  const softMatches =
    scope === 'hard'
      ? []
      : candidate.softSkills.filter((skill) => normalizeText(skill).includes(normalizedQuery));

  const hasTextMatch = normalizedQuery ? candidateText.includes(normalizedQuery) : true;
  const hasSkillMatch = hardMatches.length > 0 || softMatches.length > 0;

  return {
    hardMatches,
    softMatches,
    matchesQuery: normalizedQuery ? hasTextMatch || hasSkillMatch : true,
  };
}

export default function RecruiterTalentSearchPage() {
  const { user } = useAuthStore();
  const [searchDraft, setSearchDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [scope, setScope] = useState<SkillScope>('all');
  const [level, setLevel] = useState<LevelFilter>('');
  const [workMode, setWorkMode] = useState<WorkModeFilter>('');
  const [availability, setAvailability] = useState<AvailabilityFilter>('');
  const [location, setLocation] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCandidates, setVisibleCandidates] = useState(recruiterTalentProfiles);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const filteredCandidates = useMemo(() => {
    return recruiterTalentProfiles.filter((candidate) => {
      const { hardMatches, softMatches, matchesQuery } = getCandidateMatches(
        candidate,
        searchQuery,
        scope
      );

      if (!matchesQuery) {
        return false;
      }

      if (level) {
        const relevantHardSkills = searchQuery ? hardMatches : candidate.hardSkills;
        if (!relevantHardSkills.some((skill) => skill.level === level)) {
          return false;
        }
      }

      if (workMode && candidate.workMode !== workMode) {
        return false;
      }

      if (availability && candidate.availability !== availability) {
        return false;
      }

      if (location && candidate.user.location !== location) {
        return false;
      }

      if (scope === 'soft' && searchQuery && softMatches.length === 0) {
        return false;
      }

      if (scope === 'hard' && searchQuery && hardMatches.length === 0) {
        return false;
      }

      return true;
    });
  }, [availability, level, location, scope, searchQuery, workMode]);

  useEffect(() => {
    setIsLoading(true);
    const timeout = window.setTimeout(() => {
      setVisibleCandidates(filteredCandidates);
      setIsLoading(false);
    }, 420);

    return () => window.clearTimeout(timeout);
  }, [filteredCandidates]);

  useEffect(() => {
    setCurrentPage(1);
  }, [availability, level, location, scope, searchQuery, workMode]);

  const totalPages = Math.max(1, Math.ceil(visibleCandidates.length / RESULTS_PER_PAGE));
  const currentResults = visibleCandidates.slice(
    (currentPage - 1) * RESULTS_PER_PAGE,
    currentPage * RESULTS_PER_PAGE
  );
  const firstResult = visibleCandidates.length === 0 ? 0 : (currentPage - 1) * RESULTS_PER_PAGE + 1;
  const lastResult = Math.min(currentPage * RESULTS_PER_PAGE, visibleCandidates.length);
  const activeFilterCount = [level, workMode, availability, location].filter(Boolean).length;
  const seniorTalentCount = recruiterTalentProfiles.filter((candidate) =>
    candidate.hardSkills.some((skill) => skill.level === 'Senior')
  ).length;
  const remoteReadyCount = recruiterTalentProfiles.filter(
    (candidate) => candidate.workMode === 'Remoto'
  ).length;

  const handleSearch = (value?: string) => {
    const nextQuery = (value ?? searchDraft).trim();
    setSearchDraft(nextQuery);
    setSearchQuery(nextQuery);
  };

  const clearFilters = () => {
    setScope('all');
    setLevel('');
    setWorkMode('');
    setAvailability('');
    setLocation('');
    setSearchDraft('');
    setSearchQuery('');
  };

  return (
    <div className="w-full max-w-full space-y-4 overflow-x-hidden p-4 md:space-y-6 md:p-6 bg-gray-50 dark:bg-black min-h-screen">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 via-white to-violet-50 md:rounded-[2rem] dark:border-white/10 dark:bg-gradient-to-br dark:from-zinc-950 dark:via-black dark:to-violet-950/20"
      >
        <div className="grid gap-6 px-4 py-6 md:px-6 md:py-7 lg:grid-cols-[1.25fr_0.75fr] lg:px-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-600 dark:border-violet-500/30 dark:bg-black/50 dark:text-violet-400">
              <Sparkles className="h-3.5 w-3.5" />
              Dashboard de reclutador
            </div>
            <div>
              <h1 className="max-w-3xl text-2xl font-semibold tracking-tight text-black sm:text-3xl lg:text-4xl dark:text-white">
                Encuentra talento por habilidades, seniority y contexto real de trabajo
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600 sm:text-base dark:text-gray-400">
                Busca perfiles profesionales por hard skills, soft skills y nivel de dominio. Esta
                version usa resultados estaticos para que puedas evaluar el apartado del reclutador
                desde ya.
              </p>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleSearch();
              }}
              className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm md:rounded-[1.5rem] dark:border-white/10 dark:bg-zinc-950"
            >
              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <Input
                    value={searchDraft}
                    onChange={(event) => setSearchDraft(event.target.value)}
                    placeholder="Busca por React, Java, liderazgo, AWS..."
                    className="h-12 rounded-xl border border-gray-200 bg-gray-50 pl-11 text-sm text-black placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-violet-500 md:rounded-2xl dark:border-white/10 dark:bg-black dark:text-white dark:placeholder:text-gray-500"
                  />
                </div>
                <Button type="submit" className="h-12 rounded-xl px-6 md:rounded-2xl bg-violet-600 text-white hover:bg-violet-700">
                  Buscar talento
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                  Sugerencias
                </span>
                {smartSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleSearch(term)}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-black transition-colors hover:border-violet-500/40 hover:text-violet-600 dark:border-white/10 dark:bg-black/40 dark:text-white dark:hover:border-violet-500/50 dark:hover:text-violet-400"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <RecruiterStatCard
              icon={Users}
              label="Talento disponible"
              value={String(recruiterTalentProfiles.length)}
              helper="Perfiles estaticos listos para explorar"
            />
            <RecruiterStatCard
              icon={Star}
              label="Perfiles senior"
              value={String(seniorTalentCount)}
              helper="Con al menos una skill en nivel Senior"
            />
            <RecruiterStatCard
              icon={Zap}
              label="Remote ready"
              value={String(remoteReadyCount)}
              helper="Perfiles abiertos a colaboracion remota"
            />
          </div>
        </div>
      </motion.section>

      {/* Mobile Filter Button */}
      <div className="lg:hidden">
        <Button
          onClick={() => setShowMobileFilters(true)}
          variant="outline"
          className="w-full gap-2 rounded-xl border border-gray-200 bg-white text-black dark:border-white/10 dark:bg-zinc-950 dark:text-white"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setShowMobileFilters(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto border-l border-gray-200 bg-white p-6 shadow-xl lg:hidden dark:border-white/10 dark:bg-zinc-950"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-black dark:text-white">Filtros de busqueda</h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <Select
                  label="Tipo de coincidencia"
                  value={scope}
                  options={scopeOptions}
                  onChange={(event) => setScope(event.target.value as SkillScope)}
                />
                <Select
                  label="Nivel de dominio"
                  value={level}
                  options={levelOptions}
                  onChange={(event) => setLevel(event.target.value as LevelFilter)}
                />
                <Select
                  label="Modalidad"
                  value={workMode}
                  options={workModeOptions}
                  onChange={(event) => setWorkMode(event.target.value as WorkModeFilter)}
                />
                <Select
                  label="Disponibilidad"
                  value={availability}
                  options={availabilityOptions}
                  onChange={(event) => setAvailability(event.target.value as AvailabilityFilter)}
                />
                <Select
                  label="Ubicacion"
                  value={location}
                  options={locationOptions}
                  onChange={(event) => setLocation(event.target.value)}
                />
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-white/10 mt-4">
                  <Button variant="outline" className="flex-1 rounded-xl border-gray-200 text-black dark:border-white/20 dark:text-white" onClick={clearFilters}>
                    Limpiar
                  </Button>
                  <Button className="flex-1 rounded-xl bg-violet-600 text-white hover:bg-violet-700" onClick={() => setShowMobileFilters(false)}>
                    Aplicar
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[300px_1fr]">
        {/* Desktop Filter Sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden space-y-4 lg:block"
        >
          <Card className="rounded-2xl border border-gray-200 bg-white p-0 dark:border-white/10 dark:bg-zinc-950">
            <CardHeader className="border-b border-gray-200 px-5 py-5 dark:border-white/10">
              <CardTitle className="flex items-center gap-2 text-base text-black dark:text-white">
                <SlidersHorizontal className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                Filtros de busqueda
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Refina la lista por tipo de habilidad, seniority y contexto laboral.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-5 py-5">
              <Select
                label="Tipo de coincidencia"
                value={scope}
                options={scopeOptions}
                onChange={(event) => setScope(event.target.value as SkillScope)}
              />
              <Select
                label="Nivel de dominio"
                value={level}
                options={levelOptions}
                onChange={(event) => setLevel(event.target.value as LevelFilter)}
              />
              <Select
                label="Modalidad"
                value={workMode}
                options={workModeOptions}
                onChange={(event) => setWorkMode(event.target.value as WorkModeFilter)}
              />
              <Select
                label="Disponibilidad"
                value={availability}
                options={availabilityOptions}
                onChange={(event) => setAvailability(event.target.value as AvailabilityFilter)}
              />
              <Select
                label="Ubicacion"
                value={location}
                options={locationOptions}
                onChange={(event) => setLocation(event.target.value)}
              />

              <Button variant="outline" className="w-full rounded-xl border-gray-200 text-black hover:bg-gray-50 dark:border-white/20 dark:text-white dark:hover:bg-white/10" onClick={clearFilters}>
                Limpiar busqueda
              </Button>

              <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600 dark:bg-black/50 dark:text-gray-400">
                <p className="font-medium text-black dark:text-white">Tip de reclutamiento</p>
                <p className="mt-2 leading-6">
                  Prueba combinaciones como <span className="font-medium text-black dark:text-white">Java</span>{' '}
                  + <span className="font-medium text-black dark:text-white">Senior</span> o{' '}
                  <span className="font-medium text-black dark:text-white">liderazgo</span> en soft skills para
                  validar el flujo de filtrado.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.aside>

        <section className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between md:rounded-[1.75rem] md:p-5 dark:border-white/10 dark:bg-zinc-950"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-black sm:text-xl dark:text-white">Resultados</h2>
                <Badge variant="secondary" className="bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
                  {isLoading ? 'Buscando...' : `${visibleCandidates.length} candidatos`}
                </Badge>
                {activeFilterCount > 0 && (
                  <Badge variant="outline" className="border-gray-200 text-gray-600 dark:border-white/20 dark:text-gray-300">
                    {activeFilterCount} filtros activos
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchQuery
                  ? `Busqueda actual: "${searchQuery}"`
                  : 'Mostrando el universo base de talento disponible para reclutamiento.'}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500 dark:bg-black/50 dark:text-gray-400">
              {isLoading
                ? 'Actualizando resultados...'
                : `Mostrando ${firstResult}-${lastResult} de ${visibleCandidates.length} perfiles`}
            </div>
          </motion.div>

          {isLoading ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="rounded-xl border-gray-200 bg-white p-4 md:rounded-[1.75rem] md:p-5 dark:border-white/10 dark:bg-zinc-950">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-16 w-16 rounded-xl md:rounded-2xl" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-5 w-44" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                  <div className="mt-5 flex gap-2">
                    <Skeleton className="h-7 w-24 rounded-full" />
                    <Skeleton className="h-7 w-28 rounded-full" />
                    <Skeleton className="h-7 w-20 rounded-full" />
                  </div>
                </Card>
              ))}
            </div>
          ) : visibleCandidates.length === 0 ? (
            <Card className="rounded-xl border border-gray-200 bg-white md:rounded-[1.75rem] dark:border-white/10 dark:bg-zinc-950">
              <EmptyState
                icon={Briefcase}
                title="No se encontraron candidatos con esta habilidad."
                description="Intenta usar terminos mas generales o elimina algunos filtros."
                action={{
                  label: 'Limpiar filtros',
                  onClick: clearFilters,
                }}
              />
            </Card>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                {currentResults.map((candidate, index) => {
                  const { hardMatches, softMatches } = getCandidateMatches(candidate, searchQuery, scope);
                  const topSkills = candidate.hardSkills
                    .filter((skill) => skill.isTop)
                    .sort((left, right) => (left.topOrder ?? Number.MAX_SAFE_INTEGER) - (right.topOrder ?? Number.MAX_SAFE_INTEGER))
                    .slice(0, 3)
                    .map((skill) => skill.name);
                  const matchBadges = [
                    ...hardMatches.map((skill) => `${skill.name} (${skill.level})`),
                    ...softMatches,
                  ].slice(0, 3);

                  return (
                    <motion.article
                      key={candidate.user.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                    >
                      <Card className="h-full rounded-xl border border-gray-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-violet-500/40 hover:shadow-lg md:rounded-[1.75rem] md:p-5 dark:border-white/10 dark:bg-[#050505] dark:hover:border-violet-500/50">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 gap-3 sm:gap-4">
                            <Avatar
                              src={candidate.user.avatar}
                              alt={candidate.user.name}
                              fallback={candidate.user.name}
                              size="xl"
                              className="shrink-0 rounded-xl md:rounded-[1.5rem]"
                            />
                            <div className="min-w-0">
                              <h3 className="text-base font-semibold text-black sm:text-lg dark:text-white">
                                {candidate.user.name}
                              </h3>
                              <p className="text-sm font-medium text-violet-600 dark:text-violet-400">{candidate.expectedRole}</p>
                              <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
                                {candidate.user.headline}
                              </p>
                            </div>
                          </div>

                          <Badge
                            variant={candidate.availability === 'Disponible' ? 'success' : 'secondary'}
                            className="shrink-0"
                          >
                            {candidate.availability}
                          </Badge>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2 text-xs sm:mt-5">
                          <Badge variant="outline" className="border-gray-200 text-gray-600 dark:border-white/20 dark:text-gray-400">{candidate.experienceYears}+ anos</Badge>
                          <Badge variant="outline" className="border-gray-200 text-gray-600 dark:border-white/20 dark:text-gray-400">{candidate.workMode}</Badge>
                          <Badge variant="outline" className="border-gray-200 text-gray-600 dark:border-white/20 dark:text-gray-400">{candidate.user.location}</Badge>
                        </div>

                        <div className="mt-4 rounded-xl bg-gray-50 p-3 sm:mt-5 sm:p-4 dark:bg-black/50">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                            Top 3 skills
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 sm:mt-3">
                            {topSkills.map((skill) => (
                              <Badge key={skill} variant="secondary" className="bg-white text-black dark:bg-zinc-800 dark:text-white">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="line-clamp-3 text-sm leading-6 text-gray-600 dark:text-gray-400">{candidate.summary}</p>
                        </div>

                        <div className="mt-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                            Coincidencias detectadas
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 sm:mt-3">
                            {matchBadges.length > 0 ? (
                              matchBadges.map((match) => (
                                <Badge key={match} className="bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
                                  {match}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                Vista general del perfil sin filtro especifico.
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:mt-6 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
                          <div className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <MapPin className="h-4 w-4" />
                            {candidate.user.location}
                          </div>
                          <Link to={`/p/${candidate.user.slug}`}>
                            <Button className="w-full rounded-xl bg-violet-600 text-white hover:bg-violet-700 sm:w-auto md:rounded-2xl">Ver perfil</Button>
                          </Link>
                        </div>
                      </Card>
                    </motion.article>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between md:rounded-[1.75rem] dark:border-white/10 dark:bg-zinc-950">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Pagina {currentPage} de {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                      className="border-gray-200 text-black dark:border-white/20 dark:text-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                      <Button
                        key={page}
                        variant={page === currentPage ? 'primary' : 'outline'}
                        className={`min-w-10 ${page !== currentPage ? 'border-gray-200 text-black dark:border-white/20 dark:text-white' : 'bg-violet-600 text-white'}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      disabled={currentPage === totalPages}
                      className="border-gray-200 text-black dark:border-white/20 dark:text-white"
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function RecruiterStatCard({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: ElementType;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <Card className="rounded-xl border border-gray-200 bg-white p-4 md:rounded-[1.5rem] md:p-5 dark:border-white/10 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold text-black sm:text-3xl dark:text-white">{value}</p>
          <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">{helper}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 sm:h-12 sm:w-12 sm:rounded-2xl dark:bg-violet-500/20 dark:text-violet-400">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}