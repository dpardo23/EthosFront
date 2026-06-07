import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  GraduationCap,
  Upload,
  FileText,
  Trash2,
  Calendar,
  Building2,
  BookOpen,
  Image as ImageIcon,
  ExternalLink,
  Loader2,
  Download,
  ChevronDown,
  ChevronUp,
  ZoomIn,
} from 'lucide-react';
import { Button } from '@/shared/ui';
import type { AcademicRecord } from '@/shared/types';
import api from '@/shared/api/api';

interface AcademicRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AcademicRecord | null;
  onSave: (record: Omit<AcademicRecord, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>) => void;
  onDelete?: () => void;
}

const maxDescriptionChars = 500;

const API_BASE = (import.meta.env.VITE_API_URL as string) || '';
const resolveUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
  const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

async function uploadFile(file: File): Promise<{ url: string; name: string; size: number }> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/uploads', formData, {
    timeout: 120_000,
    headers: { 'Content-Type': undefined },
  });
  const payload = response.data;
  if (!payload?.success || !payload.data) {
    throw new Error(payload?.message || 'Error subiendo archivo.');
  }
  return payload.data;
}

export function AcademicRecordModal({
  isOpen,
  onClose,
  record,
  onSave,
  onDelete,
}: AcademicRecordModalProps) {
  const credentialInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    institutionName: '',
    degree: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
    credentialUrl: '',
    institutionLogoUrl: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // credential (PDF or image)
  const [credentialFileName, setCredentialFileName] = useState<string | null>(null);
  const [credentialUploading, setCredentialUploading] = useState(false);
  const [credentialPreview, setCredentialPreview] = useState<string | null>(null); // only for images
  const [pdfOpen, setPdfOpen] = useState(false);
  const [imageLightbox, setImageLightbox] = useState(false);

  // logo (image)
  const [logoUploading, setLogoUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const isEditMode = !!record;

  useEffect(() => {
    if (record) {
      setFormData({
        institutionName: record.institutionName,
        degree: record.degree,
        fieldOfStudy: record.fieldOfStudy || '',
        startDate: record.startDate,
        endDate: record.endDate || '',
        isCurrent: record.isCurrent,
        description: record.description || '',
        credentialUrl: record.credentialUrl || '',
        institutionLogoUrl: record.institutionLogoUrl || '',
      });
      const credUrl = record.credentialUrl || '';
      if (credUrl) {
        setCredentialFileName(credUrl.split('/').pop() || 'certificado');
        const resolved = resolveUrl(credUrl);
        const isImage = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(credUrl);
        setCredentialPreview(isImage ? resolved : null);
      } else {
        setCredentialFileName(null);
        setCredentialPreview(null);
      }
    } else {
      setFormData({
        institutionName: '',
        degree: '',
        fieldOfStudy: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        description: '',
        credentialUrl: '',
        institutionLogoUrl: '',
      });
      setCredentialFileName(null);
      setCredentialPreview(null);
    }
    setErrors({});
  }, [record, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.institutionName.trim()) newErrors.institutionName = 'La institución es obligatoria';
    if (!formData.degree.trim()) newErrors.degree = 'El título es obligatorio';
    if (!formData.startDate) newErrors.startDate = 'La fecha de inicio es obligatoria';
    if (!formData.isCurrent && !formData.endDate)
      newErrors.endDate = 'La fecha de fin es obligatoria si no es actual';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave({
        institutionName: formData.institutionName,
        degree: formData.degree,
        fieldOfStudy: formData.fieldOfStudy,
        startDate: formData.startDate,
        endDate: formData.isCurrent ? undefined : formData.endDate,
        isCurrent: formData.isCurrent,
        description: formData.description,
        credentialUrl: formData.credentialUrl || undefined,
        institutionLogoUrl: formData.institutionLogoUrl || undefined,
      });
    }
  };

  // ── Credential upload (PDF or image) ─────────────────────────────────────

  const handleCredentialFile = async (file: File) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setErrors((prev) => ({ ...prev, credential: 'Solo PDF, JPG, PNG o WEBP' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, credential: 'El archivo supera los 5 MB' }));
      return;
    }
    setErrors((prev) => { const { credential: _, ...rest } = prev; return rest; });
    setCredentialUploading(true);
    try {
      const result = await uploadFile(file);
      setFormData((prev) => ({ ...prev, credentialUrl: result.url }));
      setCredentialFileName(result.name);
      const isImage = file.type.startsWith('image/');
      setCredentialPreview(isImage ? resolveUrl(result.url) : null);
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, credential: err.message || 'Error subiendo archivo' }));
    } finally {
      setCredentialUploading(false);
    }
  };

  const removeCredential = () => {
    setCredentialFileName(null);
    setCredentialPreview(null);
    setFormData((prev) => ({ ...prev, credentialUrl: '' }));
    if (credentialInputRef.current) credentialInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleCredentialFile(file);
  };

  // ── Logo upload (image only) ──────────────────────────────────────────────

  const handleLogoFile = async (file: File) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      setErrors((prev) => ({ ...prev, logo: 'Solo JPG, PNG, WEBP o SVG' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, logo: 'El archivo supera los 5 MB' }));
      return;
    }
    setErrors((prev) => { const { logo: _, ...rest } = prev; return rest; });
    setLogoUploading(true);
    try {
      const result = await uploadFile(file);
      setFormData((prev) => ({ ...prev, institutionLogoUrl: result.url }));
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, logo: err.message || 'Error subiendo logo' }));
    } finally {
      setLogoUploading(false);
    }
  };

  const removeLogo = () => {
    setFormData((prev) => ({ ...prev, institutionLogoUrl: '' }));
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const isPdf = (url: string) => /\.pdf(\?|$)/i.test(url) || url.includes('/pdf');

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      {isEditMode ? 'Editar Trayectoria' : 'Nueva Trayectoria'}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Registro académico o certificación
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="space-y-4">

                  {/* Institution Name + Logo */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      Institución *
                    </label>
                    <div className="flex items-center gap-3">
                      {/* Logo preview / upload */}
                      <div className="relative shrink-0">
                        {formData.institutionLogoUrl ? (
                          <div className="group relative h-12 w-12 rounded-xl border border-border overflow-hidden">
                            <img
                              src={resolveUrl(formData.institutionLogoUrl) ?? ''}
                              alt="Logo"
                              className="h-full w-full object-contain bg-muted/30"
                            />
                            <button
                              type="button"
                              onClick={removeLogo}
                              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                            >
                              <X className="h-4 w-4 text-white" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            disabled={logoUploading}
                            className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-50"
                            title="Subir logo de institución"
                          >
                            {logoUploading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ImageIcon className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.svg"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoFile(f); }}
                          className="hidden"
                        />
                      </div>

                      <input
                        type="text"
                        value={formData.institutionName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, institutionName: e.target.value }))}
                        placeholder="Universidad Nacional Autónoma de México"
                        className={`flex-1 rounded-xl border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                          errors.institutionName ? 'border-destructive' : 'border-border focus:border-primary'
                        }`}
                      />
                    </div>
                    {errors.institutionName && (
                      <p className="text-xs text-destructive">{errors.institutionName}</p>
                    )}
                    {errors.logo && (
                      <p className="text-xs text-destructive">{errors.logo}</p>
                    )}
                  </div>

                  {/* Degree */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      Título / Grado *
                    </label>
                    <input
                      type="text"
                      value={formData.degree}
                      onChange={(e) => setFormData((prev) => ({ ...prev, degree: e.target.value }))}
                      placeholder="Ingeniero de Sistemas"
                      className={`w-full rounded-xl border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                        errors.degree ? 'border-destructive' : 'border-border focus:border-primary'
                      }`}
                    />
                    {errors.degree && <p className="text-xs text-destructive">{errors.degree}</p>}
                  </div>

                  {/* Field of Study */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      Área de Estudio
                    </label>
                    <input
                      type="text"
                      value={formData.fieldOfStudy}
                      onChange={(e) => setFormData((prev) => ({ ...prev, fieldOfStudy: e.target.value }))}
                      placeholder="Software Development"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Date Range */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        Fecha de Inicio *
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                        className={`w-full rounded-xl border bg-background px-4 py-3 text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                          errors.startDate ? 'border-destructive' : 'border-border focus:border-primary'
                        }`}
                      />
                      {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        Fecha de Fin
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                        disabled={formData.isCurrent}
                        className={`w-full rounded-xl border bg-background px-4 py-3 text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 ${
                          errors.endDate ? 'border-destructive' : 'border-border focus:border-primary'
                        }`}
                      />
                      {errors.endDate && <p className="text-xs text-destructive">{errors.endDate}</p>}
                    </div>
                  </div>

                  {/* Is Current */}
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.isCurrent}
                      onChange={(e) => setFormData((prev) => ({ ...prev, isCurrent: e.target.checked }))}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">Actualmente estudiando aquí</span>
                  </label>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="flex items-center justify-between text-sm font-medium text-foreground">
                      <span>Descripción</span>
                      <span className="text-xs text-muted-foreground">
                        {formData.description.length}/{maxDescriptionChars}
                      </span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe tus logros, proyectos relevantes o especialización..."
                      rows={4}
                      maxLength={maxDescriptionChars}
                      className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Credential upload (PDF or image) */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Subir Título o Certificado (PDF / Imagen)
                    </label>

                    {credentialUploading ? (
                      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Subiendo archivo…</span>
                      </div>
                    ) : credentialFileName ? (
                      <div className="overflow-hidden rounded-xl border border-border bg-muted/10">
                        {/* File row */}
                        <div className="flex items-center gap-3 p-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50">
                            <FileText className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12px] font-medium text-foreground">{credentialFileName}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {credentialPreview ? 'Imagen' : 'PDF'}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            {/* Descargar */}
                            {formData.credentialUrl && (
                              <a
                                href={resolveUrl(formData.credentialUrl) ?? '#'}
                                download={credentialFileName}
                                onClick={(e) => e.stopPropagation()}
                                title="Descargar"
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </a>
                            )}
                            {/* Toggle preview (imagen: lightbox / PDF: expand) */}
                            {credentialPreview ? (
                              <button
                                type="button"
                                onClick={() => setImageLightbox(true)}
                                title="Ver imagen completa"
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              >
                                <ZoomIn className="h-3.5 w-3.5" />
                              </button>
                            ) : formData.credentialUrl && isPdf(formData.credentialUrl) ? (
                              <button
                                type="button"
                                onClick={() => setPdfOpen((v) => !v)}
                                title={pdfOpen ? 'Cerrar vista previa' : 'Vista previa'}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              >
                                {pdfOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              </button>
                            ) : null}
                            {/* Eliminar */}
                            <button
                              type="button"
                              onClick={removeCredential}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                              title="Eliminar"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Thumbnail de imagen (clic → lightbox) */}
                        {credentialPreview && (
                          <div
                            className="border-t border-border cursor-zoom-in"
                            onClick={() => setImageLightbox(true)}
                          >
                            <img
                              src={credentialPreview}
                              alt="Vista previa del certificado"
                              className="w-full max-h-48 object-contain bg-muted/30"
                            />
                          </div>
                        )}

                        {/* PDF inline expandible */}
                        {!credentialPreview && formData.credentialUrl && isPdf(formData.credentialUrl) && pdfOpen && (
                          <div className="border-t border-border bg-background">
                            <iframe
                              src={`${resolveUrl(formData.credentialUrl)}#toolbar=0&navpanes=0`}
                              title="Vista previa PDF"
                              className="h-[480px] w-full rounded-b-xl"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => credentialInputRef.current?.click()}
                        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/30 px-4 py-8 transition-colors ${
                          isDragging
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }`}
                      >
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Arrastra un archivo o{' '}
                          <span className="text-primary">haz clic para seleccionar</span>
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">PDF, JPG, PNG o WEBP · máx. 5 MB</p>
                        <input
                          ref={credentialInputRef}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCredentialFile(f); }}
                          className="hidden"
                        />
                      </div>
                    )}

                    {errors.credential && (
                      <p className="text-xs text-destructive">{errors.credential}</p>
                    )}
                  </div>

                </div>
              </form>

              {/* Footer */}
              <div className="flex flex-col gap-3 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  {isEditMode && onDelete && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={onDelete}
                      className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </Button>
                  )}
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <Button type="button" variant="ghost" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    onClick={handleSubmit}
                    className="bg-primary-blue hover:bg-primary-blue/90"
                  >
                    Guardar Trayectoria
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    {/* Image lightbox */}
    {imageLightbox && credentialPreview && createPortal(
      <AnimatePresence>
        <motion.div
          key="lightbox-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setImageLightbox(false)}
        >
          {/* Toolbar */}
          <div
            className="mb-3 flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <a
              href={resolveUrl(formData.credentialUrl) ?? '#'}
              download={credentialFileName ?? 'certificado'}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white transition-colors hover:bg-white/20"
              title="Descargar imagen"
            >
              <Download className="h-4 w-4" />
              Descargar
            </a>
            <button
              onClick={() => setImageLightbox(false)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20"
              title="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Image */}
          <motion.img
            key="lightbox-img"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            src={credentialPreview}
            alt={credentialFileName ?? 'Certificado'}
            className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      </AnimatePresence>,
      document.body,
    )}
    </>
  );
}
