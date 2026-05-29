import api from '@/shared/api/api';
import { createPortal } from 'react-dom';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronRight, ChevronLeft, Check, Upload, Plus, Trash2,
  Github, Video, FileText, Image as ImageIcon,
} from 'lucide-react';

import { useAuthStore, useProjectsStore, useUiStore } from '@/store';
import { isValidMediaUrl, getMediaType } from '@/shared/lib/utils';
import type {
  Project,
  ProjectCategory,
  ProjectStatus,
  TechnicalInfo,
  ProjectMedia,
} from '@/shared/types';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function urlBadge(url: string) {
  if (url.includes('youtube') || url.includes('youtu.be'))
    return { label: 'YouTube', cls: 'bg-red-500/10 text-red-600 dark:text-red-300 border-red-500/20' };
  if (url.includes('vimeo'))
    return { label: 'Vimeo', cls: 'bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/20' };
  if (url.includes('figma'))
    return { label: 'Figma', cls: 'bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/20' };
  if (url.includes('github'))
    return { label: 'GitHub', cls: 'bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/20' };
  if (url.includes('docs.google'))
    return { label: 'Google Doc', cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20' };
  return { label: 'Enlace', cls: 'bg-muted/50 text-muted-foreground border-border' };
}

function sanitizeText(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

async function fetchRemoteFileSize(url: string): Promise<number> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');
    const parsedSize = contentLength ? Number(contentLength) : 0;
    return Number.isFinite(parsedSize) ? parsedSize : 0;
  } catch {
    return 0;
  }
}

function reorderList<T>(list: T[], fromIndex: number, toIndex: number) {
  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const MAX_TITLE = 100;
const MAX_ROLE = 100;
const MAX_DESC = 500;

const STEPS = ['General', 'Técnico', 'Media'];
const HINTS = [
  'Paso 1 de 3 · información general',
  'Paso 2 de 3 · detalles técnicos',
  'Paso 3 de 3 · media y archivos',
];

const PROJECT_CATEGORIES: ProjectCategory[] = ['Web', 'Mobile', 'API', 'Data', 'DevOps', 'Other'];
const PROJECT_STATUSES: ProjectStatus[] = ['draft', 'in_progress', 'completed', 'archived'];
const STATUSES_LABELS: Record<ProjectStatus, string> = {
  draft: 'Borrador',
  in_progress: 'En progreso',
  completed: 'Completado',
  archived: 'Archivado',
};

// ─── Predefined cover presets ─────────────────────────────────────────────────

const PREDEFINED_COVERS = [
  {
    id: 'violet-space',
    label: 'Violet Space',
    css: 'linear-gradient(135deg, #1A0530 0%, #0D0820 50%, #05050D 100%)',
    glow: '#A855F7',
    dot: 'bg-violet-500',
  },
  {
    id: 'cyber-teal',
    label: 'Cyber Teal',
    css: 'linear-gradient(135deg, #002E3A 0%, #001A24 50%, #000C12 100%)',
    glow: '#06B6D4',
    dot: 'bg-cyan-500',
  },
  {
    id: 'ember-dark',
    label: 'Ember Dark',
    css: 'linear-gradient(135deg, #1C0A00 0%, #0F0400 50%, #060000 100%)',
    glow: '#F97316',
    dot: 'bg-orange-500',
  },
  {
    id: 'matrix-green',
    label: 'Matrix',
    css: 'linear-gradient(135deg, #001A0D 0%, #000E06 50%, #000402 100%)',
    glow: '#10B981',
    dot: 'bg-emerald-500',
  },
  {
    id: 'midnight-blue',
    label: 'Midnight',
    css: 'linear-gradient(135deg, #00082A 0%, #000318 50%, #000009 100%)',
    glow: '#3B82F6',
    dot: 'bg-blue-500',
  },
  {
    id: 'rose-dark',
    label: 'Rose Dark',
    css: 'linear-gradient(135deg, #1C0012 0%, #0E0008 50%, #040002 100%)',
    glow: '#EC4899',
    dot: 'bg-pink-500',
  },
] as const;

type CoverId = (typeof PREDEFINED_COVERS)[number]['id'];

/** Encode as `gradient:<id>` stored in thumbnail field */
const encodeCover = (id: CoverId) => `gradient:${id}`;
const decodeCover = (thumbnail: string): CoverId | null => {
  if (!thumbnail.startsWith('gradient:')) return null;
  const id = thumbnail.slice('gradient:'.length) as CoverId;
  return PREDEFINED_COVERS.some((c) => c.id === id) ? id : null;
};

// Función para subir archivos usando el cliente API centralizado
async function uploadProjectFile(file: File): Promise<{ url: string; name: string; size: number }> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    // Al usar api.post, el token y la URL base ya se inyectan automáticamente
    const response = await api.post('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const payload = response.data;

    if (!payload?.success || !payload.data) {
      throw new Error(payload?.message || 'Error subiendo archivo.');
    }

    return payload.data;
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message || 'Error subiendo archivo. Verifica tu conexión o formato.';
    throw new Error(errorMsg);
  }
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function StepCircle({ n, current }: { n: number; current: number }) {
  const done = n < current;
  const active = n === current;
  return (
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all duration-300 shrink-0
        ${done
          ? 'bg-violet-500 border-violet-500 text-white'
          : active
            ? 'bg-background border-violet-500 text-violet-500 dark:text-violet-400 shadow-[0_0_0_4px_rgba(127,119,221,0.15)]'
            : 'bg-muted border-muted-foreground/20 text-muted-foreground/40'
        }`}
    >
      {done ? <Check size={12} strokeWidth={3} /> : n}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
      {children}
    </label>
  );
}

function Req() {
  return <span className="text-violet-400 normal-case tracking-normal font-medium"> *</span>;
}

function DarkInput({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-[9px] text-[13px] rounded-xl
        bg-muted/40 border border-input text-foreground placeholder-muted-foreground/50
        focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all ${className}`}
    />
  );
}

function DarkSelect({
  options,
  value,
  onChange,
}: {
  options: (string | { value: string; label: string })[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full px-3 py-[9px] text-[13px] rounded-xl
        bg-muted/40 border border-input text-foreground
        focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
    >
      {options.map((o) => {
        if (typeof o === 'string') {
          return (
            <option key={o} value={o}>
              {o}
            </option>
          );
        }

        return (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        );
      })}
    </select>
  );
}

function DarkTextarea({ maxLength, value, onChange, placeholder }: {
  maxLength?: number;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <textarea
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        placeholder={placeholder}
        className="w-full px-3 py-[9px] text-[13px] rounded-xl
          bg-muted/40 border border-input text-foreground placeholder-muted-foreground/50
          focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all resize-y min-h-[88px] leading-relaxed"
      />
      {maxLength && (
        <p className="text-[11px] text-muted-foreground/60 text-right mt-1">{value.length}/{maxLength}</p>
      )}
    </div>
  );
}

function Toggle({ checked, onChange, label, sub }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center justify-between px-3.5 py-3 rounded-xl border border-input bg-muted/20 hover:border-violet-500/50 transition-colors">
      <div>
        <p className="text-[13px] font-medium text-foreground">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground/60 mt-0.5">{sub}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-[22px] rounded-full border-none outline-none transition-colors duration-200 shrink-0
          ${checked ? 'bg-violet-500' : 'bg-muted-foreground/20'}`}
      >
        <span
          className={`absolute top-[3px] left-[3px] w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
            ${checked ? 'translate-x-[18px]' : ''}`}
        />
      </button>
    </div>
  );
}

function TagInput({ tags, setTags }: {
  tags: string[];
  setTags: (tags: string[]) => void;
}) {
  const [val, setVal] = useState('');
  const add = () => {
    const v = val.trim();
    if (v && !tags.includes(v)) setTags([...tags, v]);
    setVal('');
  };
  return (
    <div>
      <div className="flex gap-2">
        <DarkInput
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="React, TypeScript, PostgreSQL..."
        />
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 px-3 h-10 rounded-xl border border-input bg-muted/40
            text-[12px] font-semibold text-muted-foreground hover:border-violet-500/50 hover:text-violet-500 dark:hover:text-violet-400
            hover:bg-violet-500/10 transition-all shrink-0"
        >
          <Plus size={13} /> Añadir
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {tags.map((t) => (
            <span
              key={t}
              onClick={() => setTags(tags.filter((x) => x !== t))}
              className="flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/25 text-violet-600 dark:text-violet-300
                text-[12px] font-medium px-3 py-1 rounded-full cursor-pointer hover:bg-violet-500/20 transition-colors"
            >
              {t} <X size={11} strokeWidth={2.5} />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function UrlListInput({ items, setItems, placeholder }: {
  items: string[];
  setItems: React.Dispatch<React.SetStateAction<string[]>>;
  placeholder: string;
}) {
  const [val, setVal] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const add = () => {
    const v = val.trim();
    if (v) { setItems([...items, v]); setVal(''); }
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setItems((currentItems) => reorderList(currentItems, fromIndex, toIndex));
  };

  return (
    <div>
      <div className="flex gap-2">
        <DarkInput
          type="url"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 px-3 h-10 rounded-xl border border-input bg-muted/40
            text-[12px] font-semibold text-muted-foreground hover:border-violet-500/50 hover:text-violet-500 dark:hover:text-violet-400
            hover:bg-violet-500/10 transition-all shrink-0"
        >
          <Plus size={13} /> Añadir
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-col gap-2 mt-3">
          {items.map((url, i) => {
            const badge = urlBadge(url);
            return (
              <div
                key={`${url}-${i}`}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex === null) return;
                  moveItem(dragIndex, i);
                  setDragIndex(null);
                }}
                onDragEnd={() => setDragIndex(null)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-input bg-muted/20 cursor-grab active:cursor-grabbing"
              >
                <span className="text-[11px] text-muted-foreground/50 select-none">⋮⋮</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${badge.cls}`}>
                  {badge.label}
                </span>
                <span className="flex-1 text-[12px] text-muted-foreground truncate">{url.replace(/^https?:\/\//, '')}</span>
                <button
                  type="button"
                  onClick={() => setItems(items.filter((_, j) => j !== i))}
                  className="text-muted-foreground/60 hover:text-destructive transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ImageUpload({ preview, setPreview }: {
  preview: string | null;
  setPreview: (p: string | null) => void;
}) {
  const { addToast } = useUiStore();
  const [isUploading, setIsUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const handle = async (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast({ type: 'error', title: 'Archivo inválido', message: 'Por favor selecciona una imagen.' });
      return;
    }
    try {
      setIsUploading(true);
      const uploaded = await uploadProjectFile(file);
      setPreview(uploaded.url);
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al subir', message: error.message || 'Hubo un problema al subir tu imagen.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-input">
          <img src={preview ?? ''} alt="preview" className="w-full h-48 object-contain bg-muted/20" />
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 dark:bg-black/70 text-white/80
              flex items-center justify-center hover:bg-black/60 dark:hover:bg-black/90 transition-colors"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => !isUploading && ref.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handle(e.dataTransfer.files[0]); }}
          className={`border-2 border-dashed border-muted-foreground/20 rounded-xl p-7 text-center cursor-pointer
            hover:border-violet-500/50 hover:bg-violet-500/5 transition-all group ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center mx-auto mb-3
            group-hover:bg-violet-500/20 transition-colors">
            <Upload size={19} className="text-violet-500 dark:text-violet-400" strokeWidth={1.8} />
          </div>
          <p className="text-[13px] font-medium text-muted-foreground">
            {isUploading ? 'Subiendo imagen...' : <><span className="text-violet-500 dark:text-violet-400">Elige un archivo</span> o arrástralo aquí</>}
          </p>
          <p className="text-[11px] text-muted-foreground/60 mt-1">PNG, JPG, WebP · máx 5 MB</p>
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => { void handle(e.target.files?.[0]); e.target.value = ''; }} />
    </div>
  );
}

function FileUpload({ files, setFiles }: {
  files: { name: string; size: number; url: string }[];
  setFiles: React.Dispatch<React.SetStateAction<{ name: string; size: number; url: string }[]>>;
}) {
  const { addToast } = useUiStore();
  const [isUploading, setIsUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const moveFile = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setFiles((currentFiles) => reorderList(currentFiles, fromIndex, toIndex));
  };

  const handle = async (file: File | null | undefined) => {
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isPdf = fileName.endsWith('.pdf') || file.type === 'application/pdf';
    const isDoc = fileName.match(/\.(doc|docx)$/) || file.type.includes('word');

    if (!isPdf && !isDoc) {
      addToast({ type: 'error', title: 'Archivo inválido', message: 'Solo se permiten documentos PDF o Word.' });
      return;
    }

    try {
      setIsUploading(true);
      const uploaded = await uploadProjectFile(file);
      setFiles([...files, { name: file.name, size: file.size, url: uploaded.url }]);
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al subir', message: error.message || 'Hubo un problema al subir el documento.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      {files.length > 0 && (
        <div className="flex flex-col gap-2 mb-3">
          {files.map((file, i) => (
            <div
              key={`${file.url}-${i}`}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex === null) return;
                moveFile(dragIndex, i);
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-input bg-muted/20 cursor-grab active:cursor-grabbing"
            >
              <span className="text-[11px] text-muted-foreground/50 select-none">⋮⋮</span>
              <FileText size={14} className="text-violet-500 dark:text-violet-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-foreground truncate">{file.name}</p>
                <p className="text-[10px] text-muted-foreground/60">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => setFiles(files.filter((_, j) => j !== i))}
                className="text-muted-foreground/60 hover:text-destructive transition-colors shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div
        onClick={() => !isUploading && ref.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handle(e.dataTransfer.files[0]); }}
        className={`border-2 border-dashed border-muted-foreground/20 rounded-xl p-6 text-center cursor-pointer
          hover:border-violet-500/50 hover:bg-violet-500/5 transition-all group ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center mx-auto mb-2
          group-hover:bg-violet-500/20 transition-colors">
          <Upload size={18} className="text-violet-500 dark:text-violet-400" strokeWidth={1.8} />
        </div>
        <p className="text-[13px] font-medium text-muted-foreground">
          {isUploading ? 'Subiendo archivo...' : <><span className="text-violet-500 dark:text-violet-400">Selecciona un archivo</span> o arrástralo</>}
        </p>
        <p className="text-[11px] text-muted-foreground/60 mt-1">PDF, DOC, DOCX · máx 10 MB</p>
      </div>
      <input ref={ref} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={(e) => { void handle(e.target.files?.[0]); e.target.value = ''; }} />
    </div>
  );
}

function SectionCard({ icon: Icon, title, children }: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-input bg-muted/15 p-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-4">
        <Icon size={13} className="text-violet-500 dark:text-violet-400" strokeWidth={1.8} />
        {title}
      </div>
      {children}
    </div>
  );
}

/** Grid of 6 clickable predefined cover tiles */
function CoverPresetSelector({
  selectedId,
  onSelect,
}: {
  selectedId: CoverId | null;
  onSelect: (id: CoverId | null) => void;
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground/60 mb-2.5">
        Elige una portada predefinida — clic para seleccionar
      </p>
      <div className="grid grid-cols-3 gap-2">
        {PREDEFINED_COVERS.map((cover) => {
          const active = selectedId === cover.id;
          return (
            <button
              key={cover.id}
              type="button"
              onClick={() => onSelect(active ? null : cover.id)}
              aria-pressed={active}
              title={cover.label}
              className={`relative h-[60px] rounded-xl overflow-hidden border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500
                ${active
                  ? 'border-violet-500 shadow-[0_0_0_3px_rgba(139,92,246,0.25)]'
                  : 'border-border hover:border-violet-500/50 hover:scale-[1.02]'
                }`}
            >
              {/* Gradient fill */}
              <div className="absolute inset-0" style={{ backgroundImage: cover.css }} />

              {/* Subtle grid overlay */}
              <div
                className="absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
                  backgroundSize: '12px 12px',
                }}
              />

              {/* Label + glow dot */}
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 px-2 py-1.5">
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: cover.glow }}
                />
                <span className="text-[9px] font-semibold text-white/70 truncate">{cover.label}</span>
              </div>

              {/* Check badge */}
              {active && (
                <div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500">
                  <Check size={8} strokeWidth={3} className="text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export function CreateProjectModal({ isOpen, onClose, project }: CreateProjectModalProps) {
  const navigate = useNavigate();
  const { user: profile } = useAuthStore();
  const { projects, createProject, updateProject } = useProjectsStore();
  const { addToast } = useUiStore();
  const isEditing = Boolean(project);

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('Web');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('draft');
  const [isPublic, setIsPublic] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [role, setRole] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [techs, setTechs] = useState<string[]>([]);
  const [githubUrl, setGithubUrl] = useState('');
  const [results, setResults] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedCover, setSelectedCover] = useState<CoverId | null>(null);
  const [videos, setVideos] = useState<string[]>([]);
  const [docs, setDocs] = useState<{ name: string; size: number; url: string }[]>([]);

  const [errors, setErrors] = useState({
    title: '',
    description: '',
    role: '',
  });

  const isSubmittingRef = useRef(false);

  const resetForm = () => {
    setStep(1);
    setTitle('');
    setCategory('Web');
    setDescription('');
    setStatus('draft');
    setIsPublic(false);
    setFeatured(false);
    setRole('');
    setStartDate('');
    setEndDate('');
    setTechs([]);
    setGithubUrl('');
    setResults('');
    setImagePreview(null);
    setSelectedCover(null);
    setVideos([]);
    setDocs([]);

    setErrors({
      title: '',
      description: '',
      role: '',
    });
  };

  const hydrateForm = (currentProject: Project) => {
    setStep(1);
    setTitle(currentProject.title);
    setCategory(currentProject.category);
    setDescription(currentProject.description);
    setStatus(currentProject.status);
    setIsPublic(currentProject.isPublic);
    setFeatured(currentProject.isFeatured);
    setRole(currentProject.technicalInfo.role);
    setStartDate(currentProject.technicalInfo.startDate);
    setEndDate(currentProject.technicalInfo.endDate || '');
    setTechs([...currentProject.technicalInfo.technologies]);
    setGithubUrl((currentProject as Project & { repositoryUrl?: string }).repositoryUrl || '');
    setResults(currentProject.technicalInfo.results);
    const thumb = currentProject.thumbnail || null;
    setImagePreview(thumb);
    setSelectedCover(thumb ? decodeCover(thumb) : null);
    setVideos(currentProject.media.map((media) => media.url));
    setDocs(currentProject.files.map((file) => ({ name: file.name, size: file.size, url: file.url })));

    const filesWithMissingSize = currentProject.files.filter((file) => !file.size || file.size <= 0);
    if (filesWithMissingSize.length > 0) {
      void Promise.all(
        filesWithMissingSize.map(async (file) => ({
          url: file.url,
          size: await fetchRemoteFileSize(file.url),
        })),
      ).then((resolvedSizes) => {
        setDocs((currentDocs) =>
          currentDocs.map((doc) => {
            const resolved = resolvedSizes.find((item) => item.url === doc.url && item.size > 0);
            return resolved ? { ...doc, size: resolved.size } : doc;
          }),
        );
      });
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    if (project) {
      hydrateForm(project);
      return;
    }
    resetForm();
  }, [isOpen, project]);

  // ── Validation ───────────────────────────────

  const validate = (): boolean => {
    const newErrors = {
      title: '',
      description: '',
      role: '',
    };

    let valid = true;

    if (!title.trim()) {
      newErrors.title = 'El título es obligatorio';
      valid = false;
    } else if (title.length > MAX_TITLE) {
      newErrors.title = `Máximo ${MAX_TITLE} caracteres`;
      valid = false;
    } else {
      const duplicate = projects.some(
        (p) =>
          p.title.toLowerCase() === title.toLowerCase() &&
          p.id !== project?.id
      );

      if (duplicate) {
        newErrors.title = 'Ya tienes un proyecto con este título';
        valid = false;
      }
    }

    if (!description.trim()) {
      newErrors.description = 'La descripción es obligatoria';
      valid = false;
    }

    if (!role.trim()) {
      newErrors.role = 'El rol es obligatorio';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // ── Submit handler ───────────────────────────

  const handleSubmit = async () => {
    if (isSubmittingRef.current) return;
    if (!validate()) return;
    if (!profile) return;

    isSubmittingRef.current = true;

    const mediaList: ProjectMedia[] = [];
    videos.forEach((url, i) => {
      const type = getMediaType(url);
      if (type) {
        mediaList.push({
          id: Date.now().toString() + i,
          projectId: '',
          url,
          type,
          title: url,
        });
      }
    });
    docs.forEach((doc, i) => {
      const type = doc.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'document';
      if (type) {
        mediaList.push({
          id: Date.now().toString() + videos.length + i,
          projectId: '',
          url: doc.url,
          type,
          title: doc.name,
        });
      }
    });

    const sanitizedPayload = {
      title: sanitizeText(title),
      description: sanitizeText(description),
      repositoryUrl: sanitizeText(githubUrl),
      category,
      status,
      isPublic,
      isFeatured: featured,
      thumbnail: imagePreview || (selectedCover ? encodeCover(selectedCover) : ''),
      technicalInfo: {
        role: sanitizeText(role),
        technologies: techs.map(sanitizeText),
        startDate,
        endDate,
        results: sanitizeText(results),
      },
      media: mediaList,
    };

    try {
      if (project) {
        await updateProject(project.id, sanitizedPayload, profile.profile_id || profile.id);
        addToast({ type: 'success', title: 'Proyecto actualizado exitosamente' });
      } else {
        const newProject = await createProject(profile.profile_id || profile.id, sanitizedPayload);
        addToast({ type: 'success', title: 'Proyecto creado exitosamente' });
        if (newProject?.id) {
          navigate(`/dashboard/projects/${newProject.id}`);
        }
      }
      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      const isDuplicate = message.includes('409') || message.includes('Ya tienes un proyecto');
      addToast({
        type: 'error',
        title: isDuplicate ? 'Título duplicado' : (project ? 'Error al actualizar' : 'Error al crear'),
        message: isDuplicate ? 'Ya tienes un proyecto con ese título.' : 'No se pudo completar la operación.',
      });
    } finally {
      isSubmittingRef.current = false;
    }
  };

  if (!isOpen) return null;
  const portalRoot = document.getElementById('portal-root') ?? document.body;
  return createPortal(
    <>
      {/* Backdrop — separated so blur stays fixed and doesn't scroll */}
      <motion.div
        className="absolute inset-0 z-[80] bg-background/75 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={handleClose}
      />
      {/* Scrollable container — pointer-events pass through to backdrop */}
      <div className="absolute inset-0 z-[81] flex items-center justify-center p-4 overflow-y-auto pointer-events-none">
      <div
        className="bg-background rounded-2xl w-full max-w-3xl max-h-[88vh] border border-border flex flex-col overflow-hidden shadow-2xl shadow-black/30 pointer-events-auto"
      >
        {/* accent bar */}
        <div className="h-[3px] bg-gradient-to-r from-violet-700 via-violet-500 to-violet-300 shrink-0" />

        {/* header */}
        <div className="flex items-center justify-between px-4 sm:px-7 pt-4 sm:pt-5 pb-0 shrink-0">
          <div>
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-1">
              EthosHub · Proyectos
            </p>
            <h2 className="text-base sm:text-lg font-semibold text-foreground tracking-tight">
              {project ? 'Editar proyecto' : 'Crear nuevo proyecto'}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full border border-border bg-muted/40 flex items-center justify-center
              text-muted-foreground hover:border-violet-500/50 hover:text-violet-500 dark:hover:text-violet-400 hover:bg-violet-500/10 transition-all"
          >
            <X size={13} strokeWidth={2.2} />
          </button>
        </div>

        {/* stepper */}
        <div className="flex items-center justify-center gap-3 sm:gap-8 px-4 sm:px-7 pt-4 sm:pt-5 pb-0 shrink-0 overflow-x-auto">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const active = n === step;
            const done = n < step;
            return (
              <div key={n} className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div
                  className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full border transition-all duration-300
                    ${active ? 'border-violet-500/30 bg-violet-500/10' : 'border-transparent'}`}
                >
                  <StepCircle n={n} current={step} />
                  <span
                    className={`text-[11px] sm:text-[12px] font-medium transition-colors whitespace-nowrap
                      ${active ? 'text-violet-500 dark:text-violet-400' : done ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-10 sm:w-20 h-px transition-colors duration-500
                      ${done ? 'bg-violet-500/40' : 'bg-border'}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="mx-4 sm:mx-7 mt-4 sm:mt-5 h-px bg-border shrink-0" />

        {/* body */}
        <div className="overflow-y-auto flex-1 min-h-0 px-4 sm:px-7 py-4 sm:py-5">

          {/* STEP 1 */}
          {step === 1 && (
            <div key="s1" className="flex flex-col gap-4" style={{ animation: 'fadeUp .28s ease both' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Título <Req /></Label>
                  <div>
                    <DarkInput value={title} onChange={(e) => { setTitle(e.target.value); if (errors.title) { setErrors((prev) => ({ ...prev, title: '', })); } }}
                      placeholder="Nombre del proyecto" maxLength={100} />
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[11px] text-red-400 min-h-[16px]">
                        {errors.title ||
                          (projects.some(
                            (p) =>
                              p.title.toLowerCase() === title.toLowerCase() &&
                              p.id !== project?.id
                          ) && title.trim()
                            ? '⚠ Ya tienes un proyecto con este título'
                            : '')}
                      </p>
                      <p className="text-[11px] text-muted-foreground/60">
                        {title.length}/100
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Categoría</Label>
                  <DarkSelect value={category} onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                    options={PROJECT_CATEGORIES} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Descripción <Req /></Label>
                <DarkTextarea value={description}
                  onChange={(e) => {
                    setDescription(e.target.value); if (errors.description) {
                      setErrors((prev) => ({ ...prev, description: '', }));
                    }
                  }}
                  placeholder="Describe brevemente tu proyecto..."
                  maxLength={500} />

                {errors.description && (
                  <p className="text-[11px] text-red-400 mt-1">
                    {errors.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Estado inicial</Label>
                  <DarkSelect value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                    options={PROJECT_STATUSES.map((s) => ({value: s,label: STATUSES_LABELS[s],}))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Rol en el proyecto <Req /></Label>
                  <DarkInput value={role} onChange={(e) => {
                    setRole(e.target.value);
                    if (errors.role) {
                      setErrors((prev) => ({
                        ...prev,
                        role: '',
                      }));
                    }
                  }}
                    placeholder="Lead Dev, UX Designer..."
                  />
                  {errors.role && (
                    <p className="text-[11px] text-red-400 mt-1">
                      {errors.role}
                    </p>
                  )}
                </div>
              </div>

              <Toggle checked={isPublic} onChange={setIsPublic}
                label="Proyecto público" sub="Visible para todos los usuarios" />
              <Toggle checked={featured} onChange={setFeatured}
                label="Destacado en portafolio" sub="Aparece en la sección principal" />
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div key="s2" className="flex flex-col gap-4" style={{ animation: 'fadeUp .28s ease both' }}>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Fecha de inicio</Label>
                  <DarkInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Fecha de fin</Label>
                  <DarkInput type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Repositorio GitHub</Label>
                <div className="relative">
                  <Github size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
                  <DarkInput type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/usuario/repo" className="pl-9" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Tecnologías utilizadas</Label>
                <TagInput tags={techs} setTags={setTechs} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Resultados obtenidos</Label>
                <DarkTextarea value={results} onChange={(e) => setResults(e.target.value)}
                  placeholder="Métricas de impacto, logros, resultados clave..." />
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div key="s3" className="flex flex-col gap-4" style={{ animation: 'fadeUp .28s ease both' }}>
              <SectionCard icon={ImageIcon} title="Portada del proyecto">
                {/* ── Predefined cover grid ── */}
                <CoverPresetSelector
                  selectedId={selectedCover}
                  onSelect={(id) => {
                    setSelectedCover(id);
                    // Clear any custom upload when a preset is chosen
                    if (id && imagePreview && !imagePreview.startsWith('gradient:')) {
                      setImagePreview(null);
                    }
                  }}
                />

                {/* ── Divider ── */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-muted/15 px-3 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50">
                      o sube una imagen personalizada
                    </span>
                  </div>
                </div>

                {/* ── Custom image upload ── */}
                <ImageUpload
                  preview={imagePreview && !imagePreview.startsWith('gradient:') ? imagePreview : null}
                  setPreview={(url) => {
                    setImagePreview(url);
                    // Clear preset when uploading custom image
                    if (url) setSelectedCover(null);
                  }}
                />
              </SectionCard>

              <SectionCard icon={Video} title="Videos">
                <UrlListInput items={videos} setItems={setVideos} placeholder="https://youtube.com/watch?v=..." />
                <p className="text-[11px] text-muted-foreground/60 mt-2">YouTube, Vimeo, Figma o Google Slides</p>
              </SectionCard>

              <SectionCard icon={FileText} title="Documentos">
                <FileUpload files={docs} setFiles={setDocs} />
              </SectionCard>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-7 py-4 border-t border-border shrink-0">
          <span className="text-[11px] text-muted-foreground text-center sm:text-left">{HINTS[step - 1]}</span>
          <div className="flex flex-wrap justify-center sm:justify-end gap-2">
            {step > 1 && (
              <button type="button" onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 px-4 h-9 rounded-xl border border-input bg-muted/40
                  text-[13px] font-medium text-muted-foreground hover:border-violet-500/40 hover:text-violet-500 dark:hover:text-violet-400 transition-all">
                <ChevronLeft size={14} /> Atrás
              </button>
            )}
            <button type="button" onClick={handleClose}
              className="px-4 h-9 rounded-xl border border-input bg-transparent
                text-[13px] font-medium text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-all">
              Cancelar
            </button>
            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && !validate()) return;
                  setStep(step + 1);
                }}
                className="flex items-center gap-1.5 px-5 h-9 rounded-xl bg-violet-500 hover:bg-violet-600
                  text-white text-[13px] font-semibold transition-all active:scale-[0.97]"
              >
                Continuar <ChevronRight size={14} />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit}
                className="flex items-center gap-1.5 px-5 h-9 rounded-xl text-white text-[13px] font-semibold
                  transition-all active:scale-[0.97] bg-gradient-to-r from-violet-600 to-violet-500"
                style={{ boxShadow: '0 4px 20px rgba(127,119,221,0.35)' }}
              >
                <Check size={14} strokeWidth={2.5} /> {project ? 'Actualizar proyecto' : 'Crear proyecto'}
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
    </>,
    portalRoot
  );
}