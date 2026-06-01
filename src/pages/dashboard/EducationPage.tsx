import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  GraduationCap, CalendarRange, Plus, Pencil, X, Trash2, Building2, Calendar,
  Sparkles, Loader2, Upload, Link as LinkIcon, FileText,
  GripVertical, MapPin, ArrowUpDown, Eye, Check, Award, BookOpen, Percent
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui';
import { useAuthStore } from '@/store/authStore';
import { educationService } from '@/shared/services/educationService';
import type { AcademicRecord } from '@/shared/types/education';

interface FormData {
  institutionName: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  credentialUrl: string;
  educationType: string;
  gpa: string;
  verificationUrl: string;
  institutionLogoUrl: string;
  isVisible: boolean;
}

const EMPTY_FORM: FormData = {
  institutionName: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '',
  isCurrent: false, credentialUrl: '', educationType: 'university', gpa: '',
  verificationUrl: '', institutionLogoUrl: '', isVisible: true,
};


const EDU_TYPES: Record<string, string> = {
  university: 'Universidad',
  master_degree: 'Maestría / Posgrado',
  phd: 'Doctorado (PhD)',
  certification: 'Certificación',
  course: 'Curso',
  bootcamp: 'Bootcamp',
  high_school: 'Secundaria',
};

const toBase64 = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.readAsDataURL(file);
    r.onload = () => res(r.result as string);
    r.onerror = rej;
  });

const fmtDate = (d?: string) => {
  if (!d) return '';
  const dt = new Date(d);
  return new Date(dt.getTime() + dt.getTimezoneOffset() * 60000)
    .toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
};

const isImg = (s?: string) => !!s && (s.startsWith('data:image/') || s.startsWith('http'));
const isPdf = (s?: string) => !!s?.startsWith('data:application/pdf');

const SPRING = { type: 'spring' as const, stiffness: 380, damping: 30 };
const SPRING_MODAL = { type: 'spring' as const, stiffness: 320, damping: 32 };

// ─── Upload zone ─────────────────────────────────────────────────────────────
interface UploadZoneProps {
  value: string;
  uploading: boolean;
  isDragging: boolean;
  hint: string;
  accept: string;
  inputRef: React.RefObject<HTMLInputElement>;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
  onRemove: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function UploadZone({ value, uploading, isDragging, hint, accept, inputRef, onDragOver, onDragLeave, onDrop, onClick, onRemove, onChange }: UploadZoneProps) {
  return (
    <div className="h-36">
      {uploading ? (
        <div className="h-full flex items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : value ? (
        <div className="relative h-full group rounded-xl border border-border bg-muted/30 overflow-hidden">
          {isImg(value) ? (
            <img src={value} alt="Preview" className="h-full w-full object-contain p-2" />
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <FileText className="h-7 w-7 text-primary" />
              <span className="text-xs font-medium text-foreground">
                {isPdf(value) ? 'PDF adjunto' : 'Archivo adjunto'}
              </span>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
            <button type="button" onClick={onRemove}
              className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-white hover:bg-destructive/90 transition-colors">
              Eliminar
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} onClick={onClick}
          className={`h-full flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 bg-muted/30 hover:bg-muted/50'
          }`}
        >
          <Upload className="h-6 w-6 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Subir archivo</p>
            <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
          </div>
          <input ref={inputRef} type="file" accept={accept} onChange={onChange} className="hidden" />
        </div>
      )}
    </div>
  );
}

// ─── Timeline line ────────────────────────────────────────────────────────────
function TimelineLine() {
  return (
    <div className="absolute left-[19px] top-5 bottom-10 w-px overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-border/60" />
      <motion.div
        className="absolute left-0 w-full"
        style={{
          height: '90px',
          background: 'linear-gradient(to bottom, transparent, hsl(var(--primary) / 0.8) 50%, transparent)',
        }}
        animate={{ top: ['-90px', 'calc(100% + 90px)'] }}
        transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 2.2, ease: 'easeInOut' }}
      />
    </div>
  );
}

// ─── Custom checkbox ──────────────────────────────────────────────────────────
function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 select-none" onClick={onChange}>
      <div className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border-2 transition-all duration-150 ${checked ? 'border-primary bg-primary' : 'border-border bg-background hover:border-primary/50'}`}>
        {checked && <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />}
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </label>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 py-16 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
        <GraduationCap className="h-7 w-7 text-primary" />
      </div>
      <h3 className="text-base font-semibold text-foreground">Sin registros académicos</h3>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
        Agrega tu formación para fortalecer tu perfil profesional.
      </p>
      <Button variant="primary" onClick={onAdd} className="mt-6 gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
        <Plus className="h-4 w-4" /> Agregar trayectoria
      </Button>
    </div>
  );
}

// ─── Education card ───────────────────────────────────────────────────────────
interface CardProps {
  rec: AcademicRecord;
  reorderMode: boolean;
  deleteConfirmId: string | null;
  isDeleting: boolean;
  onView: () => void;
  onEdit: () => void;
  onRequestDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

function EducationCard({ rec, reorderMode, deleteConfirmId, isDeleting, onView, onEdit, onRequestDelete, onConfirmDelete, onCancelDelete }: CardProps) {
  const id = rec.academicRecordId || '';
  const isConfirming = deleteConfirmId === id;

  return (
    <motion.article
      layout
      className={`relative rounded-2xl border border-border bg-card/80 transition-colors duration-200 ${!reorderMode ? 'hover:border-primary/25 hover:bg-card cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}
      whileHover={!reorderMode ? { scale: 1.005 } : {}}
      transition={SPRING}
      onClick={!reorderMode && !isConfirming ? onView : undefined}
    >
      <div className="p-4 sm:p-5">
        <div className="flex gap-3">
          {/* Logo */}
          {isImg(rec.institutionLogoUrl ?? '') ? (
            <img src={rec.institutionLogoUrl!} alt={rec.institutionName}
              className="mt-0.5 h-11 w-11 shrink-0 rounded-xl object-contain bg-white p-1 border border-border" />
          ) : (
            <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/15">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground truncate">{rec.degree}</h3>
                  {rec.isCurrent && (
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Cursando
                    </span>
                  )}
                  {rec.educationType && (
                    <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {EDU_TYPES[rec.educationType] || rec.educationType}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-primary truncate mt-0.5">{rec.institutionName}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarRange className="h-3 w-3" />
                    {fmtDate(rec.startDate)} – {rec.isCurrent ? 'Presente' : fmtDate(rec.endDate)}
                  </span>
                  {rec.fieldOfStudy && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <BookOpen className="h-3 w-3" />
                      {rec.fieldOfStudy}
                    </span>
                  )}
                  {rec.gpa && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Percent className="h-3 w-3" />
                      GPA {rec.gpa}
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              {!reorderMode && !isConfirming && (
                <div className="flex shrink-0 items-center gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={onView}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    title="Ver detalle">
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={onEdit}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    title="Editar">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={onRequestDelete}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    title="Eliminar">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {reorderMode && (
                <GripVertical className="h-5 w-5 shrink-0 text-muted-foreground/40 mt-1" />
              )}
            </div>

            {/* Credential indicator */}
            {rec.credentialUrl && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground">
                <FileText className="h-3 w-3 text-primary/70" />
                {isPdf(rec.credentialUrl) ? 'PDF adjunto' : 'Certificado adjunto'}
              </div>
            )}
          </div>
        </div>

        {/* Inline delete confirm */}
        <AnimatePresence>
          {isConfirming && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="mt-3 flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2">
                <p className="text-xs font-medium text-destructive">¿Eliminar este registro?</p>
                <div className="flex gap-2">
                  <button onClick={onCancelDelete}
                    className="rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
                    Cancelar
                  </button>
                  <button onClick={onConfirmDelete} disabled={isDeleting}
                    className="flex items-center gap-1.5 rounded-lg bg-destructive px-2.5 py-1 text-xs font-semibold text-white hover:bg-destructive/90 transition-colors disabled:opacity-60">
                    {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    Eliminar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function EducationPage() {
  const { profile: profile } = useAuthStore();
  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [ordered, setOrdered] = useState<AcademicRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReorderMode, setIsReorderMode] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRec, setEditingRec] = useState<AcademicRecord | null>(null);
  const [detailRec, setDetailRec] = useState<AcademicRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const logoRef = useRef<HTMLInputElement>(null);
  const credRef = useRef<HTMLInputElement>(null);
  const [isDragLogo, setIsDragLogo] = useState(false);
  const [isDragCred, setIsDragCred] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCred, setUploadingCred] = useState(false);

  const portalEl = typeof document !== 'undefined' ? document.getElementById('portal-root') : null;

  const load = async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    try {
      const data = await educationService.getRecords(profile.id);
      const list = Array.isArray(data) ? data : [];
      setRecords(list);
      setOrdered([...list]);
    } catch (e) {
      console.error('[EducationPage]', e);
      setRecords([]);
      setOrdered([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [profile?.id]);

  const openAdd = () => {
    setEditingRec(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setIsFormOpen(true);
  };

  const openEdit = (rec: AcademicRecord) => {
    setEditingRec(rec);
    setForm({
      institutionName: rec.institutionName || '',
      degree: rec.degree || '',
      fieldOfStudy: rec.fieldOfStudy || '',
      startDate: rec.startDate?.toString().split('T')[0] || '',
      endDate: rec.endDate?.toString().split('T')[0] || '',
      isCurrent: rec.isCurrent || false,
      credentialUrl: rec.credentialUrl || '',
      educationType: rec.educationType || 'university',
      gpa: rec.gpa ? String(rec.gpa) : '',
      verificationUrl: rec.verificationUrl || '',
      institutionLogoUrl: rec.institutionLogoUrl || '',
      isVisible: true,
    });
    setErrors({});
    setIsFormOpen(true);
  };

  const closeForm = () => { setIsFormOpen(false); setEditingRec(null); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.institutionName.trim()) e.institutionName = 'Obligatorio';
    if (!form.degree.trim()) e.degree = 'Obligatorio';
    if (!form.startDate) e.startDate = 'Obligatorio';
    if (!form.isCurrent) {
      if (!form.endDate) e.endDate = 'Obligatorio';
      else if (form.startDate && new Date(form.endDate) < new Date(form.startDate))
        e.endDate = 'Anterior al inicio';
    }
    if (form.gpa && (parseFloat(form.gpa) < 0 || parseFloat(form.gpa) > 100))
      e.gpa = 'Entre 0 y 100';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!profile?.id) return;
    if (!validate()) return;
    setIsSaving(true);
    try {
      const payload: any = {
        ...form,
        profileId: profile.id,
        gpa: form.gpa ? parseFloat(form.gpa) : null,
        endDate: form.endDate || null,
      };
      if (editingRec?.academicRecordId) {
        await educationService.updateRecord(profile.id, editingRec.academicRecordId, payload);
        toast.success('Registro académico actualizado');
      } else {
        await educationService.addRecord(profile.id, payload);
        toast.success('Registro académico guardado');
      }
      await load();
      closeForm();
    } catch (e: any) {
      console.error('[EducationPage]', e);
      toast.error(e?.response?.data?.message || e?.message || 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!profile?.id) return;
    setIsDeleting(true);
    try {
      await educationService.deleteRecord(profile.id, id);
      await load();
      setDeleteConfirmId(null);
      if (detailRec?.academicRecordId === id) setDetailRec(null);
      if (editingRec?.academicRecordId === id) closeForm();
      toast.success('Registro eliminado');
    } catch (e: any) {
      console.error('[EducationPage]', e);
      toast.error(e?.response?.data?.message || e?.message || 'Error al eliminar');
    } finally {
      setIsDeleting(false);
    }
  };

  const mkLogoHandler = async (file: File) => {
    const ok = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!ok.includes(file.type)) { setErrors(p => ({ ...p, logo: 'JPG, PNG, SVG o WEBP' })); return; }
    setUploadingLogo(true);
    try {
      const b64 = await toBase64(file);
      setForm(p => ({ ...p, institutionLogoUrl: b64 }));
    } catch (e) { console.error(e); } finally { setUploadingLogo(false); }
  };

  const mkCredHandler = async (file: File) => {
    const ok = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!ok.includes(file.type)) { setErrors(p => ({ ...p, cred: 'PDF, JPG o PNG' })); return; }
    setUploadingCred(true);
    try {
      const b64 = await toBase64(file);
      setForm(p => ({ ...p, credentialUrl: b64 }));
    } catch (e) { console.error(e); } finally { setUploadingCred(false); }
  };

  // Blindaje final del render: aunque el estado quede corrupto por una
  // respuesta no-array, todo el JSX consume este arreglo garantizado.
  const safeRecords = Array.isArray(records) ? records : [];

  // Stats
  const uniqueInstitutions = new Set(safeRecords.map(r => r.institutionName).filter(Boolean)).size;
  let totalYears = 0;
  safeRecords.forEach(r => {
    if (r.startDate) {
      const s = new Date(r.startDate).getTime();
      const en = r.isCurrent || !r.endDate ? Date.now() : new Date(r.endDate).getTime();
      if (en > s) totalYears += (en - s) / (1000 * 60 * 60 * 24 * 365.25);
    }
  });

  const inputCls = (err?: string) =>
    `w-full rounded-xl border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors ${
      err ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'
    }`;

  // ── Form modal (portaled) ─────────────────────────────────────────────────
  const formModal = portalEl ? createPortal(
    <AnimatePresence>
      {isFormOpen && (
        <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <motion.div
            className="absolute inset-0 bg-background/75 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeForm}
          />
          <motion.div
            className="relative flex flex-col w-full sm:max-w-4xl max-h-[95dvh] sm:max-h-[88dvh] overflow-hidden rounded-t-2xl sm:rounded-2xl bg-card border border-border shadow-2xl"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            transition={SPRING_MODAL}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <GraduationCap className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-base font-semibold text-foreground">
                  {editingRec ? 'Editar trayectoria' : 'Nueva trayectoria'}
                </h2>
              </div>
              <button type="button" onClick={closeForm}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-5">

                {/* Institution + Type */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Building2 className="h-3 w-3" /> Institución *
                    </label>
                    <input type="text" value={form.institutionName}
                      onChange={e => setForm(p => ({ ...p, institutionName: e.target.value }))}
                      className={inputCls(errors.institutionName)}
                    />
                    {errors.institutionName && <p className="text-xs text-destructive">{errors.institutionName}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Award className="h-3 w-3" /> Tipo de educación *
                    </label>
                    <select value={form.educationType}
                      onChange={e => setForm(p => ({ ...p, educationType: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary">
                      {Object.entries(EDU_TYPES).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Degree + Field */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <GraduationCap className="h-3 w-3" /> Título / Grado *
                    </label>
                    <input type="text" value={form.degree}
                      onChange={e => setForm(p => ({ ...p, degree: e.target.value }))}
                      className={inputCls(errors.degree)}
                    />
                    {errors.degree && <p className="text-xs text-destructive">{errors.degree}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <BookOpen className="h-3 w-3" /> Área de estudio
                    </label>
                    <input type="text" value={form.fieldOfStudy}
                      onChange={e => setForm(p => ({ ...p, fieldOfStudy: e.target.value }))}
                      className={inputCls()}
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" /> Inicio *
                    </label>
                    <input type="date" value={form.startDate}
                      onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                      onClick={e => (e.currentTarget as any).showPicker?.()}
                      className={`${inputCls(errors.startDate)} cursor-pointer`}
                    />
                    {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" /> Fin
                    </label>
                    <input type="date" value={form.endDate} min={form.startDate}
                      disabled={form.isCurrent}
                      onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                      onClick={e => (e.currentTarget as any).showPicker?.()}
                      className={`${inputCls(errors.endDate)} cursor-pointer disabled:opacity-50`}
                    />
                    {errors.endDate && <p className="text-xs text-destructive">{errors.endDate}</p>}
                  </div>
                </div>

                {/* GPA + Verification URL */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Percent className="h-3 w-3" /> Promedio / GPA
                    </label>
                    <input type="number" step="0.01" min="0" max="100" value={form.gpa}
                      placeholder="Ej: 95.50"
                      onChange={e => setForm(p => ({ ...p, gpa: e.target.value }))}
                      className={inputCls(errors.gpa)}
                    />
                    {errors.gpa && <p className="text-xs text-destructive">{errors.gpa}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <LinkIcon className="h-3 w-3" /> Link de verificación
                    </label>
                    <input type="url" value={form.verificationUrl} placeholder="https://..."
                      onChange={e => setForm(p => ({ ...p, verificationUrl: e.target.value }))}
                      className={inputCls()}
                    />
                  </div>
                </div>

                {/* Checkbox */}
                <div className="flex flex-wrap gap-5">
                  <Checkbox
                    checked={form.isCurrent}
                    onChange={() => setForm(p => ({ ...p, isCurrent: !p.isCurrent, endDate: !p.isCurrent ? '' : p.endDate }))}
                    label="Actualmente estudiando aquí"
                  />
                </div>

                {/* Uploads */}
                <div className="border-t border-border pt-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Archivos adjuntos</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-foreground">Logo institución</p>
                      <UploadZone
                        value={form.institutionLogoUrl} uploading={uploadingLogo} isDragging={isDragLogo}
                        hint="JPG, PNG, SVG, WEBP" accept="image/*" inputRef={logoRef}
                        onDragOver={e => { e.preventDefault(); setIsDragLogo(true); }}
                        onDragLeave={e => { e.preventDefault(); setIsDragLogo(false); }}
                        onDrop={e => { e.preventDefault(); setIsDragLogo(false); if (e.dataTransfer.files[0]) mkLogoHandler(e.dataTransfer.files[0]); }}
                        onClick={() => logoRef.current?.click()}
                        onRemove={() => { setForm(p => ({ ...p, institutionLogoUrl: '' })); if (logoRef.current) logoRef.current.value = ''; }}
                        onChange={e => { if (e.target.files?.[0]) mkLogoHandler(e.target.files[0]); }}
                      />
                      {errors.logo && <p className="text-xs text-destructive">{errors.logo}</p>}
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-foreground">Certificado / Título</p>
                      <UploadZone
                        value={form.credentialUrl} uploading={uploadingCred} isDragging={isDragCred}
                        hint="JPG, PNG, PDF" accept=".pdf,.jpg,.jpeg,.png" inputRef={credRef}
                        onDragOver={e => { e.preventDefault(); setIsDragCred(true); }}
                        onDragLeave={e => { e.preventDefault(); setIsDragCred(false); }}
                        onDrop={e => { e.preventDefault(); setIsDragCred(false); if (e.dataTransfer.files[0]) mkCredHandler(e.dataTransfer.files[0]); }}
                        onClick={() => credRef.current?.click()}
                        onRemove={() => { setForm(p => ({ ...p, credentialUrl: '' })); if (credRef.current) credRef.current.value = ''; }}
                        onChange={e => { if (e.target.files?.[0]) mkCredHandler(e.target.files[0]); }}
                      />
                      {errors.cred && <p className="text-xs text-destructive">{errors.cred}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex shrink-0 items-center justify-between border-t border-border bg-card px-6 py-4">
                <div>
                  {editingRec?.academicRecordId && (
                    <Button type="button" variant="ghost"
                      onClick={() => handleDelete(editingRec.academicRecordId!)}
                      disabled={isDeleting}
                      className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive text-sm">
                      {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      Eliminar
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={closeForm} className="text-sm">Cancelar</Button>
                  <Button type="submit" variant="primary" disabled={isSaving}
                    className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 text-sm">
                    {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Guardar
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    portalEl!
  ) : null;

  // ── Detail panel (portaled) ───────────────────────────────────────────────
  const detailPanel = portalEl ? createPortal(
    <AnimatePresence>
      {detailRec && (
        <div className="absolute inset-0 z-40 flex justify-end">
          <motion.div
            className="absolute inset-0 bg-background/60 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setDetailRec(null)}
          />
          <motion.div
            className="relative flex flex-col w-full sm:w-[520px] max-w-full h-full bg-card border-l border-border shadow-2xl overflow-hidden"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 36 }}
          >
            {/* ── Panel header ── */}
            <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4 bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-3 min-w-0">
                {isImg(detailRec.institutionLogoUrl ?? '') ? (
                  <img src={detailRec.institutionLogoUrl!} alt={detailRec.institutionName}
                    className="h-10 w-10 shrink-0 rounded-xl object-contain bg-white p-1 border border-border shadow-sm" />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate leading-snug">{detailRec.degree}</p>
                  <p className="text-xs text-primary/80 font-medium truncate mt-0.5">{detailRec.institutionName}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1 ml-2">
                <button onClick={() => { setDetailRec(null); openEdit(detailRec); }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title="Editar">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setDetailRec(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title="Cerrar">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto">

              {/* Hero: credential/banner image */}
              {isImg(detailRec.credentialUrl ?? '') && (
                <div className="relative w-full h-44 overflow-hidden bg-muted">
                  <img
                    src={detailRec.credentialUrl!}
                    alt="Certificado / Institución"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
                </div>
              )}

              <div className="p-5 space-y-5">

                {/* Status + type badges */}
                <div className="flex flex-wrap gap-2">
                  {detailRec.isCurrent && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Cursando actualmente
                    </span>
                  )}
                  {detailRec.educationType && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary/80">
                      <Award className="h-3 w-3" />
                      {EDU_TYPES[detailRec.educationType] || detailRec.educationType}
                    </span>
                  )}
                </div>

                {/* Degree info block */}
                <div className="rounded-2xl border border-border bg-muted/30 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/60">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Título / Certificación</p>
                    <p className="text-sm font-semibold text-foreground leading-snug">{detailRec.degree}</p>
                    {detailRec.fieldOfStudy && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                        <BookOpen className="h-3 w-3 shrink-0 text-primary/50" />
                        {detailRec.fieldOfStudy}
                      </p>
                    )}
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Institución</p>
                    <div className="flex items-center gap-2">
                      {isImg(detailRec.institutionLogoUrl ?? '') && (
                        <img src={detailRec.institutionLogoUrl!} alt={detailRec.institutionName}
                          className="h-6 w-6 shrink-0 rounded-md object-contain bg-white p-0.5 border border-border" />
                      )}
                      <p className="text-sm font-medium text-foreground">{detailRec.institutionName}</p>
                    </div>
                  </div>
                </div>

                {/* Meta grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-muted/20 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1">
                      <CalendarRange className="h-3 w-3" /> Período
                    </p>
                    <p className="text-xs font-medium text-foreground leading-relaxed">
                      {fmtDate(detailRec.startDate)}
                      <span className="text-muted-foreground mx-1">→</span>
                      {detailRec.isCurrent ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Presente</span>
                      ) : fmtDate(detailRec.endDate)}
                    </p>
                  </div>

                  {detailRec.gpa ? (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600/70 dark:text-amber-400/70 mb-1.5 flex items-center gap-1">
                        <Percent className="h-3 w-3" /> Promedio / GPA
                      </p>
                      <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{detailRec.gpa}</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1">
                        <Award className="h-3 w-3" /> Modalidad
                      </p>
                      <p className="text-xs font-medium text-foreground">
                        {EDU_TYPES[detailRec.educationType ?? ''] || '—'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Verification URL */}
                {detailRec.verificationUrl && (
                  <a
                    href={detailRec.verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary hover:bg-primary/10 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <LinkIcon className="h-4 w-4 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold">Verificar credencial</p>
                        <p className="text-[11px] text-primary/60 truncate">{detailRec.verificationUrl}</p>
                      </div>
                    </div>
                    <FileText className="h-3.5 w-3.5 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}

                {/* Credential image / PDF */}
                {detailRec.credentialUrl && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Certificado adjunto
                    </p>
                    {isImg(detailRec.credentialUrl) ? (
                      <div className="rounded-xl border border-border overflow-hidden shadow-sm">
                        <img src={detailRec.credentialUrl} alt="Certificado" className="w-full object-cover max-h-56" />
                      </div>
                    ) : isPdf(detailRec.credentialUrl) ? (
                      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/30 p-6">
                        <FileText className="h-10 w-10 text-primary" />
                        <p className="text-sm font-medium text-foreground">Documento PDF</p>
                        <a
                          href={detailRec.credentialUrl}
                          download="certificado.pdf"
                          onClick={e => e.stopPropagation()}
                          className="rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          Descargar PDF
                        </a>
                      </div>
                    ) : null}
                  </div>
                )}

              </div>
            </div>

            {/* ── Panel footer ── */}
            <div className="shrink-0 border-t border-border bg-card/80 backdrop-blur-sm px-5 py-3 flex items-center justify-between gap-2">
              <button
                onClick={() => { setDetailRec(null); openEdit(detailRec); }}
                className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" /> Editar registro
              </button>
              <button
                onClick={() => { setDeleteConfirmId(detailRec.academicRecordId || null); setDetailRec(null); }}
                className="flex items-center gap-2 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Eliminar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    portalEl!
  ) : null;

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className="space-y-6"
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-6 sm:px-8 sm:py-7">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_0%_0%,_hsl(var(--primary)/0.12)_0%,_transparent_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_60%_at_100%_100%,_hsl(var(--primary)/0.06)_0%,_transparent_100%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2.5 max-w-lg">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                Trayectoria académica
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Formación y certificaciones.
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Registra tus títulos, certificaciones y cursos relevantes.
              </p>
            </div>
            <div className="flex flex-row items-center gap-2.5 shrink-0 self-center">
              {[
                { v: String(safeRecords.length), l: 'Títulos' },
                { v: totalYears > 0 ? `${Math.max(1, Math.floor(totalYears))}+` : '0', l: 'Años' },
                { v: String(uniqueInstitutions), l: 'Centros' },
              ].map(s => (
                <motion.div key={s.l} whileHover={{ scale: 1.03 }} transition={SPRING}
                  className="w-[88px] rounded-2xl border border-border bg-background/80 px-3 py-2.5 text-center backdrop-blur">
                  <p className="text-lg font-bold text-foreground tabular-nums leading-none">{s.v}</p>
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground mt-1 truncate whitespace-nowrap overflow-hidden">{s.l}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Toolbar ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            Historial académico
            {safeRecords.length > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {safeRecords.length}
              </span>
            )}
          </h2>
          <div className="flex gap-2">
            {safeRecords.length > 1 && (
              <Button variant="ghost" size="sm"
                onClick={() => { setIsReorderMode(r => !r); if (!isReorderMode) setOrdered([...safeRecords]); }}
                className={`gap-1.5 text-xs ${isReorderMode ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground'}`}>
                <ArrowUpDown className="h-3.5 w-3.5" />
                {isReorderMode ? 'Guardar orden' : 'Reordenar'}
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={openAdd}
              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Agregar
            </Button>
          </div>
        </div>

        {/* ── Timeline ───────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : safeRecords.length === 0 ? (
          <EmptyState onAdd={openAdd} />
        ) : (
          <div className="relative">
            <TimelineLine />

            {isReorderMode ? (
              <Reorder.Group axis="y" values={ordered} onReorder={setOrdered} className="space-y-3">
                {ordered.map((rec) => (
                  <Reorder.Item
                    key={rec.academicRecordId}
                    value={rec}
                    className="flex items-start gap-3"
                  >
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center mt-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <EducationCard
                        rec={rec} reorderMode
                        deleteConfirmId={null} isDeleting={false}
                        onView={() => {}} onEdit={() => {}} onRequestDelete={() => {}}
                        onConfirmDelete={() => {}} onCancelDelete={() => {}}
                      />
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            ) : (
              <div className="space-y-3">
                {(Array.isArray(safeRecords) ? safeRecords : []).map((rec, i) => (
                  <motion.div
                    key={rec.academicRecordId || i}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...SPRING, delay: i * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center mt-1">
                      <motion.div
                        className={`h-2.5 w-2.5 rounded-full border-2 ${rec.isCurrent ? 'border-primary bg-primary' : 'border-border bg-background'}`}
                        animate={rec.isCurrent ? { scale: [1, 1.3, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      />
                    </div>
                    <div className="flex-1 min-w-0 pb-3">
                      <EducationCard
                        rec={rec} reorderMode={false}
                        deleteConfirmId={deleteConfirmId} isDeleting={isDeleting}
                        onView={() => setDetailRec(rec)}
                        onEdit={() => openEdit(rec)}
                        onRequestDelete={() => setDeleteConfirmId(rec.academicRecordId || null)}
                        onConfirmDelete={() => handleDelete(rec.academicRecordId!)}
                        onCancelDelete={() => setDeleteConfirmId(null)}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.section>

      {formModal}
      {detailPanel}
    </>
  );
}
