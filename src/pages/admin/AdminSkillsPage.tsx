import { useCallback, useEffect, useState } from 'react';
import {
  Code2, Plus, Trash2, Pencil, Search, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle2, CircleSlash, Layers3, Tags,
} from 'lucide-react';
import {
  Badge, Button, Modal, ConfirmDialog, Select, Skeleton, EmptyState, ErrorState,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import {
  adminSkillService,
  type AdminSkillFilters,
  type AdminSkillMetrics,
  type AdminSkillPage,
  type AdminSkillTag,
} from '@/shared/services/adminService';

/**
 * Skill catalog normalization view: real catalog CRUD with usage metrics,
 * multi-select deletion of unused tags and add/edit dialogs.
 */
const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

const CATEGORIES = ['Backend', 'Frontend', 'Data', 'Infrastructure', 'Design', 'Mobile', 'Other'];

const categoryOptions = [
  { value: '', label: 'Todas las categorías' },
  ...CATEGORIES.map((category) => ({ value: category, label: category })),
];

const usageOptions = [
  { value: '', label: 'Todo el catálogo' },
  { value: 'used', label: 'En uso' },
  { value: 'unused', label: 'En desuso' },
];

interface EditorState {
  tag: AdminSkillTag | null;
  name: string;
  category: string;
  isNormalized: boolean;
}

export default function AdminSkillsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [usage, setUsage] = useState('');
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<AdminSkillPage | null>(null);
  const [metrics, setMetrics] = useState<AdminSkillMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters: AdminSkillFilters = {
        search: search || undefined,
        category: category || undefined,
        usage: (usage || undefined) as AdminSkillFilters['usage'],
      };
      const [pageData, metricsData] = await Promise.all([
        adminSkillService.search(filters, page, PAGE_SIZE),
        adminSkillService.getMetrics(),
      ]);
      setResult(pageData);
      setMetrics(metricsData);
      setSelectedIds(new Set());
    } catch {
      setError('No se pudo cargar el catálogo de skills.');
    } finally {
      setIsLoading(false);
    }
  }, [search, category, usage, page]);

  useEffect(() => {
    load();
  }, [load]);

  const items = result?.items ?? [];
  const totalPages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;
  const deletableSelected = items.filter((item) => selectedIds.has(item.id) && item.usageCount === 0);

  const toggleSelect = (tagId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((current) =>
      current.size === items.length ? new Set() : new Set(items.map((item) => item.id)),
    );
  };

  const handleBulkDelete = async () => {
    setActionLoading(true);
    try {
      const outcome = await adminSkillService.deleteUnused([...selectedIds]);
      setNotice(`${outcome.deleted} eliminados · ${outcome.skipped} omitidos por estar en uso`);
      setConfirmDelete(false);
      await load();
    } catch {
      setError('No se pudieron eliminar los skills seleccionados.');
    } finally {
      setActionLoading(false);
    }
  };

  const openCreate = () =>
    setEditor({ tag: null, name: '', category: CATEGORIES[0], isNormalized: true });

  const openEdit = (tag: AdminSkillTag) =>
    setEditor({ tag, name: tag.name, category: tag.category, isNormalized: tag.isNormalized });

  const handleEditorSave = async () => {
    if (!editor || !editor.name.trim()) return;
    setActionLoading(true);
    setEditorError(null);
    try {
      const payload = { name: editor.name.trim(), category: editor.category, isNormalized: editor.isNormalized };
      if (editor.tag) {
        await adminSkillService.update(editor.tag.id, payload);
      } else {
        await adminSkillService.create(payload);
      }
      setEditor(null);
      await load();
    } catch {
      setEditorError(editor.tag ? 'No se pudo actualizar el skill.' : 'Ya existe un skill con ese nombre.');
    } finally {
      setActionLoading(false);
    }
  };

  const metricCards = metrics
    ? [
        { label: 'Total de skills', value: metrics.totalTags, icon: Tags },
        { label: 'Normalizados', value: metrics.normalizedTags, icon: CheckCircle2 },
        { label: 'En uso', value: metrics.usedTags, icon: Code2 },
        { label: 'En desuso', value: metrics.unusedTags, icon: CircleSlash },
        { label: 'Categorías', value: metrics.categories, icon: Layers3 },
      ]
    : [];

  return (
    <div className="flex h-full max-w-full flex-col gap-4 overflow-x-hidden p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-tight text-black dark:text-white md:text-3xl">
            Normalización de Skills
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Catálogo global de hard skills · core.global_skill_tags
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
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
          <Button
            size="sm"
            onClick={openCreate}
            className="bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar skill
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {metricCards.length === 0
          ? Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-20 w-full rounded-xl" />)
          : metricCards.map((card) => (
              <div key={card.label} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-zinc-950">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-500/20 dark:to-purple-500/20">
                  <card.icon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-sans text-lg font-bold leading-tight text-black dark:text-white">{card.value}</p>
                  <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">{card.label}</p>
                </div>
              </div>
            ))}
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 sm:flex-row sm:items-center dark:border-white/10 dark:bg-zinc-950">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar skill por nombre…"
            className="h-10 w-full rounded-lg border border-gray-200 bg-transparent pl-9 pr-3 text-sm text-black outline-none transition-colors focus:border-violet-500 dark:border-white/10 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={category} onChange={(event) => { setCategory(event.target.value); setPage(0); }} options={categoryOptions} className="h-10 min-w-[170px]" />
          <Select value={usage} onChange={(event) => { setUsage(event.target.value); setPage(0); }} options={usageOptions} className="h-10 min-w-[150px]" />
          {selectedIds.size > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmDelete(true)}
              className="border-red-200 bg-transparent text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Eliminar ({selectedIds.size})
            </Button>
          )}
        </div>
      </div>

      {notice && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-xs text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
          {notice}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-zinc-950">
        {error && !result ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <ErrorState title="Error" message={error} onRetry={load} />
          </div>
        ) : isLoading && !result ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <EmptyState icon={Code2} title="Sin skills" description="Ningún skill coincide con los filtros actuales." />
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-zinc-900 dark:text-gray-400">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={items.length > 0 && selectedIds.size === items.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 accent-violet-600"
                      aria-label="Seleccionar todos"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">Skill</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Categoría</th>
                  <th className="px-4 py-3 font-medium">Uso</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Estado</th>
                  <th className="w-16 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {items.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-violet-50/50 dark:hover:bg-violet-500/5">
                    <td className="px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="h-4 w-4 accent-violet-600"
                        aria-label={`Seleccionar ${item.name}`}
                      />
                    </td>
                    <td className="px-4 py-2.5 font-medium text-black dark:text-white">{item.name}</td>
                    <td className="hidden px-4 py-2.5 sm:table-cell">
                      <Badge variant="secondary" className="border-0 bg-violet-100 text-[10px] text-violet-700 dark:bg-violet-500/15 dark:text-violet-400">
                        {item.category}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn('text-xs', item.usageCount > 0 ? 'font-medium text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500')}>
                        {item.usageCount > 0 ? `${item.usageCount} profiles` : 'Sin uso'}
                      </span>
                    </td>
                    <td className="hidden px-4 py-2.5 md:table-cell">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'border-0 text-[10px]',
                          item.isNormalized
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
                        )}
                      >
                        {item.isNormalized ? 'Normalizado' : 'Pendiente'}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => openEdit(item)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-violet-100 hover:text-violet-600 dark:hover:bg-violet-500/10 dark:hover:text-violet-400"
                        aria-label={`Editar ${item.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-white/10">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Página {page + 1} de {totalPages}
            {result ? ` · ${result.total.toLocaleString()} skills` : ''}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0 || isLoading} onClick={() => setPage((current) => Math.max(0, current - 1))} className="border-gray-200 bg-transparent dark:border-white/10">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page + 1 >= totalPages || isLoading} onClick={() => setPage((current) => current + 1)} className="border-gray-200 bg-transparent dark:border-white/10">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={editor != null}
        onClose={() => { setEditor(null); setEditorError(null); }}
        title={editor?.tag ? `Editar skill · ${editor.tag.name}` : 'Agregar skill'}
        size="sm"
      >
        {editor && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Nombre</label>
              <input
                value={editor.name}
                onChange={(event) => setEditor({ ...editor, name: event.target.value })}
                placeholder="Ej. GraphQL"
                className="h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm text-black outline-none transition-colors focus:border-violet-500 dark:border-white/10 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Categoría</label>
              <Select
                value={editor.category}
                onChange={(event) => setEditor({ ...editor, category: event.target.value })}
                options={CATEGORIES.map((value) => ({ value, label: value }))}
                className="h-10 w-full"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={editor.isNormalized}
                onChange={(event) => setEditor({ ...editor, isNormalized: event.target.checked })}
                className="h-4 w-4 accent-violet-600"
              />
              Skill normalizado (catálogo oficial)
            </label>
            {editorError && <p className="text-xs text-red-600 dark:text-red-400">{editorError}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditor(null)} className="border-gray-200 bg-transparent dark:border-white/10">
                Cancelar
              </Button>
              <Button
                size="sm"
                disabled={actionLoading || !editor.name.trim()}
                onClick={handleEditorSave}
                className="bg-gradient-to-r from-violet-600 to-purple-600 text-white"
              >
                {actionLoading ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleBulkDelete}
        loading={actionLoading}
        variant="destructive"
        title="Eliminar skills seleccionados"
        message={`Se eliminarán ${selectedIds.size} skills del catálogo. ${selectedIds.size - deletableSelected.length > 0 ? `${selectedIds.size - deletableSelected.length} están en uso por profiles y serán omitidos automáticamente.` : 'Ninguno está en uso por profiles.'}`}
        confirmLabel="Eliminar"
      />
    </div>
  );
}
