import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Download, ChevronLeft, ChevronRight, Search, Folder, RefreshCw,
} from 'lucide-react';
import { Avatar, Badge, Button, Select, Skeleton, EmptyState, ErrorState } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import {
  adminProfileService,
  type AdminProfileFilters,
  type AdminProfileItem,
  type AdminProfilePage,
} from '@/shared/services/adminService';

/**
 * Admin profile directory: unified, paginated listing of professional and
 * recruiter profiles with dynamic filters and real CSV export.
 */
const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

const roleOptions = [
  { value: '', label: 'Todos los roles' },
  { value: 'professional', label: 'Profesionales' },
  { value: 'recruiter', label: 'Reclutadores' },
];

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'active', label: 'Activos' },
  { value: 'deleted', label: 'Eliminados' },
];

function formatDate(value: string): string {
  const date = new Date(value.replace(' ', 'T'));
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminProfilesPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<AdminProfilePage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filters: AdminProfileFilters = useMemo(
    () => ({ role: role || undefined, status: status || undefined, search: search || undefined }),
    [role, status, search],
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setResult(await adminProfileService.search(filters, page, PAGE_SIZE));
    } catch {
      setError('No se pudieron cargar los profiles.');
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await adminProfileService.exportCsv(filters);
    } catch {
      setError('No se pudo exportar el CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  const totalPages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;
  const items: AdminProfileItem[] = result?.items ?? [];

  return (
    <div className="flex h-full max-w-full flex-col gap-4 overflow-x-hidden p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-tight text-black dark:text-white md:text-3xl">
            Gestión de Perfiles
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {result ? `${result.total.toLocaleString()} profiles encontrados` : 'Directorio unificado de profiles'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={isLoading}
            className="border-gray-200 bg-transparent text-violet-600 hover:bg-violet-50 dark:border-violet-500/30 dark:text-violet-400 dark:hover:bg-violet-500/10"
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')} />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={isExporting || (result?.total ?? 0) === 0}
            className="bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-purple-700"
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Exportando…' : 'Exportar CSV'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 sm:flex-row sm:items-center dark:border-white/10 dark:bg-zinc-950">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por nombre, email, ubicación o empresa…"
            className="h-10 w-full rounded-lg border border-gray-200 bg-transparent pl-9 pr-3 text-sm text-black outline-none transition-colors focus:border-violet-500 dark:border-white/10 dark:text-white"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={role}
            onChange={(event) => { setRole(event.target.value); setPage(0); }}
            options={roleOptions}
            className="h-10 min-w-[160px]"
          />
          <Select
            value={status}
            onChange={(event) => { setStatus(event.target.value); setPage(0); }}
            options={statusOptions}
            className="h-10 min-w-[150px]"
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-zinc-950">
        {error ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <ErrorState title="Error" message={error} onRetry={load} />
          </div>
        ) : isLoading && !result ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <EmptyState
              icon={Users}
              title="Sin resultados"
              description="Ningún profile coincide con los filtros actuales."
            />
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <table className="hidden w-full text-left text-sm md:table">
              <thead className="sticky top-0 z-10 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-zinc-900 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Profile</th>
                  <th className="px-4 py-3 font-medium">Rol</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Detalle</th>
                  <th className="px-4 py-3 font-medium">Portafolio</th>
                  <th className="px-4 py-3 font-medium">Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {items.map((item, index) => (
                  <motion.tr
                    key={item.profileId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="transition-colors hover:bg-violet-50/50 dark:hover:bg-violet-500/5"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={item.avatarUrl ?? undefined} alt={item.fullName ?? item.email} fallback={item.fullName ?? item.email} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-black dark:text-white">{item.fullName || '—'}</p>
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{item.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'border-0 text-xs',
                          item.role === 'professional'
                            ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300',
                        )}
                      >
                        {item.role === 'professional' ? 'Profesional' : 'Reclutador'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'border-0 text-xs',
                          item.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
                        )}
                      >
                        {item.status === 'active' ? 'Activo' : 'Eliminado'}
                      </Badge>
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-gray-600 dark:text-gray-400">
                      {item.detail || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {item.role === 'professional' ? (
                        <span className={cn(
                          'flex w-fit items-center gap-1.5 text-xs',
                          item.portfolioPublished ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500',
                        )}>
                          <Folder className="h-3.5 w-3.5" />
                          {item.portfolioPublished ? 'Publicado' : 'Privado'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-600">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{formatDate(item.createdAt)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-2 p-3 md:hidden">
              {items.map((item) => (
                <div
                  key={item.profileId}
                  className="rounded-xl border border-gray-200 p-3 dark:border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={item.avatarUrl ?? undefined} alt={item.fullName ?? item.email} fallback={item.fullName ?? item.email} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-black dark:text-white">{item.fullName || '—'}</p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">{item.email}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="border-0 bg-violet-100 text-[10px] text-violet-700 dark:bg-violet-500/15 dark:text-violet-400">
                      {item.role === 'professional' ? 'Profesional' : 'Reclutador'}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'border-0 text-[10px]',
                        item.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
                      )}
                    >
                      {item.status === 'active' ? 'Activo' : 'Eliminado'}
                    </Badge>
                    <span className="ml-auto text-[10px] text-gray-500 dark:text-gray-400">{formatDate(item.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-white/10">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Página {page + 1} de {totalPages}
            {result ? ` · ${result.total.toLocaleString()} profiles` : ''}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0 || isLoading}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              className="border-gray-200 bg-transparent dark:border-white/10"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= totalPages || isLoading}
              onClick={() => setPage((current) => current + 1)}
              className="border-gray-200 bg-transparent dark:border-white/10"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
