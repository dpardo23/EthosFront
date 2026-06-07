import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Briefcase, CalendarRange, Plus, Pencil, X, Trash2, Building2, Calendar,
  Sparkles, Loader2, Upload, Link as LinkIcon,
  GripVertical, MapPin, ArrowUpDown, Eye, Check, Map as MapIcon, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/shared/ui';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { experienceService } from '@/shared/services/experienceService';
import { fileService } from '@/shared/services/fileService';
import type { WorkExperience } from '@/shared/types/experience';

// Fix Leaflet default marker icons broken by Vite bundler
const _iconDefault = L.icon({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = _iconDefault;

// ─── Leaflet / OpenStreetMap ──────────────────────────────────────────────────
const DARK_TILE  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const LIGHT_TILE = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

// ─── Nominatim types ──────────────────────────────────────────────────────────
interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
}

// ─── Map helpers ──────────────────────────────────────────────────────────────
/** react-leaflet child: clicks on the map call `onClick` */
function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onClick(e.latlng.lat, e.latlng.lng) });
  return null;
}

/** react-leaflet child: updates the map view when `center` changes */
function SetMapView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom, { animate: false }); }, [center[0], center[1]]);
  return null;
}

/** react-leaflet child: flies the map to `position` (triggered by search selection) */
function FlyToLocation({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, Math.max(map.getZoom(), 13), { duration: 0.5 });
  }, [position[0], position[1]]);
  return null;
}

async function nominatimReverse(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'es' } }
    );
    const data = await res.json();
    return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

const MAX_DESC = 1000;

interface FormData {
  companyName: string;
  jobTitle: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  technologies: string;
  isFreelance: boolean;
  logoUrl: string;
  companyImageUrl: string;
  companyUrl: string;
}

const EMPTY_FORM: FormData = {
  companyName: '', jobTitle: '', location: '', latitude: null, longitude: null,
  startDate: '', endDate: '', isCurrent: false, description: '', technologies: '',
  isFreelance: false, logoUrl: '', companyImageUrl: '', companyUrl: '',
};




const clip = (s: string, n: number) => s.length > n ? `${s.slice(0, n)}…` : s;

const fmtDate = (d?: string) => {
  if (!d) return '';
  const dt = new Date(d);
  return new Date(dt.getTime() + dt.getTimezoneOffset() * 60000)
    .toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
};

const isImg = (s?: string) => !!s && (s.startsWith('data:image/') || s.startsWith('http'));

const parseTech = (t: unknown): string[] => {
  if (!t) return [];
  if (Array.isArray(t)) return t.filter(Boolean);
  if (typeof t === 'string') return t.split(',').map(x => x.trim()).filter(Boolean);
  return [];
};

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
  onUrlChange: (url: string) => void;
}

function UploadZone({ value, uploading, isDragging, hint, accept, inputRef, onDragOver, onDragLeave, onDrop, onClick, onRemove, onChange, onUrlChange }: UploadZoneProps) {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [urlDraft, setUrlDraft] = useState('');
  const [imgError, setImgError] = useState(false);

  const applyUrl = () => {
    const trimmed = urlDraft.trim();
    if (trimmed) onUrlChange(trimmed);
  };

  // Reset draft when image is removed externally
  useEffect(() => { if (!value) { setUrlDraft(''); setImgError(false); } }, [value]);

  if (uploading) {
    return (
      <div className="h-36 flex items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (value) {
    return (
      <div className="relative h-36 group rounded-xl border border-border bg-muted/30 overflow-hidden">
        {isImg(value) ? (
          <img src={value} alt="Preview" className="h-full w-full object-contain p-2" />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Upload className="h-7 w-7 text-primary" />
            <span className="text-xs font-medium text-foreground">Archivo adjunto</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={() => { onRemove(); setUrlDraft(''); setImgError(false); }}
            className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-white hover:bg-destructive/90 transition-colors">
            Eliminar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Mode tabs */}
      <div className="flex rounded-lg border border-border bg-muted/30 p-0.5 gap-0.5">
        <button type="button" onClick={() => setMode('upload')}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1 text-xs font-medium transition-colors ${
            mode === 'upload' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}>
          <Upload className="h-3 w-3" /> Archivo
        </button>
        <button type="button" onClick={() => setMode('url')}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1 text-xs font-medium transition-colors ${
            mode === 'url' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}>
          <LinkIcon className="h-3 w-3" /> URL
        </button>
      </div>

      {mode === 'upload' ? (
        <div
          onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} onClick={onClick}
          className={`h-28 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors ${
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
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="url"
              value={urlDraft}
              onChange={e => { setUrlDraft(e.target.value); setImgError(false); }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyUrl(); } }}
              placeholder="https://..."
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
            />
            <button type="button" onClick={applyUrl} disabled={!urlDraft.trim()}
              className="shrink-0 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors">
              Aplicar
            </button>
          </div>
          {urlDraft && urlDraft.startsWith('http') && (
            <div className={`h-20 rounded-xl border border-border bg-muted/30 overflow-hidden flex items-center justify-center ${imgError ? '' : ''}`}>
              {imgError ? (
                <p className="text-xs text-muted-foreground">No se pudo cargar la imagen</p>
              ) : (
                <img src={urlDraft} alt="Preview" className="h-full w-full object-contain p-2"
                  onError={() => setImgError(true)} />
              )}
            </div>
          )}
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
        <Briefcase className="h-7 w-7 text-primary" />
      </div>
      <h3 className="text-base font-semibold text-foreground">Sin experiencias registradas</h3>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
        Agrega tu experiencia laboral para mostrar tu trayectoria profesional.
      </p>
      <Button variant="primary" onClick={onAdd} className="mt-6 gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
        <Plus className="h-4 w-4" /> Agregar experiencia
      </Button>
    </div>
  );
}

// ─── Map preview (static tile image — no Leaflet, no z-index conflicts) ─────
function StaticMapPreview({ lat, lng, height = 'h-28', clickable = false }: {
  lat: number; lng: number; height?: string; clickable?: boolean;
}) {
  const resolvedTheme = useUiStore(s => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';
  const zoom = 14;
  const x = Math.floor((lng + 180) / 360 * (1 << zoom));
  const latRad = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * (1 << zoom));
  const sub = ['a', 'b', 'c'][Math.abs(x + y) % 3];
  const base = isDark ? 'dark_all' : 'light_all';
  const imgUrl = `https://${sub}.basemaps.cartocdn.com/${base}/${zoom}/${x}/${y}.png`;
  const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=14`;

  const inner = (
    <div className={`${height} w-full relative overflow-hidden rounded-xl border border-border mt-3`}>
      <img src={imgUrl} alt="Mapa de ubicación" className="w-full h-full object-cover" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-3.5 h-3.5 rounded-full bg-primary border-2 border-white shadow-lg" />
      </div>
      {clickable && (
        <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm rounded-md px-2 py-0.5 flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground border border-border/50">
          <ExternalLink className="h-2.5 w-2.5" /> Ver en mapa
        </div>
      )}
    </div>
  );

  if (clickable) {
    return (
      <a href={osmUrl} target="_blank" rel="noopener noreferrer"
        onClick={e => e.stopPropagation()} title="Abrir en OpenStreetMap"
        className="block hover:opacity-90 transition-opacity">
        {inner}
      </a>
    );
  }
  return inner;
}

// ─── Location autocomplete (Nominatim / OpenStreetMap) ───────────────────────
interface LocationAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  onPlaceSelect: (address: string, lat: number, lng: number) => void;
  className?: string;
}

function LocationAutocomplete({ value, onChange, onPlaceSelect, className }: LocationAutocompleteProps) {
  const [inputVal, setInputVal] = useState(value);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value (e.g., when MapPickerModal confirms)
  useEffect(() => { setInputVal(value); }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // Debounced Nominatim search
  useEffect(() => {
    if (inputVal.length < 3) { setResults([]); setShowDropdown(false); return; }
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(inputVal)}&format=json&limit=6&addressdetails=0`,
          { signal: abortRef.current.signal, headers: { 'Accept-Language': 'es' } }
        );
        const data: NominatimResult[] = await res.json();
        setResults(data);
        setShowDropdown(data.length > 0);
      } catch (e: any) {
        if (e.name !== 'AbortError') setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [inputVal]);

  const handleSelect = useCallback((r: NominatimResult) => {
    setInputVal(r.display_name);
    onChange(r.display_name);
    onPlaceSelect(r.display_name, parseFloat(r.lat), parseFloat(r.lon));
    setShowDropdown(false);
    setResults([]);
  }, [onChange, onPlaceSelect]);

  return (
    <div ref={containerRef} className="relative flex-1">
      <input
        type="text"
        value={inputVal}
        onChange={e => {
          setInputVal(e.target.value);
          onChange(e.target.value);
        }}
        onFocus={() => results.length > 0 && setShowDropdown(true)}
        placeholder="Busca una dirección…"
        className={className}
        autoComplete="off"
      />
      {loading && (
        <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}
      {showDropdown && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
          {results.map(r => (
            <li key={r.place_id}>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); handleSelect(r); }}
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-xs text-foreground transition-colors hover:bg-muted"
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="line-clamp-2">{r.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Experience card ──────────────────────────────────────────────────────────
interface CardProps {
  exp: WorkExperience;
  reorderMode: boolean;
  deleteConfirmId: string | null;
  isDeleting: boolean;
  onView: () => void;
  onEdit: () => void;
  onRequestDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

function ExperienceCard({ exp, reorderMode, deleteConfirmId, isDeleting, onView, onEdit, onRequestDelete, onConfirmDelete, onCancelDelete }: CardProps) {
  const id = exp.workExperienceId || '';
  const isConfirming = deleteConfirmId === id;
  const techList = parseTech(exp.technologies);

  return (
    <motion.article
      layout
      className={`relative rounded-2xl border border-border bg-card/80 transition-colors duration-200 isolate ${!reorderMode ? 'hover:border-primary/25 hover:bg-card cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}
      whileHover={!reorderMode ? { scale: 1.005 } : {}}
      transition={SPRING}
      onClick={!reorderMode && !isConfirming ? onView : undefined}
    >
      {/* Banner — always shown for consistent card height */}
      <div className="w-full h-[72px] overflow-hidden rounded-t-2xl">
        {exp.companyImageUrl && isImg(exp.companyImageUrl) ? (
          <img src={exp.companyImageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/10 to-primary/5" />
        )}
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex gap-3">
          {/* Logo */}
          {isImg(exp.logoUrl ?? '') ? (
            <img src={exp.logoUrl!} alt={exp.companyName}
              className="mt-0.5 h-11 w-11 shrink-0 rounded-xl object-contain bg-white p-1 border border-border" />
          ) : (
            <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/15">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
          )}

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <h3 className="text-sm font-semibold text-foreground truncate shrink"
                    title={exp.jobTitle}>
                    {clip(exp.jobTitle, 42)}
                  </h3>
                  <div className="flex shrink-0 items-center gap-1">
                    {exp.isFreelance && (
                      <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-2 py-0.5 text-[10px] font-semibold text-violet-600 dark:text-violet-300 whitespace-nowrap">
                        Freelance
                      </span>
                    )}
                    {exp.isCurrent && (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        Actual
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 overflow-hidden">
                  <span className="text-sm font-medium text-primary truncate shrink"
                    title={exp.companyName}>
                    {clip(exp.companyName, 38)}
                  </span>
                  {exp.companyUrl && (
                    <a href={exp.companyUrl} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="shrink-0 text-muted-foreground/60 hover:text-primary transition-colors">
                      <LinkIcon className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarRange className="h-3 w-3" />
                    {fmtDate(exp.startDate)} – {exp.isCurrent ? 'Actualidad' : fmtDate(exp.endDate)}
                  </span>
                  {exp.location && (
                    exp.latitude != null && exp.longitude != null ? (
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${exp.latitude}&mlon=${exp.longitude}&zoom=14`}
                        target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        title="Ver en OpenStreetMap"
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors group"
                      >
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[150px]">{exp.location}</span>
                        <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
                      </a>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[160px]">{exp.location}</span>
                      </span>
                    )
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

            {/* Description preview */}
            {exp.description && (
              <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">{exp.description}</p>
            )}

            {/* Tech tags */}
            {techList.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {techList.slice(0, 5).map(t => (
                  <span key={t} className="inline-block max-w-[120px] truncate rounded-md bg-muted/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{t}</span>
                ))}
                {techList.length > 5 && (
                  <span className="rounded-md bg-muted/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">+{techList.length - 5}</span>
                )}
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
                <p className="text-xs font-medium text-destructive">¿Eliminar esta experiencia?</p>
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

// ─── Map Picker Modal (react-leaflet + Nominatim) ─────────────────────────────
interface MapPickerModalProps {
  initialLat?: number | null;
  initialLng?: number | null;
  initialLocation?: string;
  onConfirm: (address: string, lat: number, lng: number) => void;
  onClose: () => void;
}

function MapPickerModal({ initialLat, initialLng, initialLocation, onConfirm, onClose }: MapPickerModalProps) {
  const portalEl = typeof document !== 'undefined' ? document.getElementById('portal-root') : null;
  const resolvedTheme = useUiStore(s => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';
  const tileUrl = isDark ? DARK_TILE : LIGHT_TILE;

  const DEFAULT_CENTER: [number, number] = [4.711, -74.0721];
  const hasInitial = initialLat != null && initialLng != null;

  const [markerPos, setMarkerPos] = useState<[number, number] | null>(
    hasInitial ? [initialLat!, initialLng!] : null
  );
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [selectedAddress, setSelectedAddress] = useState(initialLocation || '');

  // Search state
  const [searchVal, setSearchVal] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDrop, setShowSearchDrop] = useState(false);
  const searchAbortRef = useRef<AbortController | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Close search dropdown on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node))
        setShowSearchDrop(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchVal.length < 3) { setSearchResults([]); setShowSearchDrop(false); return; }
    const t = setTimeout(async () => {
      searchAbortRef.current?.abort();
      searchAbortRef.current = new AbortController();
      setSearchLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchVal)}&format=json&limit=6&addressdetails=0`,
          { signal: searchAbortRef.current.signal, headers: { 'Accept-Language': 'es' } }
        );
        const data: NominatimResult[] = await res.json();
        setSearchResults(data);
        setShowSearchDrop(data.length > 0);
      } catch (e: any) {
        if (e.name !== 'AbortError') setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [searchVal]);

  const handleSearchSelect = useCallback((r: NominatimResult) => {
    const pos: [number, number] = [parseFloat(r.lat), parseFloat(r.lon)];
    setMarkerPos(pos);
    setFlyTarget(pos);
    setSelectedAddress(r.display_name);
    setSearchVal('');
    setShowSearchDrop(false);
  }, []);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    const pos: [number, number] = [lat, lng];
    setMarkerPos(pos);
    const addr = await nominatimReverse(lat, lng);
    setSelectedAddress(addr);
  }, []);

  const handleMarkerDrag = useCallback(async (lat: number, lng: number) => {
    const pos: [number, number] = [lat, lng];
    setMarkerPos(pos);
    const addr = await nominatimReverse(lat, lng);
    setSelectedAddress(addr);
  }, []);

  if (!portalEl) return null;

  const mapCenter: [number, number] = hasInitial ? [initialLat!, initialLng!] : DEFAULT_CENTER;
  const mapZoom = hasInitial ? 14 : 5;

  return createPortal(
    <div className="absolute inset-0 z-[60] flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Card */}
      <motion.div
        className="relative z-10 flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={SPRING_MODAL}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <MapIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-snug">Seleccionar ubicación</p>
              <p className="text-[11px] text-muted-foreground">Busca, haz clic en el mapa o arrastra el marcador</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search input + dropdown — z-[1001] to float above Leaflet tile/control layers (z-400 / z-1000) */}
        <div ref={searchContainerRef} className="relative z-[1001] shrink-0 px-4 pt-3 pb-2">
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchVal}
              onChange={e => { setSearchVal(e.target.value); if (e.target.value.length < 3) setShowSearchDrop(false); }}
              onFocus={() => searchResults.length > 0 && setShowSearchDrop(true)}
              placeholder="Busca una dirección o lugar…"
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-9 text-sm text-foreground outline-none transition-colors focus:border-primary"
              autoComplete="off"
            />
            {searchLoading && (
              <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
          {showSearchDrop && searchResults.length > 0 && (
            <ul className="absolute left-4 right-4 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
              {searchResults.map(r => (
                <li key={r.place_id}>
                  <button
                    type="button"
                    onMouseDown={e => { e.preventDefault(); handleSearchSelect(r); }}
                    className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-xs text-foreground transition-colors hover:bg-muted"
                  >
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="line-clamp-2">{r.display_name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Leaflet map */}
        <div style={{ height: 460 }} className="relative w-full">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            zoomControl
            scrollWheelZoom
            doubleClickZoom={false}
          >
            <TileLayer url={tileUrl} attribution={TILE_ATTRIBUTION} />
            <MapClickHandler onClick={handleMapClick} />
            {flyTarget && <FlyToLocation position={flyTarget} />}
            {markerPos && (
              <Marker
                position={markerPos}
                draggable
                eventHandlers={{
                  dragend: (e) => {
                    const ll = (e.target as L.Marker).getLatLng();
                    handleMarkerDrag(ll.lat, ll.lng);
                  },
                }}
              />
            )}
          </MapContainer>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-card px-5 py-3.5">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {markerPos ? (
              <>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <span className="truncate text-xs font-medium text-foreground">{selectedAddress || 'Ubicación seleccionada'}</span>
              </>
            ) : (
              <>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">Haz clic en el mapa para seleccionar una ubicación</span>
              </>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="ghost" onClick={onClose} className="text-sm">
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={!markerPos}
              onClick={() => markerPos && onConfirm(selectedAddress, markerPos[0], markerPos[1])}
              className="gap-1.5 text-sm bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Check className="h-3.5 w-3.5" /> Confirmar
            </Button>
          </div>
        </div>
      </motion.div>
    </div>,
    portalEl
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ExperiencePage() {
  const { profile: profile } = useAuthStore();
  const [experiences, setExperiences] = useState<WorkExperience[]>([]);
  const [ordered, setOrdered] = useState<WorkExperience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReorderMode, setIsReorderMode] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<WorkExperience | null>(null);
  const [detailExp, setDetailExp] = useState<WorkExperience | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const [isDragLogo, setIsDragLogo] = useState(false);
  const [isDragBanner, setIsDragBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const portalEl = typeof document !== 'undefined' ? document.getElementById('portal-root') : null;

  const load = async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    try {
      const data = await experienceService.getExperiences(profile.id);
      let list = Array.isArray(data) ? data : [];
      // Restore saved custom order from localStorage
      const savedOrder = localStorage.getItem(`ethoshub_exp_order_${profile.id}`);
      if (savedOrder) {
        try {
          const ids: string[] = JSON.parse(savedOrder);
          const map = new Map(list.map(e => [e.workExperienceId, e]));
          const sorted = ids.map(id => map.get(id)).filter(Boolean) as typeof list;
          const remaining = list.filter(e => !ids.includes(e.workExperienceId ?? ''));
          list = [...sorted, ...remaining];
        } catch { /* ignore malformed storage */ }
      }
      setExperiences(list);
      setOrdered([...list]);
    } catch (e) {
      console.error('[ExperiencePage]', e);
      setExperiences([]);
      setOrdered([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [profile?.id]);

  const openAdd = () => {
    setEditingExp(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setIsFormOpen(true);
  };

  const openEdit = (exp: WorkExperience) => {
    setEditingExp(exp);
    const tech = parseTech(exp.technologies).join(', ');
    setForm({
      companyName: exp.companyName || '',
      jobTitle: exp.jobTitle || '',
      location: exp.location || '',
      latitude: exp.latitude ?? null,
      longitude: exp.longitude ?? null,
      startDate: exp.startDate?.split('T')[0] || '',
      endDate: exp.endDate?.split('T')[0] || '',
      isCurrent: exp.isCurrent || false,
      description: exp.description || '',
      technologies: tech,
      isFreelance: exp.isFreelance || false,
      logoUrl: exp.logoUrl || '',
      companyImageUrl: exp.companyImageUrl || '',
      companyUrl: exp.companyUrl || '',
    });
    setErrors({});
    setIsFormOpen(true);
  };

  const closeForm = () => { setIsFormOpen(false); setEditingExp(null); }

  const REORDER_KEY = profile?.id ? `ethoshub_exp_order_${profile.id}` : null;

  const saveOrder = async () => {
    if (!profile?.id || !REORDER_KEY) return;
    setIsSavingOrder(true);
    try {
      // Persist custom order in localStorage
      const ids = ordered.map(e => e.workExperienceId).filter(Boolean);
      localStorage.setItem(REORDER_KEY, JSON.stringify(ids));
      // Attempt backend call; falls back gracefully if endpoint not available
      await experienceService.reorderExperiences?.(profile.id, ids as string[]);
      setExperiences([...ordered]);
      toast.success('Orden guardado');
    } catch {
      // Backend may not have the endpoint yet; order is still saved locally
      setExperiences([...ordered]);
      toast.success('Orden guardado localmente');
    } finally {
      setIsSavingOrder(false);
      setIsReorderMode(false);
    }
  };;

  const MAX_DATE = new Date().toISOString().split('T')[0]; // año actual como máximo

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.companyName.trim()) e.companyName = 'Obligatorio';
    else if (form.companyName.trim().length < 3) e.companyName = 'Mínimo 3 caracteres';
    if (!form.jobTitle.trim()) e.jobTitle = 'Obligatorio';
    else if (form.jobTitle.trim().length < 3) e.jobTitle = 'Mínimo 3 caracteres';
    if (!form.location.trim()) e.location = 'Obligatorio';
    if (!form.startDate) e.startDate = 'Obligatorio';
    else if (form.startDate > MAX_DATE) e.startDate = 'No puede ser una fecha futura';
    if (!form.description.trim()) e.description = 'Obligatorio';
    else if (form.description.trim().length < 20) e.description = 'Mínimo 20 caracteres';
    if (!form.isCurrent) {
      if (!form.endDate) e.endDate = 'Obligatorio';
      else if (form.endDate > MAX_DATE) e.endDate = 'No puede ser una fecha futura';
      else if (form.startDate && new Date(form.endDate) < new Date(form.startDate))
        e.endDate = 'Anterior al inicio';
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!profile?.id) return;
    if (!validate()) return;
    setIsSaving(true);
    try {
      const payload: any = { ...form, profileId: profile.id, endDate: form.endDate || null, technologies: form.technologies.trim() };
      if (editingExp?.workExperienceId) {
        await experienceService.updateExperience(profile.id, editingExp.workExperienceId, payload);
        toast.success('Experiencia actualizada');
      } else {
        await experienceService.addExperience(profile.id, payload);
        toast.success('Experiencia guardada');
      }
      await load();
      closeForm();
    } catch (e: any) {
      console.error('[ExperiencePage]', e);
      toast.error(e?.response?.data?.message || e?.message || 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!profile?.id) return;
    setIsDeleting(true);
    try {
      await experienceService.deleteExperience(profile.id, id);
      await load();
      setDeleteConfirmId(null);
      if (detailExp?.workExperienceId === id) setDetailExp(null);
      if (editingExp?.workExperienceId === id) closeForm();
      toast.success('Experiencia eliminada');
    } catch (e: any) {
      console.error('[ExperiencePage]', e);
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
      const url = await fileService.uploadFile(file);
      setForm(p => ({ ...p, logoUrl: url }));
    } catch { toast.error('Error al subir el logo'); } finally { setUploadingLogo(false); }
  };

  const mkBannerHandler = async (file: File) => {
    const ok = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!ok.includes(file.type)) { setErrors(p => ({ ...p, banner: 'JPG, PNG o WEBP' })); return; }
    setUploadingBanner(true);
    try {
      const url = await fileService.uploadFile(file);
      setForm(p => ({ ...p, companyImageUrl: url }));
    } catch { toast.error('Error al subir el banner'); } finally { setUploadingBanner(false); }
  };

  // Stats
  const uniqueCompanies = new Set(experiences.map(e => e.companyName).filter(Boolean)).size;
  let totalYears = 0;
  experiences.forEach(e => {
    if (e.startDate) {
      const s = new Date(e.startDate).getTime();
      const en = e.isCurrent || !e.endDate ? Date.now() : new Date(e.endDate).getTime();
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
                  <Briefcase className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-base font-semibold text-foreground">
                  {editingExp ? 'Editar experiencia' : 'Nueva experiencia'}
                </h2>
              </div>
              <button type="button" onClick={closeForm}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-5">

                {/* Company + Role */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between gap-1.5">
                      <span className="flex items-center gap-1.5"><Building2 className="h-3 w-3" /> Empresa *</span>
                      {!form.isFreelance && (
                        <span className={`normal-case tracking-normal font-normal tabular-nums ${form.companyName.length >= 70 ? 'text-destructive' : 'text-muted-foreground/60'}`}>
                          {form.companyName.length}/80
                        </span>
                      )}
                    </label>
                    <input type="text"
                      value={form.isFreelance ? 'Trabajo Independiente' : form.companyName}
                      disabled={form.isFreelance}
                      maxLength={80}
                      onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))}
                      className={`${inputCls(errors.companyName)} disabled:opacity-50 disabled:cursor-not-allowed`}
                    />
                    {errors.companyName && <p className="text-xs text-destructive">{errors.companyName}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between gap-1.5">
                      <span className="flex items-center gap-1.5"><Briefcase className="h-3 w-3" /> Cargo *</span>
                      <span className={`normal-case tracking-normal font-normal tabular-nums ${form.jobTitle.length >= 70 ? 'text-destructive' : 'text-muted-foreground/60'}`}>
                        {form.jobTitle.length}/80
                      </span>
                    </label>
                    <input type="text" value={form.jobTitle}
                      maxLength={80}
                      onChange={e => setForm(p => ({ ...p, jobTitle: e.target.value }))}
                      className={inputCls(errors.jobTitle)}
                    />
                    {errors.jobTitle && <p className="text-xs text-destructive">{errors.jobTitle}</p>}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" /> Inicio *
                    </label>
                    <input type="date" value={form.startDate} max={MAX_DATE}
                      onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                      onClick={e => (e.currentTarget as any).showPicker?.()}
                      className={`${inputCls(errors.startDate)} cursor-pointer`}
                    />
                    {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" /> Fin {!form.isCurrent && '*'}
                    </label>
                    <input type="date" value={form.endDate} min={form.startDate} max={MAX_DATE}
                      disabled={form.isCurrent}
                      onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                      onClick={e => (e.currentTarget as any).showPicker?.()}
                      className={`${inputCls(errors.endDate)} cursor-pointer disabled:opacity-50`}
                    />
                    {errors.endDate && <p className="text-xs text-destructive">{errors.endDate}</p>}
                  </div>
                </div>

                {/* Location + URL */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" /> Ubicación *
                      {form.latitude != null && (
                        <span className="ml-auto normal-case tracking-normal font-normal text-emerald-500 flex items-center gap-1">
                          <Check className="h-3 w-3" /> Geolocalizado
                        </span>
                      )}
                    </label>
                    <div className="flex gap-2">
                      <LocationAutocomplete
                        value={form.location}
                        className={`${inputCls(errors.location)} flex-1`}
                        onChange={val => setForm(p => ({ ...p, location: val, latitude: null, longitude: null }))}
                        onPlaceSelect={(addr, lat, lng) => setForm(p => ({ ...p, location: addr, latitude: lat, longitude: lng }))}
                      />
                      <button
                        type="button"
                        title="Abrir mapa para seleccionar"
                        onClick={() => setIsMapPickerOpen(true)}
                        className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-colors"
                      >
                        <MapIcon className="h-4 w-4" />
                      </button>
                    </div>
                    {errors.location && <p className="text-xs text-destructive">{errors.location}</p>}
                    {form.latitude != null && form.longitude != null && (
                      <StaticMapPreview lat={form.latitude} lng={form.longitude} height="h-24" />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <LinkIcon className="h-3 w-3" /> Sitio web empresa
                    </label>
                    <input type="url" value={form.companyUrl} placeholder="https://..."
                      onChange={e => setForm(p => ({ ...p, companyUrl: e.target.value }))}
                      className={inputCls()}
                    />
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="flex flex-wrap gap-5">
                  <Checkbox
                    checked={form.isCurrent}
                    onChange={() => setForm(p => ({ ...p, isCurrent: !p.isCurrent, endDate: !p.isCurrent ? '' : p.endDate }))}
                    label="Trabajo aquí actualmente"
                  />
                  <Checkbox
                    checked={form.isFreelance}
                    onChange={() => setForm(p => ({ ...p, isFreelance: !p.isFreelance, companyName: !p.isFreelance ? 'Trabajo Independiente' : '' }))}
                    label="Freelance / Independiente"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>Descripción de logros *</span>
                    <span className="normal-case tracking-normal font-normal">{form.description.length}/{MAX_DESC}</span>
                  </label>
                  <textarea value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={4} maxLength={MAX_DESC}
                    className={`w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors ${errors.description ? 'border-destructive' : 'border-border focus:border-primary'}`}
                  />
                  {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
                </div>

                {/* Technologies */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tecnologías / Stack
                  </label>
                  <input type="text" value={form.technologies} placeholder="React, TypeScript, Node.js..."
                    onChange={e => setForm(p => ({ ...p, technologies: e.target.value }))}
                    className={inputCls()}
                  />
                  <p className="text-xs text-muted-foreground">Separadas por coma</p>
                </div>

                {/* Uploads */}
                <div className="border-t border-border pt-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Imágenes opcionales</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-foreground">Logo empresa</p>
                      <UploadZone
                        value={form.logoUrl} uploading={uploadingLogo} isDragging={isDragLogo}
                        hint="JPG, PNG, SVG, WEBP" accept="image/*" inputRef={logoRef}
                        onDragOver={e => { e.preventDefault(); setIsDragLogo(true); }}
                        onDragLeave={e => { e.preventDefault(); setIsDragLogo(false); }}
                        onDrop={e => { e.preventDefault(); setIsDragLogo(false); if (e.dataTransfer.files[0]) mkLogoHandler(e.dataTransfer.files[0]); }}
                        onClick={() => logoRef.current?.click()}
                        onRemove={() => { setForm(p => ({ ...p, logoUrl: '' })); if (logoRef.current) logoRef.current.value = ''; }}
                        onChange={e => { if (e.target.files?.[0]) mkLogoHandler(e.target.files[0]); }}
                        onUrlChange={url => setForm(p => ({ ...p, logoUrl: url }))}
                      />
                      {errors.logo && <p className="text-xs text-destructive">{errors.logo}</p>}
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-foreground">Banner empresa</p>
                      <UploadZone
                        value={form.companyImageUrl} uploading={uploadingBanner} isDragging={isDragBanner}
                        hint="JPG, PNG, WEBP" accept="image/*" inputRef={bannerRef}
                        onDragOver={e => { e.preventDefault(); setIsDragBanner(true); }}
                        onDragLeave={e => { e.preventDefault(); setIsDragBanner(false); }}
                        onDrop={e => { e.preventDefault(); setIsDragBanner(false); if (e.dataTransfer.files[0]) mkBannerHandler(e.dataTransfer.files[0]); }}
                        onClick={() => bannerRef.current?.click()}
                        onRemove={() => { setForm(p => ({ ...p, companyImageUrl: '' })); if (bannerRef.current) bannerRef.current.value = ''; }}
                        onChange={e => { if (e.target.files?.[0]) mkBannerHandler(e.target.files[0]); }}
                        onUrlChange={url => setForm(p => ({ ...p, companyImageUrl: url }))}
                      />
                      {errors.banner && <p className="text-xs text-destructive">{errors.banner}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex shrink-0 items-center justify-between border-t border-border bg-card px-6 py-4">
                <div>
                  {editingExp?.workExperienceId && (
                    <Button type="button" variant="ghost"
                      onClick={() => handleDelete(editingExp.workExperienceId!)}
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
      {detailExp && (
        <div className="absolute inset-0 z-40 flex justify-end">
          <motion.div
            className="absolute inset-0 bg-background/60 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setDetailExp(null)}
          />
          <motion.div
            className="relative flex flex-col w-full sm:w-[520px] max-w-full h-full bg-card border-l border-border shadow-2xl overflow-hidden"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 36 }}
          >
            {/* ── Panel header ── */}
            <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4 bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-3 min-w-0">
                {isImg(detailExp.logoUrl ?? '') ? (
                  <img src={detailExp.logoUrl!} alt={detailExp.companyName}
                    className="h-10 w-10 shrink-0 rounded-xl object-contain bg-white p-1 border border-border shadow-sm" />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate leading-snug">{detailExp.jobTitle}</p>
                  <p className="text-xs text-primary/80 font-medium truncate mt-0.5">{detailExp.companyName}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1 ml-2">
                <button onClick={() => { setDetailExp(null); openEdit(detailExp); }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title="Editar">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setDetailExp(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title="Cerrar">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">

              {/* Hero banner with gradient overlay */}
              {isImg(detailExp.companyImageUrl ?? '') ? (
                <div className="relative w-full h-44 overflow-hidden bg-muted">
                  <img src={detailExp.companyImageUrl!} alt="Banner empresa" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                  {/* Logo floating over banner */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-center gap-3 min-w-0">
                    {isImg(detailExp.logoUrl ?? '') && (
                      <img src={detailExp.logoUrl!} alt={detailExp.companyName}
                        className="h-12 w-12 shrink-0 rounded-xl object-contain bg-white p-1.5 border-2 border-white/20 shadow-lg" />
                    )}
                    <div className="min-w-0 overflow-hidden">
                      <p className="text-white font-bold text-sm drop-shadow truncate">{detailExp.jobTitle}</p>
                      <p className="text-white/80 text-xs drop-shadow truncate">{detailExp.companyName}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-20 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 border-b border-border flex items-center px-5 gap-3">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_0%_50%,_hsl(var(--primary)/0.15)_0%,_transparent_100%)]" />
                  {isImg(detailExp.logoUrl ?? '') && (
                    <img src={detailExp.logoUrl!} alt={detailExp.companyName}
                      className="relative h-11 w-11 rounded-xl object-contain bg-white p-1.5 border border-border shadow-sm shrink-0" />
                  )}
                  <div className="relative min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">{detailExp.jobTitle}</p>
                    <p className="text-xs text-muted-foreground truncate">{detailExp.companyName}</p>
                  </div>
                </div>
              )}

              <div className="p-5 space-y-5">

                {/* Status + type badges */}
                <div className="flex flex-wrap gap-2">
                  {detailExp.isCurrent && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Trabajo actual
                    </span>
                  )}
                  {detailExp.isFreelance && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-600 dark:text-violet-300">
                      Freelance / Independiente
                    </span>
                  )}
                </div>

                {/* Meta grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 rounded-xl border border-border bg-muted/20 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                      <CalendarRange className="h-3 w-3" /> Período
                    </p>
                    <p className="text-xs font-medium text-foreground">
                      {fmtDate(detailExp.startDate)}
                      <span className="text-muted-foreground mx-1.5">→</span>
                      {detailExp.isCurrent ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Actualidad</span>
                      ) : fmtDate(detailExp.endDate)}
                    </p>
                  </div>

                  {detailExp.location && (
                    <div className="col-span-2 rounded-xl border border-border bg-muted/20 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Ubicación
                      </p>
                      <p className="text-xs font-medium text-foreground">{detailExp.location}</p>
                      {detailExp.latitude != null && detailExp.longitude != null && (
                        <StaticMapPreview lat={detailExp.latitude} lng={detailExp.longitude} height="h-40" clickable />
                      )}
                    </div>
                  )}
                </div>

                {/* Company URL */}
                {detailExp.companyUrl && (
                  <a
                    href={detailExp.companyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary hover:bg-primary/10 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <LinkIcon className="h-4 w-4 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold">Sitio web empresa</p>
                        <p className="text-[11px] text-primary/60 truncate">{detailExp.companyUrl}</p>
                      </div>
                    </div>
                    <Eye className="h-3.5 w-3.5 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}

                {/* Description */}
                {detailExp.description && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Descripción de logros
                    </p>
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words overflow-hidden">{detailExp.description}</p>
                  </div>
                )}

                {/* Technologies */}
                {parseTech(detailExp.technologies).length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Stack / Tecnologías ({parseTech(detailExp.technologies).length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {parseTech(detailExp.technologies).map((t, i) => (
                        <motion.span
                          key={t}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.025, type: 'spring', stiffness: 400, damping: 28 }}
                          className="inline-block max-w-[160px] truncate rounded-lg border border-primary/15 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary/80"
                        >
                          {t}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* ── Panel footer ── */}
            <div className="shrink-0 border-t border-border bg-card/80 backdrop-blur-sm px-5 py-3 flex items-center justify-between gap-2">
              <button
                onClick={() => { setDetailExp(null); openEdit(detailExp); }}
                className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" /> Editar experiencia
              </button>
              <button
                onClick={() => { setDeleteConfirmId(detailExp.workExperienceId || null); setDetailExp(null); }}
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
                Perfil profesional
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Experiencia laboral.
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Registra tu trayectoria, empresas donde has trabajado y logros conseguidos.
              </p>
            </div>
            <div className="flex flex-row items-center gap-2.5 shrink-0 self-center">
              {[
                { v: totalYears > 0 ? `${Math.max(1, Math.floor(totalYears))}+` : '0', l: 'Años' },
                { v: String(uniqueCompanies), l: 'Empresas' },
                { v: String(experiences.length), l: 'Roles' },
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
            Trayectoria
            {experiences.length > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {experiences.length}
              </span>
            )}
          </h2>
          <div className="flex gap-2">
            {experiences.length > 1 && (
              isReorderMode ? (
                <Button variant="ghost" size="sm"
                  onClick={saveOrder}
                  disabled={isSavingOrder}
                  className="gap-1.5 text-xs bg-primary/10 text-primary border border-primary/20">
                  {isSavingOrder ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUpDown className="h-3.5 w-3.5" />}
                  Guardar orden
                </Button>
              ) : (
                <Button variant="ghost" size="sm"
                  onClick={() => { setIsReorderMode(true); setOrdered([...experiences]); }}
                  className="gap-1.5 text-xs text-muted-foreground">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  Reordenar
                </Button>
              )
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
        ) : experiences.length === 0 ? (
          <EmptyState onAdd={openAdd} />
        ) : (
          <div className="relative">
            <TimelineLine />

            {isReorderMode ? (
              <Reorder.Group axis="y" values={ordered} onReorder={setOrdered} className="space-y-3">
                {ordered.map((exp) => (
                  <Reorder.Item
                    key={exp.workExperienceId}
                    value={exp}
                    className="flex items-start gap-3"
                  >
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center mt-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <ExperienceCard
                        exp={exp} reorderMode
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
                {experiences.map((exp, i) => (
                  <motion.div
                    key={exp.workExperienceId || i}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...SPRING, delay: i * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center mt-1">
                      <motion.div
                        className={`h-2.5 w-2.5 rounded-full border-2 ${exp.isCurrent ? 'border-primary bg-primary' : 'border-border bg-background'}`}
                        animate={exp.isCurrent ? { scale: [1, 1.3, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      />
                    </div>
                    <div className="flex-1 min-w-0 pb-3">
                      <ExperienceCard
                        exp={exp} reorderMode={false}
                        deleteConfirmId={deleteConfirmId} isDeleting={isDeleting}
                        onView={() => setDetailExp(exp)}
                        onEdit={() => openEdit(exp)}
                        onRequestDelete={() => setDeleteConfirmId(exp.workExperienceId || null)}
                        onConfirmDelete={() => handleDelete(exp.workExperienceId!)}
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

      <AnimatePresence>
        {isMapPickerOpen && (
          <MapPickerModal
            key="map-picker"
            initialLat={form.latitude}
            initialLng={form.longitude}
            initialLocation={form.location}
            onConfirm={(address, lat, lng) => {
              setForm(p => ({ ...p, location: address, latitude: lat, longitude: lng }));
              setIsMapPickerOpen(false);
            }}
            onClose={() => setIsMapPickerOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
