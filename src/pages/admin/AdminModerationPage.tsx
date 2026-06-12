import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle, RefreshCw, Trash2, RotateCcw, Eye, Folder, GraduationCap,
  Briefcase, User as ProfileIcon, ChevronLeft, ChevronRight,
} from 'lucide-react';
import {
  Avatar, Badge, Button, Modal, ConfirmDialog, Select, Skeleton, Tabs,
  EmptyState, ErrorState,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import {
  adminModerationService,
  adminProfileService,
  type AdminProfileInspection,
  type AdminProfileItem,
  type AdminProfilePage,
  type AdminRestorableRecordType,
} from '@/shared/services/adminService';

/**
 * Moderation view: clean profile list with soft delete/restore actions and a
 * deep-inspection modal showing portfolio, projects, education and experience
 * records — including soft-deleted ones, restorable by the admin (time-travel).
 */
const PAGE_SIZE = 8;

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

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value.replace(' ', 'T'));
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface RecordRowProps {
  title: string;
  subtitle?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  onRestore: () => void;
  restoring: boolean;
}

function RecordRow({ title, subtitle, createdAt, updatedAt, deletedAt, onRestore, restoring }: RecordRowProps) {
  const isDeleted = deletedAt != null;
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border p-3',
        isDeleted
          ? 'border-red-200 bg-red-50/60 dark:border-red-500/20 dark:bg-red-500/5'
          : 'border-gray-200 dark:border-white/10',
      )}
    >
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm font-medium', isDeleted ? 'text-red-700 line-through dark:text-red-400' : 'text-black dark:text-white')}>
          {title}
        </p>
        {subtitle && <p className="truncate text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
        <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
          Creado {formatDateTime(createdAt)} · Modificado {formatDateTime(updatedAt)}
          {isDeleted && <span className="text-red-500 dark:text-red-400"> · Eliminado {formatDateTime(deletedAt)}</span>}
        </p>
      </div>
      {isDeleted && (
        <Button
          size="sm"
          variant="outline"
          disabled={restoring}
          onClick={onRestore}
          className="shrink-0 border-emerald-300 bg-transparent text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
        >
          <RotateCcw className={cn('mr-1.5 h-3.5 w-3.5', restoring && 'animate-spin')} />
          Restaurar
        </Button>
      )}
    </div>
  );
}

export default function AdminModerationPage() {
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<AdminProfilePage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<AdminProfileItem | null>(null);
  const [inspection, setInspection] = useState<AdminProfileInspection | null>(null);
  const [inspectionLoading, setInspectionLoading] = useState(false);
  const [inspectionTab, setInspectionTab] = useState('resumen');
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const [confirmTarget, setConfirmTarget] = useState<AdminProfileItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setResult(await adminProfileService.search(
        { role: role || undefined, status: status || undefined },
        page,
        PAGE_SIZE,
      ));
    } catch {
      setError('No se pudieron cargar los profiles.');
    } finally {
      setIsLoading(false);
    }
  }, [role, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  const openInspection = async (item: AdminProfileItem) => {
    setSelected(item);
    setInspectionTab('resumen');
    if (item.role !== 'professional') {
      setInspection(null);
      return;
    }
    setInspectionLoading(true);
    try {
      setInspection(await adminModerationService.inspect(item.profileId));
    } catch {
      setInspection(null);
    } finally {
      setInspectionLoading(false);
    }
  };

  const closeInspection = () => {
    setSelected(null);
    setInspection(null);
  };

  const handleRestoreRecord = async (type: AdminRestorableRecordType, recordId: string) => {
    if (!selected) return;
    setRestoringId(recordId);
    try {
      await adminModerationService.restoreRecord(type, recordId);
      setInspection(await adminModerationService.inspect(selected.profileId));
    } catch {
      setError('No se pudo restaurar el registro.');
    } finally {
      setRestoringId(null);
    }
  };

  const handleProfileAction = async () => {
    if (!confirmTarget) return;
    setActionLoading(true);
    try {
      if (confirmTarget.status === 'active') {
        await adminModerationService.softDeleteProfile(confirmTarget.profileId, confirmTarget.role);
      } else {
        await adminModerationService.restoreProfile(confirmTarget.profileId, confirmTarget.role);
      }
      setConfirmTarget(null);
      await load();
    } catch {
      setError('No se pudo completar la acción de moderación.');
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;
  const items = result?.items ?? [];

  const deletedCounts = inspection
    ? inspection.projects.filter((record) => record.deletedAt).length
      + inspection.education.filter((record) => record.deletedAt).length
      + inspection.experience.filter((record) => record.deletedAt).length
    : 0;

  return (
    <div className="flex h-full max-w-full flex-col gap-4 overflow-x-hidden p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-tight text-black dark:text-white md:text-3xl">
            Moderación
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Auditoría de profiles y restauración de registros eliminados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={role} onChange={(event) => { setRole(event.target.value); setPage(0); }} options={roleOptions} className="h-10 min-w-[150px]" />
          <Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(0); }} options={statusOptions} className="h-10 min-w-[140px]" />
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={isLoading}
            className="border-gray-200 bg-transparent text-violet-600 hover:bg-violet-50 dark:border-violet-500/30 dark:text-violet-400 dark:hover:bg-violet-500/10"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-zinc-950">
        {error && !result ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <ErrorState title="Error" message={error} onRetry={load} />
          </div>
        ) : isLoading && !result ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <EmptyState icon={AlertTriangle} title="Sin profiles" description="Ningún profile coincide con los filtros." />
          </div>
        ) : (
          <div className="min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto dark:divide-white/5">
            {items.map((item) => (
              <div
                key={item.profileId}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-violet-50/50 dark:hover:bg-violet-500/5"
              >
                <Avatar src={item.avatarUrl ?? undefined} alt={item.fullName ?? item.email} fallback={item.fullName ?? item.email} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-black dark:text-white">{item.fullName || item.email}</p>
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
                  </div>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">{item.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {item.role === 'professional' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openInspection(item)}
                      className="border-gray-200 bg-transparent text-violet-600 hover:bg-violet-50 dark:border-white/10 dark:text-violet-400 dark:hover:bg-violet-500/10"
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Inspeccionar</span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmTarget(item)}
                    className={cn(
                      'bg-transparent',
                      item.status === 'active'
                        ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10'
                        : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-400 dark:hover:bg-emerald-500/10',
                    )}
                  >
                    {item.status === 'active' ? <Trash2 className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-white/10">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Página {page + 1} de {totalPages}
            {result ? ` · ${result.total.toLocaleString()} profiles` : ''}
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
        isOpen={selected != null}
        onClose={closeInspection}
        title={selected ? `Inspección · ${selected.fullName || selected.email}` : 'Inspección'}
        size="lg"
      >
        {inspectionLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : !inspection || !inspection.profile ? (
          <EmptyState
            icon={ProfileIcon}
            title="Sin datos de inspección"
            description="Este profile no tiene información profesional para inspeccionar."
          />
        ) : (
          <div className="flex flex-col gap-4">
            <Tabs
              tabs={[
                { id: 'resumen', label: 'Resumen', icon: <ProfileIcon className="h-4 w-4" /> },
                { id: 'proyectos', label: `Proyectos (${inspection.projects.length})`, icon: <Folder className="h-4 w-4" /> },
                { id: 'educacion', label: `Educación (${inspection.education.length})`, icon: <GraduationCap className="h-4 w-4" /> },
                { id: 'experiencia', label: `Experiencia (${inspection.experience.length})`, icon: <Briefcase className="h-4 w-4" /> },
              ]}
              activeTab={inspectionTab}
              onChange={setInspectionTab}
            />

            <div className="max-h-[55vh] min-h-[220px] overflow-y-auto pr-1">
              {inspectionTab === 'resumen' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 dark:border-white/10">
                    <Avatar src={inspection.profile.avatarUrl ?? undefined} alt={inspection.profile.fullName ?? ''} fallback={inspection.profile.fullName ?? inspection.profile.email} size="lg" />
                    <div className="min-w-0">
                      <p className="font-medium text-black dark:text-white">{inspection.profile.fullName || '—'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{inspection.profile.email}</p>
                      <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                        Registrado {formatDateTime(inspection.profile.createdAt)} · Última modificación {formatDateTime(inspection.profile.updatedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 p-3 dark:border-white/10">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400">Portafolio</p>
                      <p className="mt-1 text-sm font-medium text-black dark:text-white">
                        {inspection.portfolio ? (inspection.portfolio.isPublished ? 'Publicado' : 'Privado') : 'Sin portafolio'}
                      </p>
                      {inspection.portfolio?.slug && (
                        <p className="truncate text-xs text-violet-600 dark:text-violet-400">/{inspection.portfolio.slug}</p>
                      )}
                    </div>
                    <div className="rounded-xl border border-gray-200 p-3 dark:border-white/10">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400">Vistas</p>
                      <p className="mt-1 text-sm font-medium text-black dark:text-white">{inspection.portfolio?.viewsCount ?? 0}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-3 dark:border-white/10">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400">Registros eliminados</p>
                      <p className={cn('mt-1 text-sm font-medium', deletedCounts > 0 ? 'text-red-600 dark:text-red-400' : 'text-black dark:text-white')}>
                        {deletedCounts}
                      </p>
                    </div>
                  </div>
                  {inspection.profile.bio && (
                    <p className="rounded-xl border border-gray-200 p-3 text-xs text-gray-600 dark:border-white/10 dark:text-gray-400">
                      {inspection.profile.bio}
                    </p>
                  )}
                </div>
              )}

              {inspectionTab === 'proyectos' && (
                <div className="space-y-2">
                  {inspection.projects.length === 0 ? (
                    <EmptyState icon={Folder} title="Sin proyectos" description="Este profile no tiene proyectos registrados." />
                  ) : (
                    inspection.projects.map((record) => (
                      <RecordRow
                        key={record.id}
                        title={record.title}
                        subtitle={[record.category, record.status, record.visibility].filter(Boolean).join(' · ')}
                        createdAt={record.createdAt}
                        updatedAt={record.updatedAt}
                        deletedAt={record.deletedAt}
                        restoring={restoringId === record.id}
                        onRestore={() => handleRestoreRecord('project', record.id)}
                      />
                    ))
                  )}
                </div>
              )}

              {inspectionTab === 'educacion' && (
                <div className="space-y-2">
                  {inspection.education.length === 0 ? (
                    <EmptyState icon={GraduationCap} title="Sin educación" description="Este profile no tiene registros académicos." />
                  ) : (
                    inspection.education.map((record) => (
                      <RecordRow
                        key={record.id}
                        title={record.institution}
                        subtitle={[record.degree, record.fieldOfStudy].filter(Boolean).join(' · ')}
                        createdAt={record.createdAt}
                        updatedAt={record.updatedAt}
                        deletedAt={record.deletedAt}
                        restoring={restoringId === record.id}
                        onRestore={() => handleRestoreRecord('education', record.id)}
                      />
                    ))
                  )}
                </div>
              )}

              {inspectionTab === 'experiencia' && (
                <div className="space-y-2">
                  {inspection.experience.length === 0 ? (
                    <EmptyState icon={Briefcase} title="Sin experiencia" description="Este profile no tiene experiencia laboral registrada." />
                  ) : (
                    inspection.experience.map((record) => (
                      <RecordRow
                        key={record.id}
                        title={`${record.jobTitle} · ${record.companyName}`}
                        subtitle={record.isCurrent ? 'Actualmente trabajando aquí' : [record.startDate, record.endDate].filter(Boolean).join(' → ')}
                        createdAt={record.createdAt}
                        updatedAt={record.updatedAt}
                        deletedAt={record.deletedAt}
                        restoring={restoringId === record.id}
                        onRestore={() => handleRestoreRecord('experience', record.id)}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={confirmTarget != null}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleProfileAction}
        loading={actionLoading}
        variant={confirmTarget?.status === 'active' ? 'destructive' : 'default'}
        title={confirmTarget?.status === 'active' ? 'Eliminar profile' : 'Restaurar profile'}
        message={
          confirmTarget?.status === 'active'
            ? `Se desactivará la cuenta de ${confirmTarget?.fullName || confirmTarget?.email} (soft delete). Su portafolio dejará de ser público. Esta acción es reversible.`
            : `Se reactivará la cuenta de ${confirmTarget?.fullName || confirmTarget?.email} y volverá a estar disponible.`
        }
        confirmLabel={confirmTarget?.status === 'active' ? 'Eliminar' : 'Restaurar'}
      />
    </div>
  );
}
