import { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { Button } from '@/shared/ui';
import type { AcademicRecord } from '@/shared/types';

interface AcademicRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: AcademicRecord | null;
  onSave: (record: Omit<AcademicRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  onDelete?: () => void;
}

const maxDescriptionChars = 500;

export function AcademicRecordModal({
  isOpen,
  onClose,
  record,
  onSave,
  onDelete,
}: AcademicRecordModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    institutionName: '',
    degree: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
    credentialUrl: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isEditMode = !!record;

  useEffect(() => {
    if (record) {
      setFormData({
        institutionName: record.institutionName,
        degree: record.degree,
        fieldOfStudy: record.fieldOfStudy,
        startDate: record.startDate,
        endDate: record.endDate || '',
        isCurrent: record.isCurrent,
        description: record.description || '',
        credentialUrl: record.credentialUrl || '',
      });
      if (record.credentialUrl) {
        setUploadedFileName('certificado.pdf');
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
      });
      setUploadedFileName(null);
    }
    setErrors({});
  }, [record, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.institutionName.trim()) {
      newErrors.institutionName = 'La institucion es obligatoria';
    }
    if (!formData.degree.trim()) {
      newErrors.degree = 'El titulo es obligatorio';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'La fecha de inicio es obligatoria';
    }
    if (!formData.isCurrent && !formData.endDate) {
      newErrors.endDate = 'La fecha de fin es obligatoria si no es actual';
    }

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
        credentialUrl: formData.credentialUrl,
      });
    }
  };

  const handleFileUpload = (file: File) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, file: 'Solo se permiten archivos PDF, JPG o PNG' }));
      return;
    }

    // In a real app, you'd upload to a server and get a URL back
    // For now, we'll just simulate it
    setUploadedFileName(file.name);
    setFormData((prev) => ({
      ...prev,
      credentialUrl: `https://storage.ethoshub.com/credentials/${file.name}`,
    }));
    setErrors((prev) => {
      const { file: _, ...rest } = prev;
      return rest;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const removeFile = () => {
    setUploadedFileName(null);
    setFormData((prev) => ({ ...prev, credentialUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
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
                      Registro academico o certificacion
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
                  {/* Institution Name */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      Institucion *
                    </label>
                    <input
                      type="text"
                      value={formData.institutionName}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, institutionName: e.target.value }))
                      }
                      placeholder="Universidad Nacional Autonoma de Mexico"
                      className={`w-full rounded-xl border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                        errors.institutionName ? 'border-destructive' : 'border-border focus:border-primary'
                      }`}
                    />
                    {errors.institutionName && (
                      <p className="text-xs text-destructive">{errors.institutionName}</p>
                    )}
                  </div>

                  {/* Degree */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      Titulo / Grado *
                    </label>
                    <input
                      type="text"
                      value={formData.degree}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, degree: e.target.value }))
                      }
                      placeholder="Ingeniero de Sistemas"
                      className={`w-full rounded-xl border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                        errors.degree ? 'border-destructive' : 'border-border focus:border-primary'
                      }`}
                    />
                    {errors.degree && (
                      <p className="text-xs text-destructive">{errors.degree}</p>
                    )}
                  </div>

                  {/* Field of Study */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      Area de Estudio
                    </label>
                    <input
                      type="text"
                      value={formData.fieldOfStudy}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, fieldOfStudy: e.target.value }))
                      }
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
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                        }
                        className={`w-full rounded-xl border bg-background px-4 py-3 text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                          errors.startDate ? 'border-destructive' : 'border-border focus:border-primary'
                        }`}
                      />
                      {errors.startDate && (
                        <p className="text-xs text-destructive">{errors.startDate}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        Fecha de Fin
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                        }
                        disabled={formData.isCurrent}
                        className={`w-full rounded-xl border bg-background px-4 py-3 text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 ${
                          errors.endDate ? 'border-destructive' : 'border-border focus:border-primary'
                        }`}
                      />
                      {errors.endDate && (
                        <p className="text-xs text-destructive">{errors.endDate}</p>
                      )}
                    </div>
                  </div>

                  {/* Is Current Checkbox */}
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.isCurrent}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, isCurrent: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">Actualmente estudiando aqui</span>
                  </label>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="flex items-center justify-between text-sm font-medium text-foreground">
                      <span>Descripcion</span>
                      <span className="text-xs text-muted-foreground">
                        {formData.description.length}/{maxDescriptionChars}
                      </span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Describe tus logros, proyectos relevantes o especializacion..."
                      rows={4}
                      maxLength={maxDescriptionChars}
                      className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* File Upload */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Subir Titulo o Certificado (PDF/JPG)
                    </label>

                    {uploadedFileName ? (
                      <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <span className="text-sm text-foreground">{uploadedFileName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={removeFile}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
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
                        <p className="mt-1 text-xs text-muted-foreground">PDF, JPG o PNG</p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileInputChange}
                          className="hidden"
                        />
                      </div>
                    )}
                    {errors.file && (
                      <p className="text-xs text-destructive">{errors.file}</p>
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
  );
}
