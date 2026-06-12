import api from '@/shared/api/api';
import { createPortal } from 'react-dom';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronRight, ChevronLeft, Check, Upload, Plus, Trash2,
  Github, FileText, Image as ImageIcon, Link2, HardDrive,
} from 'lucide-react';

import { useAuthStore, useProjectsStore, useUiStore } from '@/store';
import { isValidMediaUrl, getMediaType, getYoutubeEmbedUrl, getVimeoEmbedUrl } from '@/shared/lib/utils';
import type {
  Project,
  ProjectCategory,
  ProjectStatus,
  TechnicalInfo,
  ProjectMedia,
} from '@/shared/types';

// ─────────────────────────────────────────────

/**
 * Modal form for creating and editing portfolio projects including title, description, media, and tech stack.
 */
const API_BASE = (import.meta.env.VITE_API_URL as string) || '';
const resolvePreviewUrl = (url: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
  const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

function urlBadge(url: string) {
  if (url.includes('youtube') || url.includes('youtu.be'))
    return { label: 'YouTube', cls: 'bg-red-500/10 text-red-600 dark:text-red-300 border-red-500/20' };
  if (url.includes('vimeo'))
    return { label: 'Vimeo', cls: 'bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/20' };
  if (url.includes('figma'))
    return { label: 'Figma', cls: 'bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/20' };
  if (url.includes('github'))
    return { label: 'GitHub', cls: 'bg-gray-500/10 text-gray-600 dark:text-gray-300 border-gray-500/20' };
  // Google Slides: docs.google.com/presentation
  if (/docs\.google\.com\/(presentation|.*slide)/i.test(url))
    return { label: 'Google Slides', cls: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20' };
  // Google Docs: docs.google.com/document
  if (/docs\.google\.com\/document/i.test(url))
    return { label: 'Google Docs', cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20' };
  if (/docs\.google\.com/i.test(url))
    return { label: 'Google Drive', cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20' };
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
    const response = await api.post('/uploads', formData, {
      timeout: 120_000,
      headers: { 'Content-Type': undefined },
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

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
}

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
      className="w-full px-3 py-[9px] text-[13px] rounded-xl bg-background border border-input text-foreground focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
    >
      {options.map((o) => {
        if (typeof o === 'string') {
          return (
            <option key={o} value={o} className="bg-background text-foreground">
              {o}
            </option>
          );
        }
        return (
          <option key={o.value} value={o.value} className="bg-background text-foreground">
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

function UrlListInput({ items, setItems, placeholder, maxItems = Infinity }: {
  items: string[];
  setItems: React.Dispatch<React.SetStateAction<string[]>>;
  placeholder: string;
  maxItems?: number;
}) {
  const [val, setVal] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const add = () => {
    const v = val.trim();
    if (v && items.length < maxItems) { setItems([...items, v]); setVal(''); }
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setItems((currentItems) => reorderList(currentItems, fromIndex, toIndex));
  };

  const atLimit = items.length >= maxItems;

  return (
    <div>
      <div className="flex gap-2">
        <DarkInput
          type="url"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={atLimit ? `Límite de ${maxItems} enlaces alcanzado` : placeholder}
          disabled={atLimit}
        />
        <button
          type="button"
          onClick={add}
          disabled={atLimit}
          className="flex items-center gap-1.5 px-3 h-10 rounded-xl border border-input bg-muted/40
            text-[12px] font-semibold text-muted-foreground hover:border-violet-500/50 hover:text-violet-500 dark:hover:text-violet-400
            hover:bg-violet-500/10 transition-all shrink-0 disabled:opacity-40 disabled:pointer-events-none"
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
    
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    try {
      setIsUploading(true);
      const uploaded = await uploadProjectFile(file);
      URL.revokeObjectURL(localUrl);
      setPreview(uploaded.url);
    } catch (error: any) {
      URL.revokeObjectURL(localUrl);
      setPreview(null);
      addToast({ type: 'error', title: 'Error al subir', message: error.message || 'Hubo un problema al subir tu imagen.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-input">
          <img src={resolvePreviewUrl(preview) ?? ''} alt="preview" className="w-full h-48 object-contain bg-muted/20" />
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

function CoverUrlInput({
  value,
  onChange,
  onApply,
  onClear,
  currentPreview,
}: {
  value: string;
  onChange: (v: string) => void;
  onApply: (url: string) => void;
  onClear: () => void;
  currentPreview: string | null;
}) {
  const { addToast } = useUiStore();
  const [loadError, setLoadError] = useState(false);

  const handleApply = () => {
    const url = value.trim();
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      addToast({ type: 'error', title: 'URL inválida', message: 'La URL debe comenzar con http:// o https://' });
      return;
    }
    setLoadError(false);
    onApply(url);
  };

  const displayPreview = currentPreview?.startsWith('http') ? currentPreview : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
          <DarkInput
            type="url"
            value={value}
            onChange={(e) => { onChange(e.target.value); setLoadError(false); }}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApply())}
            placeholder="https://ejemplo.com/imagen.jpg"
            className="pl-9"
          />
        </div>
        <button
          type="button"
          onClick={handleApply}
          disabled={!value.trim()}
          className="flex items-center gap-1.5 px-3 h-10 rounded-xl border border-input bg-muted/40
            text-[12px] font-semibold text-muted-foreground hover:border-violet-500/50 hover:text-violet-500 dark:hover:text-violet-400
            hover:bg-violet-500/10 transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ImageIcon size={13} /> Previsualizar
        </button>
      </div>

      {displayPreview && !loadError && (
        <div className="relative rounded-xl overflow-hidden border border-input">
          <img
            src={displayPreview}
            alt="preview portada"
            className="w-full h-48 object-contain bg-muted/20"
            onError={() => { setLoadError(true); onClear(); }}
          />
          <button
            type="button"
            onClick={() => { onChange(''); onClear(); setLoadError(false); }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 dark:bg-black/70 text-white/80
              flex items-center justify-center hover:bg-black/60 dark:hover:bg-black/90 transition-colors"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {loadError && (
        <p className="text-[11px] text-red-400">No se pudo cargar la imagen. Verifica que la URL sea directa a un archivo de imagen.</p>
      )}

      <p className="text-[11px] text-muted-foreground/60">
        Ingresa la URL directa de una imagen (JPG, PNG, WebP, GIF...). Presiona Enter o el botón para previsualizar.
      </p>
    </div>
  );
}

function FileUpload({ files, setFiles }: {
  files: { name: string; size: number; url: string }[];
  setFiles: React.Dispatch<React.SetStateAction<{ name: string; size: number; url: string }[]>>;
}) {
  const { addToast } = useUiStore();
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ name: string; size: number } | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const moveFile = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setFiles((currentFiles) => reorderList(currentFiles, fromIndex, toIndex));
  };

  const MAX_FILES = 5;

  const handle = async (file: File | null | undefined) => {
    if (!file) return;
    if (files.length >= MAX_FILES) {
      addToast({ type: 'error', title: 'Límite alcanzado', message: `Máximo ${MAX_FILES} archivos por proyecto.` });
      return;
    }
    const MAX_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      addToast({ type: 'error', title: 'Archivo demasiado grande', message: 'El tamaño máximo es 5 MB.' });
      return;
    }

    setPendingFile({ name: file.name, size: file.size });
    try {
      setIsUploading(true);
      const uploaded = await uploadProjectFile(file);
      // Usar update funcional para evitar closure stale
      setFiles((prev) => [...prev, { name: file.name, size: file.size, url: uploaded.url }]);
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al subir', message: error.message || 'Hubo un problema al subir el archivo.' });
    } finally {
      setPendingFile(null);
      setIsUploading(false);
    }
  };

  const hasItems = files.length > 0 || pendingFile !== null;
  const limitReached = files.length >= MAX_FILES;

  return (
    <div>
      {hasItems && (
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
                onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                className="text-muted-foreground/60 hover:text-destructive transition-colors shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          {}
          {pendingFile && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-violet-500/30 bg-violet-500/5 animate-pulse">
              <span className="text-[11px] text-muted-foreground/30 select-none">⋮⋮</span>
              <FileText size={14} className="text-violet-400/60 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-foreground/60 truncate">{pendingFile.name}</p>
                <p className="text-[10px] text-muted-foreground/40">{formatFileSize(pendingFile.size)} · subiendo...</p>
              </div>
            </div>
          )}
        </div>
      )}
      {limitReached ? (
        <div className="rounded-xl border border-dashed border-muted-foreground/20 p-4 text-center">
          <p className="text-[12px] text-muted-foreground/60">Límite de {MAX_FILES} archivos alcanzado</p>
        </div>
      ) : (
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
          <p className="text-[11px] text-muted-foreground/60 mt-1">PDF · máx 5 MB · {files.length}/{MAX_FILES} archivos</p>
        </div>
      )}
      <input ref={ref} type="file" accept="application/pdf" className="hidden" onChange={(e) => { void handle(e.target.files?.[0]); e.target.value = ''; }} />
    </div>
  );
}

function SectionCard({ icon: Icon, title, children }: {
  icon: React.ElementType;
  title: React.ReactNode;
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
              {}
              <div className="absolute inset-0" style={{ backgroundImage: cover.css }} />

              {}
              <div
                className="absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
                  backgroundSize: '12px 12px',
                }}
              />

              {}
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 px-2 py-1.5">
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: cover.glow }}
                />
                <span className="text-[9px] font-semibold text-white/70 truncate">{cover.label}</span>
              </div>

              {}
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

export function CreateProjectModal({ isOpen, onClose, project }: CreateProjectModalProps) {
  const navigate = useNavigate();
  const { profile: profile } = useAuthStore();
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
  const [coverTab, setCoverTab] = useState<'upload' | 'url'>('upload');
  const [coverUrlInput, setCoverUrlInput] = useState('');
  const [videos, setVideos] = useState<string[]>([]);
  const [docs, setDocs] = useState<{ name: string; size: number; url: string }[]>([]);

  const MAX_DATE = new Date().toISOString().split('T')[0]; // año actual como tope

  const [errors, setErrors] = useState({
    title: '',
    description: '',
    role: '',
    startDate: '',
    techs: '',
    thumbnail: '',
    videos: '',
    docs: '',
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
    setCoverTab('upload');
    setCoverUrlInput('');
    setVideos([]);
    setDocs([]);

    setErrors({ title: '', description: '', role: '', startDate: '', techs: '', thumbnail: '', videos: '', docs: '' });
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
    const coverId = thumb ? decodeCover(thumb) : null;
    setSelectedCover(coverId);
    if (coverId) {
      // Thumbnail is a gradient preset — keep imagePreview/coverUrlInput clean
      setImagePreview(null);
      setCoverTab('upload');
      setCoverUrlInput('');
    } else if (thumb?.startsWith('http')) {
      // Thumbnail is an external URL entered by the user
      setImagePreview(thumb);
      setCoverTab('url');
      setCoverUrlInput(thumb);
    } else {
      // Thumbnail is an uploaded file path or null
      setImagePreview(thumb);
      setCoverTab('upload');
      setCoverUrlInput('');
    }
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

  useEffect(() => {
    if (videos.length > 0) setErrors((prev) => ({ ...prev, videos: '' }));
  }, [videos.length]);

  useEffect(() => {
    if (docs.length > 0) setErrors((prev) => ({ ...prev, docs: '' }));
  }, [docs.length]);

  // ── Google Drive Picker (estructura base — integración futura) ────────────
  // Para activar: cargar la Google Picker API con el clientId y scope de Drive,
  // abrir el picker y capturar el documento seleccionado como enlace al proyecto.
  const openDrivePicker = () => {
    const DRIVE_PICKER_ORIGIN = 'https://docs.google.com';
    if (typeof window === 'undefined') return;

    // Intenta usar la Picker API si ya está cargada (se cargará en una futura integración)
    const google = (window as any).google;
    if (!google?.picker) {
      // Fallback: abre Google Drive en nueva pestaña para que el usuario copie el enlace
      window.open(`${DRIVE_PICKER_ORIGIN}/picker`, '_blank', 'noopener,noreferrer');
      addToast({
        type: 'info',
        title: 'Google Drive Picker',
        message: 'Copia el enlace del documento de Drive y pégalo en "Enlaces y Recursos".',
      });
      return;
    }

    // Integración completa cuando esté disponible la API key de Picker
    // const picker = new google.picker.PickerBuilder()
    //   .addView(google.picker.ViewId.DOCS)
    //   .setOAuthToken('<OAUTH_TOKEN>')
    //   .setCallback((data: any) => {
    //     if (data.action === google.picker.Action.PICKED) {
    //       const doc = data.docs[0];
    //       setVideos((prev) => [...prev, doc.url].slice(0, 10));
    //     }
    //   })
    //   .build();
    // picker.setVisible(true);
  };

  // ── Validation ───────────────────────────────

  const validateStep1 = (): boolean => {
    const e = { ...errors, title: '', description: '', role: '' };
    let ok = true;
    if (!title.trim()) { e.title = 'El título es obligatorio'; ok = false; }
    else if (title.trim().length < 5) { e.title = 'El título debe tener al menos 5 caracteres'; ok = false; }
    else if (title.length > MAX_TITLE) { e.title = `Máximo ${MAX_TITLE} caracteres`; ok = false; }
    else {
      const dup = projects.some(p => p.title.toLowerCase() === title.toLowerCase() && p.id !== project?.id);
      if (dup) { e.title = 'Ya tienes un proyecto con este título'; ok = false; }
    }
    if (!description.trim()) { e.description = 'La descripción es obligatoria'; ok = false; }
    else if (description.trim().length < 20) { e.description = 'La descripción debe tener al menos 20 caracteres'; ok = false; }
    if (!role.trim()) { e.role = 'El rol es obligatorio'; ok = false; }
    else if (role.trim().length < 3) { e.role = 'Mínimo 3 caracteres'; ok = false; }
    setErrors(e);
    return ok;
  };

  const validateStep2 = (): boolean => {
    const e = { ...errors, startDate: '', techs: '' };
    let ok = true;
    if (!startDate) { e.startDate = 'La fecha de inicio es obligatoria'; ok = false; }
    else if (startDate > MAX_DATE) { e.startDate = 'No puede ser una fecha futura'; ok = false; }
    if (endDate && endDate > MAX_DATE) { e.startDate = e.startDate || 'La fecha de fin no puede ser futura'; ok = false; }
    if (techs.length === 0) { e.techs = 'Agrega al menos una tecnología'; ok = false; }
    setErrors(e);
    return ok;
  };

  const validateStep3 = (): boolean => {
    const e = { ...errors, thumbnail: '', videos: '', docs: '' };
    let ok = true;
    const hasThumbnail = selectedCover !== null || (imagePreview !== null && !imagePreview.startsWith('gradient:'));
    if (!hasThumbnail) { e.thumbnail = 'Selecciona una portada predeterminada o sube una imagen'; ok = false; }
    if (videos.length === 0) { e.videos = 'Agrega al menos un video o enlace'; ok = false; }
    if (docs.length === 0) { e.docs = 'Sube al menos un documento'; ok = false; }
    setErrors(e);
    return ok;
  };

  const validate = (): boolean => validateStep1() && validateStep2() && validateStep3();

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
        const embedUrl =
          type === 'youtube' ? getYoutubeEmbedUrl(url) :
          type === 'vimeo'   ? getVimeoEmbedUrl(url)   : url;
        mediaList.push({
          id: Date.now().toString() + i,
          projectId: '',
          url: embedUrl,
          type,
          title: url,
        });
      }
    });
    docs.forEach((doc, i) => {
      const ext = doc.name.toLowerCase().split('.').pop() ?? '';
      const type = ext === 'pdf' ? 'pdf' : 'document';
      const entry = {
        id: Date.now().toString() + videos.length + i,
        projectId: '',
        url: doc.url,
        type,
        title: doc.name,
        size: doc.size,
      } as ProjectMedia & { size: number };
      mediaList.push(entry);
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
      {}
      <motion.div
        className="absolute inset-0 z-[80] bg-background/75 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
      />
      {}
      <div className="absolute inset-0 z-[81] flex items-center justify-center p-4 overflow-y-auto pointer-events-none">
      <div
        className="bg-background rounded-2xl w-full max-w-3xl max-h-[88vh] border border-border flex flex-col overflow-hidden shadow-2xl shadow-black/30 pointer-events-auto"
      >
        {}
        <div className="h-[3px] bg-gradient-to-r from-violet-700 via-violet-500 to-violet-300 shrink-0" />

        {}
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

        {}
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

        {}
        <div className="overflow-y-auto flex-1 min-h-0 px-4 sm:px-7 py-4 sm:py-5">

          {}
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
                    if (e.target.value.length > MAX_DESC) return;
                    setDescription(e.target.value);
                    if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
                  }}
                  placeholder="Describe brevemente tu proyecto..."
                  maxLength={MAX_DESC} />
                <div className="flex items-center justify-between mt-0.5">
                  {errors.description
                    ? <p className="text-[11px] text-red-400">{errors.description}</p>
                    : <span />}
                  <p className={`text-[11px] tabular-nums ${description.length >= MAX_DESC ? 'text-red-400 font-semibold' : 'text-muted-foreground/60'}`}>
                    {description.length}/{MAX_DESC}
                  </p>
                </div>
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

          {}
          {step === 2 && (
            <div key="s2" className="flex flex-col gap-4" style={{ animation: 'fadeUp .28s ease both' }}>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Fecha de inicio <Req /></Label>
                  <DarkInput type="date" value={startDate} max={MAX_DATE}
                    onChange={(e) => { setStartDate(e.target.value); if (errors.startDate) setErrors(p => ({ ...p, startDate: '' })); }} />
                  {errors.startDate && <p className="text-[11px] text-red-400 mt-1">{errors.startDate}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Fecha de fin</Label>
                  <DarkInput type="date" value={endDate} min={startDate} max={MAX_DATE}
                    onChange={(e) => setEndDate(e.target.value)} />
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
                <Label>Tecnologías utilizadas <Req /></Label>
                <TagInput tags={techs} setTags={(t) => { setTechs(t); if (t.length > 0 && errors.techs) setErrors(p => ({ ...p, techs: '' })); }} />
                {errors.techs && <p className="text-[11px] text-red-400 mt-1">{errors.techs}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Resultados obtenidos</Label>
                <DarkTextarea value={results} onChange={(e) => {
                  if (e.target.value.length > MAX_DESC) return;
                  setResults(e.target.value);
                }}
                  placeholder="Métricas de impacto, logros, resultados clave..."
                  maxLength={MAX_DESC} />
                <p className={`text-[11px] tabular-nums text-right ${results.length >= MAX_DESC ? 'text-red-400 font-semibold' : 'text-muted-foreground/60'}`}>
                  {results.length}/{MAX_DESC}
                </p>
              </div>
            </div>
          )}

          {}
          {step === 3 && (
            <div key="s3" className="flex flex-col gap-4" style={{ animation: 'fadeUp .28s ease both' }}>
              <SectionCard icon={ImageIcon} title={<>Portada del proyecto <Req /></>}>
                {}
                <CoverPresetSelector
                  selectedId={selectedCover}
                  onSelect={(id) => {
                    setSelectedCover(id);
                    if (id) {
                      setImagePreview(null);
                      setCoverUrlInput('');
                      setErrors((prev) => ({ ...prev, thumbnail: '' }));
                    }
                  }}
                />

                {}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-muted/15 px-3 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50">
                      o imagen personalizada
                    </span>
                  </div>
                </div>

                {}
                <div className="flex gap-1 rounded-xl border border-input bg-muted/30 p-1 mb-3">
                  <button
                    type="button"
                    onClick={() => setCoverTab('upload')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[12px] font-medium transition-all
                      ${coverTab === 'upload' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Upload size={12} /> Subir archivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverTab('url')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[12px] font-medium transition-all
                      ${coverTab === 'url' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Link2 size={12} /> URL de imagen
                  </button>
                </div>

                {coverTab === 'upload' ? (
                  <ImageUpload
                    preview={imagePreview && !imagePreview.startsWith('gradient:') ? imagePreview : null}
                    setPreview={(url) => {
                      setImagePreview(url);
                      if (url) {
                        setSelectedCover(null);
                        setCoverUrlInput('');
                        setErrors((prev) => ({ ...prev, thumbnail: '' }));
                      }
                    }}
                  />
                ) : (
                  <CoverUrlInput
                    value={coverUrlInput}
                    onChange={setCoverUrlInput}
                    onApply={(url) => {
                      setImagePreview(url);
                      setSelectedCover(null);
                      setErrors((prev) => ({ ...prev, thumbnail: '' }));
                    }}
                    onClear={() => setImagePreview(null)}
                    currentPreview={imagePreview && !imagePreview.startsWith('gradient:') ? imagePreview : null}
                  />
                )}
                {errors.thumbnail && (
                  <p className="mt-2 text-[11px] text-red-400">{errors.thumbnail}</p>
                )}
              </SectionCard>

              <SectionCard icon={Link2} title={<>Enlaces y Recursos <Req /></>}>
                <UrlListInput
                  items={videos}
                  setItems={setVideos}
                  placeholder="https://youtube.com, figma.com, docs.google.com..."
                  maxItems={10}
                />
                <p className="text-[11px] text-muted-foreground/60 mt-2">YouTube, Vimeo, Figma, Google Docs/Slides u otros · {videos.length}/10</p>
                {errors.videos && (
                  <p className="mt-1 text-[11px] text-red-400">{errors.videos}</p>
                )}
              </SectionCard>

              <SectionCard icon={FileText} title={<>Documentos <Req /></>}>
                <FileUpload
                  files={docs}
                  setFiles={setDocs}
                />
                <button
                  type="button"
                  onClick={openDrivePicker}
                  className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-blue-400/40 bg-blue-500/5
                    px-4 py-2.5 text-[12px] font-medium text-blue-600 dark:text-blue-400
                    hover:border-blue-400/70 hover:bg-blue-500/10 transition-all w-full justify-center"
                >
                  <HardDrive size={14} />
                  Añadir desde Drive
                </button>
                {errors.docs && (
                  <p className="mt-2 text-[11px] text-red-400">{errors.docs}</p>
                )}
              </SectionCard>
            </div>
          )}
        </div>

        {}
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
                  if (step === 1 && !validateStep1()) return;
                  if (step === 2 && !validateStep2()) return;
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