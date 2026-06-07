import api from '@/shared/api/api';
import i18n from '@/i18n';
import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCircle2,
  Eye,
  EyeOff,
  Palette,
  Lock,
  Globe,
  Check,
  AlertTriangle,
  Camera,
  Save,
  Trash2,
  Download,
  Key,
  Zap,
  Settings2,
  BookOpen,
  Briefcase,
  Sun,
  Moon,
  Monitor,
  X,
  Mail,
  CheckCircle2,
  MapPin,
  Github,
  Loader2,
  Map as MapIcon,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { EthosOwlMascot } from '@/components/brand/EthosCoreLogo';
import { Button, LoadingSpinner } from '@/shared/ui';
import { useAuthStore } from '@/store/authStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useVisibilityStore } from '@/store/visibilityStore';
import { useConnectionsStore } from '@/store/connectionsStore';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/shared/lib/utils';
import type { PortfolioSection } from '@/shared/types';

type SectionId =
  | 'identidad'
  | 'personalizacion'
  | 'seguridad';

const SECTION_VARIANTS = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.14 } },
};


// ─── Primitives ────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-40',
        checked ? 'bg-violet-600' : 'bg-gray-200 dark:bg-gray-700',
      )}
    >
      <motion.div
        animate={{ x: checked ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
      />
    </button>
  );
}

function SectionCard({
  title,
  description,
  icon: Icon,
  iconColor = 'violet',
  danger = false,
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ElementType;
  iconColor?: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  const colorMap: Record<string, string> = {
    violet: 'bg-violet-500/10 text-violet-500 dark:text-violet-400',
    blue: 'bg-blue-500/10 text-blue-500 dark:text-blue-400',
    emerald: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-500 dark:text-amber-400',
    rose: 'bg-rose-500/10 text-rose-500 dark:text-rose-400',
    slate: 'bg-slate-500/10 text-slate-500 dark:text-slate-400',
    red: 'bg-red-500/10 text-red-400',
  };

  return (
    <div
      className={cn(
        'rounded-2xl border bg-card p-6',
        danger ? 'border-red-500/20' : 'border-border',
      )}
    >
      {(Icon || title) && (
        <div className="mb-5 flex items-start gap-4">
          {Icon && (
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                colorMap[iconColor],
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className={cn('font-semibold', danger ? 'text-red-400' : 'text-foreground')}>
              {title}
            </h3>
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

// ─── Nominatim / Map helpers ───────────────────────────────────────────────

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

const DARK_TILE  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const LIGHT_TILE = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR  = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onClick(e.latlng.lat, e.latlng.lng) });
  return null;
}

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

// ─── Map Picker Modal ──────────────────────────────────────────────────────

interface MapPickerModalProps {
  initialLat?: number | null;
  initialLng?: number | null;
  initialLocation?: string;
  onConfirm: (address: string, lat: number, lng: number) => void;
  onClose: () => void;
}

function MapPickerModal({ initialLat, initialLng, initialLocation, onConfirm, onClose }: MapPickerModalProps) {
  const isDark = useUiStore(s => s.resolvedTheme) === 'dark';
  const tileUrl = isDark ? DARK_TILE : LIGHT_TILE;
  const hasInitial = initialLat != null && initialLng != null;

  const [markerPos, setMarkerPos]     = useState<[number, number] | null>(hasInitial ? [initialLat!, initialLng!] : null);
  const [flyTarget, setFlyTarget]     = useState<[number, number] | null>(null);
  const [selAddr, setSelAddr]         = useState(initialLocation || '');
  const [searchVal, setSearchVal]     = useState('');
  const [results, setResults]         = useState<NominatimResult[]>([]);
  const [searching, setSearching]     = useState(false);
  const [showDrop, setShowDrop]       = useState(false);
  const abortRef                      = useRef<AbortController | null>(null);
  const dropRef                       = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setShowDrop(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  useEffect(() => {
    if (searchVal.length < 3) { setResults([]); setShowDrop(false); return; }
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchVal)}&format=json&limit=6&addressdetails=0`,
          { signal: abortRef.current.signal, headers: { 'Accept-Language': 'es' } }
        );
        const data: NominatimResult[] = await res.json();
        setResults(data);
        setShowDrop(data.length > 0);
      } catch (e: any) {
        if (e.name !== 'AbortError') setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [searchVal]);

  const handleSelect = useCallback((r: NominatimResult) => {
    const pos: [number, number] = [parseFloat(r.lat), parseFloat(r.lon)];
    setMarkerPos(pos);
    setFlyTarget(pos);
    setSelAddr(r.display_name);
    setSearchVal('');
    setShowDrop(false);
  }, []);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setMarkerPos([lat, lng]);
    const addr = await nominatimReverse(lat, lng);
    setSelAddr(addr);
  }, []);

  const handleMarkerDrag = useCallback(async (lat: number, lng: number) => {
    setMarkerPos([lat, lng]);
    const addr = await nominatimReverse(lat, lng);
    setSelAddr(addr);
  }, []);

  const mapCenter: [number, number] = hasInitial ? [initialLat!, initialLng!] : [-17.3935, -66.157];
  const mapZoom = hasInitial ? 14 : 6;

  const content = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5">
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="relative z-10 flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
              <MapIcon className="h-4 w-4 text-violet-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Seleccionar ubicación</p>
              <p className="text-[11px] text-muted-foreground">Busca, haz clic en el mapa o arrastra el marcador</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div ref={dropRef} className="relative z-[1001] shrink-0 px-4 pt-3 pb-2">
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchVal}
              onChange={e => { setSearchVal(e.target.value); if (e.target.value.length < 3) setShowDrop(false); }}
              onFocus={() => results.length > 0 && setShowDrop(true)}
              placeholder="Busca una dirección o lugar…"
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-9 text-sm text-foreground outline-none transition-colors focus:border-violet-500"
              autoComplete="off"
            />
            {searching && (
              <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
          {showDrop && results.length > 0 && (
            <ul className="absolute left-4 right-4 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
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

        {/* Map */}
        <div style={{ height: 420 }} className="relative w-full">
          <MapContainer
            center={mapCenter} zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            zoomControl scrollWheelZoom doubleClickZoom={false}
          >
            <TileLayer url={tileUrl} attribution={TILE_ATTR} />
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
                <span className="truncate text-xs font-medium text-foreground">{selAddr || 'Ubicación seleccionada'}</span>
              </>
            ) : (
              <>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">Haz clic en el mapa para seleccionar</span>
              </>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" onClick={onClose} size="sm">Cancelar</Button>
            <Button
              disabled={!markerPos}
              onClick={() => markerPos && onConfirm(selAddr, markerPos[0], markerPos[1])}
              size="sm"
            >
              <Check className="h-3.5 w-3.5" /> Confirmar
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(content, document.body)
    : null;
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function PreferencesPage() {
  const { profile: authProfile } = useAuthStore();
  const { preferences, updatePreferences } = usePreferencesStore();
  const { settings: visibility, fetchSettings } = useVisibilityStore();
  const { connections, fetchConnections } = useConnectionsStore();
  const { addToast, resolvedTheme, setTheme, theme: activeTheme } = useUiStore();
  const isDark = resolvedTheme === 'dark';

  const [activeSection, setActiveSection] = useState<SectionId>('identidad');

  // Profile form
  const [profile, setProfile] = useState({
    photoUrl: '',
    firstName: '',
    lastName: '',
    seniority: '',
    availabilityStatus: '',
    location: '',
    latitude: null as number | null,
    longitude: null as number | null,
    bio: '',
    website: '',
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [photoUrlError, setPhotoUrlError] = useState(false);
  const [profileSubmitted, setProfileSubmitted] = useState(false);

  // Map picker modal
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Email form - 3-step OTP flow
  const [emailStep, setEmailStep] = useState<1 | 2 | 3>(1);
  const [emailOtp, setEmailOtp] = useState('');
  const [emailNew, setEmailNew] = useState('');
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  // Password form - 3-step OTP flow
  const [passStep, setPassStep] = useState<1 | 2 | 3>(1);
  const [otpCode, setOtpCode] = useState('');
  const [passForm, setPassForm] = useState({ next: '', confirm: '' });
  const [showPassNew, setShowPassNew] = useState(false);
  const [showPassConfirm, setShowPassConfirm] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  // Account actions
  const [showDelete, setShowDelete] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showExportLoading, setShowExportLoading] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleteOtp, setDeleteOtp] = useState('');
  const [sendingDeleteOtp, setSendingDeleteOtp] = useState(false);

  // Crop modal
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });

  useEffect(() => {
    if (authProfile?.id) {
      fetchSettings(authProfile.id);
      fetchConnections(authProfile.id);
      api
        .get('/v1/profile/basic')
        .then((r) => {
          const d = r.data?.data ?? r.data;
          setProfile({
            photoUrl: d.photoUrl || '',
            firstName: d.firstName || '',
            lastName: d.lastName || '',
            seniority: d.seniority || '',
            availabilityStatus: d.availabilityStatus || '',
            location: d.location || '',
            latitude: d.latitude ?? null,
            longitude: d.longitude ?? null,
            bio: d.bio || authProfile.bio || '',
            website: d.website || authProfile.website || '',
          });
          // lat/lng stored in profile state, used as initialLat/Lng for MapPickerModal
        })
        .catch((error: any) => {
          if (error?.response?.status !== 401) {
            setProfile((p) => ({ ...p, bio: authProfile.bio || '', website: authProfile.website || '' }));
          }
        })
        .finally(() => setLoadingProfile(false));
    }
  }, [authProfile?.id]);

  const safePrefs = preferences ?? {
    profileId: authProfile?.id ?? '',
    language: 'es' as const,
    theme: 'dark' as const,
    showGithubHeatmap: true,
    showLinkedinRecommendations: false,
    sectionOrder: ['bio', 'skills', 'projects', 'experience', 'contact'] as PortfolioSection[],
    notifications: {
      connections: true,
      messages: true,
      projectViews: true,
      weeklyDigest: true,
      marketing: false,
      push_connections: true,
      push_messages: true,
      push_mentions: true,
    },
    privacy: {
      showEmail: false,
      showLocation: true,
      showConnections: true,
      allowMessages: true,
    },
  };

  // ─── Handlers ──────────────────────────────────────────────────────────

  async function handleSaveProfile() {
    setProfileSubmitted(true);
    if (!profile.firstName.trim()) {
      addToast({ type: 'error', title: 'El nombre es obligatorio' });
      return;
    }
    if (!profile.lastName.trim()) {
      addToast({ type: 'error', title: 'El apellido es obligatorio' });
      return;
    }
    if (profile.firstName.trim().length < 2) {
      addToast({ type: 'error', title: 'El nombre debe tener al menos 2 caracteres' });
      return;
    }
    if (profile.lastName.trim().length < 2) {
      addToast({ type: 'error', title: 'El apellido debe tener al menos 2 caracteres' });
      return;
    }
    if (profile.website && !/^https?:\/\/.+/.test(profile.website.trim())) {
      addToast({ type: 'error', title: 'El sitio web debe comenzar con http:// o https://' });
      return;
    }
    setSavingProfile(true);
    try {
      await api.patch('/v1/profile/basic', {
        photoUrl: profile.photoUrl,
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        seniority: profile.seniority,
        availabilityStatus: profile.availabilityStatus,
        location: profile.location.trim(),
        latitude: profile.latitude,
        longitude: profile.longitude,
        website: profile.website.trim(),
      });
      useAuthStore.setState((s) => ({
        profile: s.profile
          ? {
              ...s.profile,
              name: `${profile.firstName.trim()} ${profile.lastName.trim()}`.trim(),
              avatar: profile.photoUrl || s.profile.avatar,
              location: profile.location,
              website: profile.website,
            }
          : null,
      }));
      addToast({ type: 'success', title: 'Datos profesionales actualizados', message: `${profile.firstName} ${profile.lastName}` });
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      addToast({ type: 'error', title: msg || 'Error al guardar perfil' });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSaveBio() {
    if (!profile.bio.trim()) {
      addToast({ type: 'error', title: 'La biografía no puede estar vacía' });
      return;
    }
    if (profile.bio.trim().length < 10) {
      addToast({ type: 'error', title: 'La biografía debe tener al menos 10 caracteres' });
      return;
    }
    setSavingBio(true);
    try {
      await api.patch('/v1/profile/bio', { bio: profile.bio.trim() });
      useAuthStore.setState((s) => ({
        profile: s.profile ? { ...s.profile, bio: profile.bio } : null,
      }));
      addToast({ type: 'success', title: 'Biografía actualizada correctamente' });
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      addToast({ type: 'error', title: msg || 'Error al guardar biografía' });
    } finally {
      setSavingBio(false);
    }
  }

  async function handleSavePhotoUrl() {
    const url = profile.photoUrl.trim();
    if (!url || url.startsWith('data:')) {
      addToast({ type: 'error', title: 'Ingresa una URL válida de imagen' });
      return;
    }
    if (!/^https?:\/\/.+/.test(url)) {
      addToast({ type: 'error', title: 'La URL debe comenzar con http:// o https://' });
      return;
    }
    setSavingPhoto(true);
    try {
      await api.patch('/v1/profile/basic', { photoUrl: url });
      useAuthStore.setState((s) => ({
        profile: s.profile ? { ...s.profile, avatar: url } : null,
      }));
      addToast({ type: 'success', title: 'Foto de perfil actualizada' });
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      addToast({ type: 'error', title: msg || 'Error al guardar la foto' });
    } finally {
      setSavingPhoto(false);
    }
  }

  function handleMapConfirm(address: string, lat: number, lng: number) {
    const shortAddr = address.split(',').slice(0, 3).join(',').trim();
    setProfile((p) => ({
      ...p,
      location: shortAddr || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      latitude: lat,
      longitude: lng,
    }));
    setShowMapPicker(false);
    addToast({ type: 'success', title: 'Ubicación seleccionada en el mapa' });
  }

  async function handleGithubHeatmapToggle(value: boolean) {
    if (value && !isGithubConnected) {
      addToast({
        type: 'error',
        title: 'Conecta tu cuenta de GitHub primero',
        message: 'Ve a Conexiones para vincular tu cuenta de GitHub.',
      });
      return;
    }
    updatePreferences({ showGithubHeatmap: value });
    try {
      await api.put('/v1/portfolio/settings', { showGithubHeatmap: value });
      addToast({ type: 'success', title: value ? 'Heatmap de GitHub activado' : 'Heatmap desactivado' });
    } catch {
      updatePreferences({ showGithubHeatmap: !value });
      addToast({ type: 'error', title: 'Error al actualizar heatmap' });
    }
  }

  async function handleRequestEmailOtp() {
    setSendingEmailOtp(true);
    try {
      await api.post('/v1/auth/request-email-change');
      setEmailStep(2);
      addToast({ type: 'success', title: 'Código enviado', message: 'Revisa tu correo actual.' });
    } catch (err: any) {
      const status = err?.response?.status;
      const msg    = err?.response?.data?.message;
      if (status === 429) {
        addToast({ type: 'error', title: msg || 'Solo puedes cambiar tu correo una vez al mes' });
      } else {
        addToast({ type: 'error', title: 'Error al enviar código de verificación' });
      }
    } finally {
      setSendingEmailOtp(false);
    }
  }

  async function handleVerifyEmailOtp() {
    if (emailOtp.length < 6) {
      addToast({ type: 'error', title: 'Ingresa el código de 6 dígitos' });
      return;
    }
    setVerifyingEmailOtp(true);
    try {
      await api.post('/v1/auth/verify-otp', { otpCode: emailOtp, purpose: 'change_email' });
      setEmailStep(3);
    } catch {
      addToast({ type: 'error', title: 'Código inválido o expirado', message: 'Verifica el código e inténtalo de nuevo.' });
    } finally {
      setVerifyingEmailOtp(false);
    }
  }

  async function handleChangeEmail() {
    if (!emailNew || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNew)) {
      addToast({ type: 'error', title: 'Ingresa un correo válido' });
      return;
    }
    // Client-side check: new email can't be same as current
    const currentEmail = authProfile?.email || '';
    if (emailNew.trim().toLowerCase() === currentEmail.trim().toLowerCase()) {
      addToast({ type: 'error', title: 'El nuevo correo no puede ser igual al actual' });
      return;
    }
    setSavingEmail(true);
    try {
      await api.patch('/v1/auth/change-email', { otpCode: emailOtp, newEmail: emailNew });
      useAuthStore.setState((s) => ({ profile: s.profile ? { ...s.profile, email: emailNew } : null }));
      setEmailNew('');
      setEmailOtp('');
      setEmailStep(1);
      addToast({ type: 'success', title: 'Correo actualizado correctamente' });
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      addToast({ type: 'error', title: msg || 'Error al cambiar correo' });
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleRequestOtp() {
    setSendingOtp(true);
    try {
      await api.post('/v1/auth/request-password-change');
      setPassStep(2);
      addToast({ type: 'success', title: 'Código enviado', message: 'Revisa tu correo electrónico.' });
    } catch (err: any) {
      const status = err?.response?.status;
      const msg    = err?.response?.data?.message;
      if (status === 429) {
        addToast({ type: 'error', title: msg || 'Solo puedes cambiar tu contraseña una vez por semana' });
      } else {
        addToast({ type: 'error', title: 'Error al enviar código de verificación' });
      }
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyOtp() {
    if (otpCode.length < 6) {
      addToast({ type: 'error', title: 'Ingresa el código de 6 dígitos' });
      return;
    }
    setVerifyingOtp(true);
    try {
      await api.post('/v1/auth/verify-otp', { otpCode, purpose: 'change_password' });
      setPassStep(3);
    } catch {
      addToast({ type: 'error', title: 'Código inválido o expirado', message: 'Verifica el código e inténtalo de nuevo.' });
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function handleChangePassword() {
    if (passForm.next !== passForm.confirm) {
      addToast({ type: 'error', title: 'Las contraseñas no coinciden' });
      return;
    }
    if (passForm.next.length < 8) {
      addToast({ type: 'error', title: 'Mínimo 8 caracteres' });
      return;
    }
    setSavingPass(true);
    try {
      await api.patch('/v1/auth/change-password', {
        otpCode,
        newPassword: passForm.next,
      });
      setPassForm({ next: '', confirm: '' });
      setOtpCode('');
      setPassStep(1);
      addToast({ type: 'success', title: 'Contraseña actualizada correctamente' });
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      addToast({ type: 'error', title: msg || 'Error al cambiar contraseña' });
    } finally {
      setSavingPass(false);
    }
  }

  async function handleExportData() {
    setShowExportLoading(true);
    try {
      const response = await api.get('/v1/auth/export-data');
      const exportData = response.data?.data ?? response.data;
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ethoshub-datos-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast({ type: 'success', title: 'Datos exportados', message: 'Archivo JSON descargado.' });
    } catch {
      addToast({ type: 'error', title: 'Error al exportar datos' });
    } finally {
      setShowExportLoading(false);
    }
  }

  async function handleRequestDeleteOtp() {
    setSendingDeleteOtp(true);
    try {
      await api.post('/v1/auth/request-account-delete');
      setDeleteStep(2);
      addToast({ type: 'success', title: 'Código enviado', message: 'Revisa tu correo electrónico.' });
    } catch {
      addToast({ type: 'error', title: 'Error al enviar código de verificación' });
    } finally {
      setSendingDeleteOtp(false);
    }
  }

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      addToast({ type: 'error', title: 'Formato no soportado', message: 'Usa JPG, PNG, WebP o GIF.' });
      return;
    }
    setPhotoUrlError(false);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropSrc(ev.target?.result as string);
      setCropOffset({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingCrop(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: cropOffset.x, oy: cropOffset.y };
  }, [cropOffset]);

  const handleCropMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingCrop) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    setCropOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
  }, [isDraggingCrop]);

  const handleCropSave = () => {
    if (!cropSrc) return;
    setProfile((p) => ({ ...p, photoUrl: cropSrc }));
    setPhotoUrlError(false);
    setCropSrc(null);
    setCropOffset({ x: 0, y: 0 });
    addToast({ type: 'success', title: 'Foto seleccionada', message: 'Guarda el perfil para aplicar el cambio.' });
  };

  async function handleDeleteAccount() {
    if (deleteOtp.length < 6) {
      addToast({ type: 'error', title: 'Ingresa el código de 6 dígitos' });
      return;
    }
    setDeletingAccount(true);
    try {
      await api.delete('/v1/auth/account', { data: { otpCode: deleteOtp } });
      await useAuthStore.getState().logout();
    } catch {
      addToast({ type: 'error', title: 'Código inválido o expirado. Intenta de nuevo.' });
      setDeletingAccount(false);
    }
  }

  // ─── Nav config ────────────────────────────────────────────────────────

  const navItems: {
    id: SectionId;
    label: string;
    icon: React.ElementType;
  }[] = [
    { id: 'identidad', label: 'Identidad', icon: UserCircle2 },
    { id: 'personalizacion', label: 'Personalización', icon: Palette },
    { id: 'seguridad', label: 'Seguridad', icon: Lock },
  ];

  const isGithubConnected = connections.some((c) => c.provider === 'github' && c.status === 'connected');

  const inputCls =
    'flex h-10 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:border-violet-500/60 transition-all';

  const selectCls =
    'flex h-10 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:border-violet-500/60 transition-all cursor-pointer';

  const textareaCls =
    'flex w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:border-violet-500/60 transition-all';

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div
        className="relative mb-6 overflow-hidden rounded-2xl"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #1a0533 0%, #0d0218 40%, #0a0a14 60%, #0c0824 100%)'
            : 'linear-gradient(135deg, #f5f0ff 0%, #ede9fe 50%, #e8e0ff 100%)',
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.06] dark:opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(168,85,247,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.8) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-20 dark:opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.6) 0%, transparent 70%)' }} />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-600 dark:text-violet-300">
                <Settings2 className="h-3 w-3" />
                Centro de Control Profesional
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                Tu espacio de gestión
              </h1>
              <p className="mt-1.5 max-w-lg text-sm text-gray-500 dark:text-gray-400">
                Controla tu identidad, visibilidad, analíticas y cuenta desde un solo lugar.
              </p>
            </div>

            {authProfile && (
              <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/60 p-3 backdrop-blur-sm dark:border-white/10 dark:bg-black/30 sm:p-4">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
                  {authProfile.avatar ? (
                    <img
                      src={authProfile.avatar}
                      alt={authProfile.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-violet-600/20 text-lg font-bold text-violet-600 dark:text-violet-400">
                      {authProfile.name?.[0]}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900 dark:text-white">{authProfile.name}</p>
                  <p className="truncate text-xs text-violet-600 dark:text-violet-400">
                    {authProfile.profession || authProfile.role}
                  </p>
                  {visibility?.slug && (
                    <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">
                      bytebusters.tis.cs.umss.edu.bo/p/{visibility.slug}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile nav ──────────────────────────────────────────────── */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide lg:hidden">
        {navItems.map((item) => {
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'bg-violet-600 text-white shadow-[0_0_20px_rgba(124,58,237,0.25)]'
                  : 'border border-border bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* ── Main layout ─────────────────────────────────────────────── */}
      <div className="flex gap-6">
        {/* Desktop sidebar nav */}
        <aside className="hidden w-52 shrink-0 self-start lg:block sticky top-6">
          <nav className="space-y-0.5 rounded-2xl border border-border bg-card p-2">
            {navItems.map((item) => {
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className="group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors"
                >
                  {active && (
                    <motion.div
                      layoutId="cc-active-indicator"
                      className="absolute inset-0 rounded-xl border border-violet-500/20 bg-violet-500/10"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <item.icon
                    className={cn(
                      'relative z-10 h-4 w-4 transition-colors',
                      active
                        ? 'text-violet-500 dark:text-violet-400'
                        : 'text-muted-foreground group-hover:text-foreground',
                    )}
                  />
                  <span
                    className={cn(
                      'relative z-10 font-medium transition-colors',
                      active
                        ? 'text-foreground'
                        : 'text-muted-foreground group-hover:text-foreground',
                    )}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

        </aside>

        {/* Section content */}
        <main className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            {/* ══ IDENTIDAD ════════════════════════════════════════════ */}
            {activeSection === 'identidad' && (
              <motion.div
                key="identidad"
                variants={SECTION_VARIANTS}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-4"
              >
                {loadingProfile ? (
                  <div className="flex items-center justify-center py-24">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : (
                  <>
                    {/* Avatar */}
                    <SectionCard
                      title="Foto de perfil"
                      description="Tu imagen pública en el portafolio y en el dashboard."
                      icon={Camera}
                      iconColor="violet"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        {/* Avatar preview */}
                        <div className="shrink-0">
                          <button
                            onClick={handleAvatarClick}
                            className="group relative h-24 w-24 overflow-hidden rounded-2xl border-2 border-dashed border-border transition-all hover:border-violet-500/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                            title="Cambiar foto de perfil"
                          >
                            {(profile.photoUrl || authProfile?.avatar) && !photoUrlError ? (
                              <img
                                src={profile.photoUrl || authProfile?.avatar}
                                alt="Avatar"
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onLoad={() => setPhotoUrlError(false)}
                                onError={() => setPhotoUrlError(true)}
                              />
                            ) : (
                              <div className={cn(
                                'flex h-full w-full flex-col items-center justify-center gap-1',
                                photoUrlError ? 'bg-red-500/10' : 'bg-violet-500/10',
                              )}>
                                {photoUrlError ? (
                                  <>
                                    <AlertTriangle className="h-5 w-5 text-red-400" />
                                    <span className="text-[9px] text-red-400 text-center px-1">URL inválida</span>
                                  </>
                                ) : (
                                  <span className="text-2xl font-bold text-violet-500 dark:text-violet-400">
                                    {(profile.firstName || authProfile?.name || '?')[0]}
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                              <Camera className="h-5 w-5 text-white" />
                              <span className="text-[10px] font-medium text-white">Cambiar</span>
                            </div>
                          </button>
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <p className="text-sm font-medium text-foreground">Foto de perfil</p>
                          <p className="text-xs text-muted-foreground">
                            JPG, PNG o WebP · Recomendado: cuadrada, mínimo 200×200 px
                          </p>
                          <button
                            onClick={handleAvatarClick}
                            className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-medium text-foreground transition-all hover:border-violet-500/40 hover:bg-violet-500/5"
                          >
                            <Camera className="h-3.5 w-3.5" />
                            Seleccionar imagen
                          </button>
                          <div>
                            <label className="mb-1 block text-xs text-muted-foreground">
                              O pega una URL de imagen
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="url"
                                value={profile.photoUrl.startsWith('data:') ? '' : profile.photoUrl}
                                onChange={(e) => {
                                  setPhotoUrlError(false);
                                  setProfile({ ...profile, photoUrl: e.target.value });
                                }}
                                placeholder="https://ejemplo.com/foto.jpg"
                                maxLength={300}
                                className={cn(
                                  inputCls, 'text-xs flex-1',
                                  photoUrlError && 'border-red-500/50 focus-visible:ring-red-500/40',
                                )}
                              />
                              <Button
                                size="sm"
                                onClick={handleSavePhotoUrl}
                                disabled={savingPhoto || !profile.photoUrl || profile.photoUrl.startsWith('data:')}
                                className="shrink-0"
                              >
                                {savingPhoto ? <LoadingSpinner size="sm" /> : <Save className="h-3.5 w-3.5" />}
                                Guardar
                              </Button>
                            </div>
                            {photoUrlError && (
                              <p className="mt-1 text-xs text-red-400">No se pudo cargar la imagen. Verifica la URL.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </SectionCard>

                    {/* Professional data */}
                    <SectionCard
                      title="Datos profesionales"
                      description="Nombre, nivel y disponibilidad que aparecen en tu portafolio."
                      icon={Briefcase}
                      iconColor="violet"
                    >
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
                            <span>Nombre <span className="text-red-400">*</span></span>
                            <span className={profile.firstName.length >= 78 ? 'text-amber-500' : ''}>{profile.firstName.length}/80</span>
                          </label>
                          <input
                            value={profile.firstName}
                            onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                            placeholder="Tu nombre"
                            maxLength={80}
                            className={cn(inputCls, profileSubmitted && !profile.firstName.trim() && 'border-red-500/60 focus-visible:ring-red-500/40')}
                          />
                          {profileSubmitted && !profile.firstName.trim() && (
                            <p className="mt-1 text-xs text-red-400">Campo obligatorio</p>
                          )}
                        </div>
                        <div>
                          <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
                            <span>Apellido <span className="text-red-400">*</span></span>
                            <span className={profile.lastName.length >= 78 ? 'text-amber-500' : ''}>{profile.lastName.length}/80</span>
                          </label>
                          <input
                            value={profile.lastName}
                            onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                            placeholder="Tu apellido"
                            maxLength={80}
                            className={cn(inputCls, profileSubmitted && !profile.lastName.trim() && 'border-red-500/60 focus-visible:ring-red-500/40')}
                          />
                          {profileSubmitted && !profile.lastName.trim() && (
                            <p className="mt-1 text-xs text-red-400">Campo obligatorio</p>
                          )}
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                            Nivel profesional
                          </label>
                          <select
                            value={profile.seniority}
                            onChange={(e) =>
                              setProfile({ ...profile, seniority: e.target.value })
                            }
                            className={selectCls}
                          >
                            <option value="">Selecciona tu nivel</option>
                            <option value="Junior">Junior</option>
                            <option value="Mid">Mid Level</option>
                            <option value="Senior">Senior</option>
                            <option value="Lead">Lead / Principal</option>
                            <option value="Architect">Arquitecto / Staff</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                            Disponibilidad
                          </label>
                          <select
                            value={profile.availabilityStatus}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                availabilityStatus: e.target.value,
                              })
                            }
                            className={selectCls}
                          >
                            <option value="">No especificado</option>
                            <option value="Disponible">Disponible para trabajar</option>
                            <option value="Ocupado">Ocupado actualmente</option>
                            <option value="Incógnito">Modo incógnito</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
                            Ubicación
                            <span className={profile.location.length >= 78 ? 'text-amber-500' : ''}>{profile.location.length}/80</span>
                          </label>
                          <div className="flex gap-2">
                            <input
                              value={profile.location}
                              onChange={(e) =>
                                setProfile({ ...profile, location: e.target.value, latitude: null, longitude: null })
                              }
                              placeholder="Ej: Cochabamba, Bolivia"
                              maxLength={80}
                              className={cn(inputCls, 'flex-1')}
                            />
                            <button
                              type="button"
                              onClick={() => setShowMapPicker(true)}
                              title="Seleccionar en mapa"
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background transition-colors hover:border-violet-500/40 hover:bg-violet-500/5"
                            >
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </div>
                          {profile.latitude != null && (
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              📍 {profile.latitude.toFixed(4)}, {profile.longitude?.toFixed(4)}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
                            Sitio web personal
                            <span className={profile.website.length >= 78 ? 'text-amber-500' : ''}>{profile.website.length}/80</span>
                          </label>
                          <input
                            value={profile.website}
                            onChange={(e) =>
                              setProfile({ ...profile, website: e.target.value })
                            }
                            placeholder="https://..."
                            maxLength={80}
                            className={inputCls}
                          />
                        </div>
                      </div>
                      <div className="mt-5 flex justify-end">
                        <Button
                          onClick={handleSaveProfile}
                          disabled={savingProfile}
                          size="sm"
                        >
                          {savingProfile ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Guardar perfil
                        </Button>
                      </div>
                    </SectionCard>

                    {/* Bio */}
                    <SectionCard
                      title="Biografía profesional"
                      description="Tu presentación pública en el portafolio. Sé conciso y directo."
                      icon={BookOpen}
                      iconColor="violet"
                    >
                      <textarea
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        rows={5}
                        maxLength={500}
                        placeholder="Escribe una presentación profesional concisa. Habla de tu especialidad, stack y lo que te hace único..."
                        className={textareaCls}
                      />
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {profile.bio.length} / 500 caracteres
                        </span>
                        <Button
                          onClick={handleSaveBio}
                          disabled={savingBio}
                          size="sm"
                        >
                          {savingBio ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Guardar bio
                        </Button>
                      </div>
                    </SectionCard>
                  </>
                )}
              </motion.div>
            )}

            {/* ══ PERSONALIZACIÓN ══════════════════════════════════════ */}
            {activeSection === 'personalizacion' && (
              <motion.div
                key="personalizacion"
                variants={SECTION_VARIANTS}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-4"
              >
                <SectionCard
                  title="Contenido del portafolio"
                  description="Activa o desactiva secciones de tu perfil público."
                  icon={Zap}
                  iconColor="emerald"
                >
                  <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">Heatmap de GitHub</p>
                        {!isGithubConnected && (
                          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                            Requiere conexión
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {isGithubConnected
                          ? 'Muestra tu actividad de commits en el portafolio público.'
                          : 'Conecta tu cuenta de GitHub para activar esta función.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!isGithubConnected && (
                        <a
                          href="/connections"
                          className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-violet-500/40 hover:text-foreground"
                        >
                          <Github className="h-3 w-3" />
                          Conectar
                        </a>
                      )}
                      <Toggle
                        checked={safePrefs.showGithubHeatmap && isGithubConnected}
                        onChange={handleGithubHeatmapToggle}
                        disabled={!isGithubConnected}
                      />
                    </div>
                  </div>
                </SectionCard>

                <SectionCard
                  title="Tema de la interfaz"
                  description="Elige cómo se ve el dashboard. El cambio se aplica al instante."
                  icon={Palette}
                  iconColor="emerald"
                >
                  <div className="relative flex h-11 w-full items-center rounded-xl border border-border bg-muted/40 p-1">
                    {/* Sliding indicator */}
                    {(['light', 'dark', 'system'] as const).map((t) =>
                      activeTheme === t ? (
                        <motion.div
                          key="theme-indicator"
                          layoutId="theme-segment-indicator"
                          className="absolute inset-y-1 rounded-lg bg-background shadow-sm border border-border/60"
                          style={{ width: 'calc(33.333% - 2.67px)', left: `calc(${(['light','dark','system'].indexOf(t)) * 33.333}% + 4px)` }}
                          transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                        />
                      ) : null,
                    )}
                    {(
                      [
                        { value: 'light',  label: 'Claro',   Icon: Sun     },
                        { value: 'dark',   label: 'Oscuro',  Icon: Moon    },
                        { value: 'system', label: 'Sistema', Icon: Monitor },
                      ] as const
                    ).map(({ value, label, Icon }) => {
                      const isActive = activeTheme === value;
                      return (
                        <button
                          key={value}
                          onClick={() => setTheme(value)}
                          className={cn(
                            'relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[13px] font-medium transition-colors duration-150',
                            isActive
                              ? 'text-foreground'
                              : 'text-muted-foreground hover:text-foreground',
                          )}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="hidden xs:inline sm:inline">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </SectionCard>

                <SectionCard
                  title="Idioma de la interfaz"
                  description="El cambio se aplica al instante en todo el dashboard."
                  icon={Globe}
                  iconColor="emerald"
                >
                  <div className="flex gap-3">
                    {([
                      { value: 'es', flag: '🇪🇸', label: 'Español' },
                      { value: 'en', flag: '🇬🇧', label: 'English' },
                      { value: 'pt', flag: '🇧🇷', label: 'Português' },
                    ] as const).map(({ value, flag, label }) => {
                      const isActive = i18n.language === value;
                      return (
                        <button
                          key={value}
                          onClick={() => {
                            i18n.changeLanguage(value);
                            localStorage.setItem('ethoshub_language', value);
                            updatePreferences({ language: value });
                          }}
                          className={cn(
                            'flex flex-1 flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-center transition-all duration-150',
                            isActive
                              ? 'border-violet-500 bg-violet-500/5 shadow-sm shadow-violet-500/10'
                              : 'border-border hover:border-violet-500/40 hover:bg-muted/30',
                          )}
                        >
                          <span className="text-2xl">{flag}</span>
                          <span className={cn('text-xs font-medium', isActive ? 'text-foreground' : 'text-muted-foreground')}>
                            {label}
                          </span>
                          {isActive && (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-500">
                              <Check className="h-2.5 w-2.5 text-white" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </SectionCard>
              </motion.div>
            )}

            {/* ══ SEGURIDAD ════════════════════════════════════════════ */}
            {activeSection === 'seguridad' && (
              <motion.div
                key="seguridad"
                variants={SECTION_VARIANTS}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-4"
              >
                {/* Password change — 3-step OTP flow */}
                <SectionCard
                  title="Cambiar contraseña"
                  description="Verificación por correo para proteger tu cuenta."
                  icon={Key}
                  iconColor="slate"
                >
                  {/* Step indicator */}
                  <div className="mb-5 flex items-center gap-2">
                    {([1, 2, 3] as const).map((s) => (
                      <div key={s} className="flex items-center gap-2">
                        <div
                          className={cn(
                            'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300',
                            passStep > s
                              ? 'bg-emerald-500 text-white'
                              : passStep === s
                              ? 'bg-violet-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {passStep > s ? <Check className="h-3 w-3" /> : s}
                        </div>
                        {s < 3 && (
                          <div
                            className={cn(
                              'h-px w-8 transition-all duration-500',
                              passStep > s ? 'bg-emerald-500' : 'bg-border',
                            )}
                          />
                        )}
                      </div>
                    ))}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {passStep === 1 && 'Solicitar código'}
                      {passStep === 2 && 'Verificar código'}
                      {passStep === 3 && 'Nueva contraseña'}
                    </span>
                  </div>

                  <AnimatePresence mode="wait">
                    {/* ─ Step 1: Request OTP ─ */}
                    {passStep === 1 && (
                      <motion.div
                        key="pass-step-1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="space-y-4"
                      >
                        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                            <Mail className="h-4 w-4 text-violet-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              Verificación por correo
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Te enviaremos un código de 6 dígitos a{' '}
                              <span className="font-medium text-foreground">
                                {authProfile?.email || 'tu correo'}
                              </span>{' '}
                              para confirmar el cambio.
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button onClick={handleRequestOtp} disabled={sendingOtp} size="sm">
                            {sendingOtp ? <LoadingSpinner size="sm" /> : <Mail className="h-4 w-4" />}
                            {sendingOtp ? 'Enviando...' : 'Solicitar cambio de contraseña'}
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {/* ─ Step 2: Enter OTP ─ */}
                    {passStep === 2 && (
                      <motion.div
                        key="pass-step-2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="space-y-4"
                      >
                        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">
                            Código enviado a <span className="font-semibold">{authProfile?.email}</span>
                          </p>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                            Código de verificación (6 dígitos)
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            className={cn(
                              inputCls,
                              'text-center font-mono text-xl tracking-[0.5em]',
                            )}
                            autoFocus
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => setPassStep(1)}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            ← Volver
                          </button>
                          <Button
                            onClick={handleVerifyOtp}
                            disabled={verifyingOtp || otpCode.length < 6}
                            size="sm"
                          >
                            {verifyingOtp ? <LoadingSpinner size="sm" /> : <Key className="h-4 w-4" />}
                            Verificar código
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {/* ─ Step 3: New password ─ */}
                    {passStep === 3 && (
                      <motion.div
                        key="pass-step-3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="space-y-3"
                      >
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                            Nueva contraseña
                          </label>
                          <div className="relative">
                            <input
                              type={showPassNew ? 'text' : 'password'}
                              value={passForm.next}
                              onChange={(e) => setPassForm({ ...passForm, next: e.target.value })}
                              placeholder="Mínimo 8 caracteres"
                              className={inputCls}
                              autoFocus
                            />
                            <button
                              onClick={() => setShowPassNew(!showPassNew)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPassNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                            Confirmar nueva contraseña
                          </label>
                          <div className="relative">
                            <input
                              type={showPassConfirm ? 'text' : 'password'}
                              value={passForm.confirm}
                              onChange={(e) => setPassForm({ ...passForm, confirm: e.target.value })}
                              placeholder="Repite la nueva contraseña"
                              className={cn(
                                inputCls,
                                passForm.confirm &&
                                  passForm.next !== passForm.confirm &&
                                  'border-red-500/50 focus-visible:ring-red-500/40',
                              )}
                            />
                            <button
                              onClick={() => setShowPassConfirm(!showPassConfirm)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPassConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {passForm.confirm && passForm.next !== passForm.confirm && (
                            <p className="mt-1 text-xs text-red-400">Las contraseñas no coinciden</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <button
                            onClick={() => setPassStep(2)}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            ← Volver
                          </button>
                          <Button
                            onClick={handleChangePassword}
                            disabled={
                              savingPass ||
                              !passForm.next ||
                              passForm.next !== passForm.confirm ||
                              passForm.next.length < 8
                            }
                            size="sm"
                          >
                            {savingPass ? <LoadingSpinner size="sm" /> : <Key className="h-4 w-4" />}
                            Actualizar contraseña
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </SectionCard>

                {/* Email change — 3-step OTP flow */}
                <SectionCard
                  title="Cambiar correo electrónico"
                  description="Verificación en tu correo actual para confirmar el cambio."
                  icon={Mail}
                  iconColor="blue"
                >
                  {/* Step indicator */}
                  <div className="mb-5 flex items-center gap-2">
                    {([1, 2, 3] as const).map((s) => (
                      <div key={s} className="flex items-center gap-2">
                        <div
                          className={cn(
                            'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300',
                            emailStep > s
                              ? 'bg-emerald-500 text-white'
                              : emailStep === s
                              ? 'bg-violet-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {emailStep > s ? <Check className="h-3 w-3" /> : s}
                        </div>
                        {s < 3 && (
                          <div
                            className={cn(
                              'h-px w-8 transition-all duration-500',
                              emailStep > s ? 'bg-emerald-500' : 'bg-border',
                            )}
                          />
                        )}
                      </div>
                    ))}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {emailStep === 1 && 'Solicitar código'}
                      {emailStep === 2 && 'Verificar código'}
                      {emailStep === 3 && 'Nuevo correo'}
                    </span>
                  </div>

                  <AnimatePresence mode="wait">
                    {/* ─ Step 1 ─ */}
                    {emailStep === 1 && (
                      <motion.div
                        key="email-step-1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="space-y-4"
                      >
                        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                            <Mail className="h-4 w-4 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              Verificación por correo
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Te enviaremos un código de 6 dígitos a{' '}
                              <span className="font-medium text-foreground">
                                {authProfile?.email || 'tu correo actual'}
                              </span>{' '}
                              para confirmar el cambio de dirección.
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button onClick={handleRequestEmailOtp} disabled={sendingEmailOtp} size="sm">
                            {sendingEmailOtp ? <LoadingSpinner size="sm" /> : <Mail className="h-4 w-4" />}
                            {sendingEmailOtp ? 'Enviando...' : 'Solicitar cambio de correo'}
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {/* ─ Step 2 ─ */}
                    {emailStep === 2 && (
                      <motion.div
                        key="email-step-2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="space-y-4"
                      >
                        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">
                            Código enviado a <span className="font-semibold">{authProfile?.email}</span>
                          </p>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                            Código de verificación (6 dígitos)
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={emailOtp}
                            onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            className={cn(inputCls, 'text-center font-mono text-xl tracking-[0.5em]')}
                            autoFocus
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => setEmailStep(1)}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            ← Volver
                          </button>
                          <Button
                            onClick={handleVerifyEmailOtp}
                            disabled={verifyingEmailOtp || emailOtp.length < 6}
                            size="sm"
                          >
                            {verifyingEmailOtp ? <LoadingSpinner size="sm" /> : <Key className="h-4 w-4" />}
                            Verificar código
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {/* ─ Step 3 ─ */}
                    {emailStep === 3 && (
                      <motion.div
                        key="email-step-3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="space-y-3"
                      >
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                            Nuevo correo electrónico
                          </label>
                          <input
                            type="email"
                            value={emailNew}
                            onChange={(e) => setEmailNew(e.target.value)}
                            placeholder="nuevo@correo.com"
                            className={cn(
                              inputCls,
                              emailNew &&
                                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNew) &&
                                'border-red-500/50 focus-visible:ring-red-500/40',
                            )}
                            autoFocus
                          />
                          {emailNew && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNew) && (
                            <p className="mt-1 text-xs text-red-400">Correo no válido</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <button
                            onClick={() => setEmailStep(2)}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            ← Volver
                          </button>
                          <Button
                            onClick={handleChangeEmail}
                            disabled={
                              savingEmail ||
                              !emailNew ||
                              !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNew)
                            }
                            size="sm"
                          >
                            {savingEmail ? <LoadingSpinner size="sm" /> : <Mail className="h-4 w-4" />}
                            Actualizar correo
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </SectionCard>

                {/* Export data */}
                <SectionCard
                  title="Exportar mis datos"
                  description="Descarga una copia completa de tu información en EthosHub."
                  icon={Download}
                  iconColor="slate"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      Recibirás un archivo JSON con todos tus datos, proyectos, skills y
                      configuración.
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleExportData}
                      disabled={showExportLoading}
                      size="sm"
                      className="shrink-0"
                    >
                      <Download className="h-4 w-4" />
                      Exportar datos
                    </Button>
                  </div>
                </SectionCard>

                {/* Danger zone */}
                <SectionCard
                  title="Zona de peligro"
                  description="Estas acciones son permanentes e irreversibles."
                  icon={AlertTriangle}
                  iconColor="red"
                  danger
                >
                  <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">Eliminar cuenta</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Elimina permanentemente tu cuenta y todos tus datos. Sin posibilidad
                          de recuperación.
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="shrink-0"
                        onClick={() => setShowDelete(true)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar cuenta
                      </Button>
                    </div>
                  </div>
                </SectionCard>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* ── Map picker modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showMapPicker && (
          <MapPickerModal
            initialLat={profile.latitude}
            initialLng={profile.longitude}
            initialLocation={profile.location}
            onConfirm={handleMapConfirm}
            onClose={() => setShowMapPicker(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Crop image modal — portaled into #portal-root (scoped to content area) ── */}
      {typeof document !== 'undefined' && document.getElementById('portal-root') &&
        createPortal(
          <AnimatePresence>
            {cropSrc && (
              <motion.div
                key="crop-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="absolute inset-0 z-[30] flex items-center justify-center p-4 bg-white/40 backdrop-blur-md dark:bg-black/55"
                onClick={() => setCropSrc(null)}
              >
                <motion.div
                  key="crop-card"
                  initial={{ opacity: 0, scale: 0.93, y: 18 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.93, y: 18 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">Recortar imagen</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Arrastra para encuadrar tu foto de perfil
                      </p>
                    </div>
                    <button
                      onClick={() => setCropSrc(null)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Crop area */}
                  <div
                    className="relative mx-auto overflow-hidden rounded-2xl border-2 border-dashed border-violet-500/40 bg-muted/30"
                    style={{ width: 280, height: 280 }}
                    onMouseMove={handleCropMouseMove}
                    onMouseUp={() => setIsDraggingCrop(false)}
                    onMouseLeave={() => setIsDraggingCrop(false)}
                  >
                    <img
                      src={cropSrc}
                      alt="Recorte"
                      draggable={false}
                      onMouseDown={handleCropMouseDown}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: `translate(calc(-50% + ${cropOffset.x}px), calc(-50% + ${cropOffset.y}px))`,
                        minWidth: '100%',
                        minHeight: '100%',
                        maxWidth: 'none',
                        cursor: isDraggingCrop ? 'grabbing' : 'grab',
                        userSelect: 'none',
                      }}
                    />
                    {/* Rule-of-thirds grid */}
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        backgroundImage:
                          'linear-gradient(rgba(168,85,247,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.14) 1px, transparent 1px)',
                        backgroundSize: '93.33px 93.33px',
                      }}
                    />
                    {/* Corner handles */}
                    {(['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'] as const).map((pos) => (
                      <div
                        key={pos}
                        className={cn('pointer-events-none absolute h-5 w-5 rounded-sm border-2 border-violet-400 opacity-75', pos)}
                      />
                    ))}
                  </div>

                  <p className="mt-3 text-center text-[11px] text-muted-foreground">
                    La imagen se guardará recortada en proporción 1:1
                  </p>

                  <div className="mt-4 flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setCropSrc(null)}>
                      Cancelar
                    </Button>
                    <Button className="flex-1" onClick={handleCropSave}>
                      <Check className="h-4 w-4" />
                      Guardar
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.getElementById('portal-root')!,
        )
      }

      {/* ── Export loading overlay (mascot) ─────────────────────────── */}
      <AnimatePresence>
        {showExportLoading && (
          <>
            <motion.div
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="fixed inset-0 z-[110] flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                className={cn(
                  'flex flex-col items-center gap-6 rounded-2xl border border-border px-10 py-10 shadow-2xl max-w-xs w-full',
                  isDark
                    ? 'bg-zinc-900/95 backdrop-blur-xl border-white/8 shadow-black/70'
                    : 'bg-white/95 backdrop-blur-xl shadow-black/20',
                )}
              >
                <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)' }}
                  />
                  <motion.div
                    className="absolute inset-0"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.6, ease: 'linear', repeat: Infinity }}
                  >
                    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                      <circle cx="60" cy="60" r="54" stroke="rgba(139,92,246,0.15)" strokeWidth="3" />
                      <path
                        d="M60 6 A54 54 0 0 1 113.97 67.5"
                        stroke="url(#prefExportGrad)"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="prefExportGrad" x1="60" y1="6" x2="113.97" y2="67.5" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#C084FC" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </motion.div>
                  <motion.div
                    className="relative z-10"
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity }}
                  >
                    <EthosOwlMascot size={76} floating={false} />
                  </motion.div>
                </div>
                <div className="text-center space-y-1.5">
                  <p className="text-sm font-bold text-foreground tracking-tight">Exportando datos...</p>
                  <p className="text-xs text-muted-foreground">
                    Recopilando tu perfil y proyectos · por favor espera
                  </p>
                  <div className="flex items-center justify-center gap-1 pt-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-violet-500"
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                        transition={{ duration: 1.2, ease: 'easeInOut', repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Delete confirmation modal (OTP flow) ───────────────────── */}
      <AnimatePresence>
        {showDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                if (!deletingAccount && !sendingDeleteOtp) {
                  setShowDelete(false);
                  setDeleteStep(1);
                  setDeleteOtp('');
                }
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-red-500/20 bg-card p-6 shadow-2xl"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Eliminar cuenta</h3>

              {deleteStep === 1 ? (
                <>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Esta acción es <strong>irreversible</strong>. Se eliminarán permanentemente
                    tu perfil, proyectos, habilidades y toda la información de tu cuenta.
                  </p>
                  <div className="mt-3 rounded-xl bg-red-500/10 p-3 text-xs text-red-400">
                    ⚠️ No podrás recuperar tu cuenta una vez eliminada.
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Para confirmar, te enviaremos un código de verificación a{' '}
                    <span className="font-medium text-foreground">{authProfile?.email}</span>.
                  </p>
                  <div className="mt-5 flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => { setShowDelete(false); setDeleteStep(1); setDeleteOtp(''); }}
                      disabled={sendingDeleteOtp}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleRequestDeleteOtp}
                      disabled={sendingDeleteOtp}
                    >
                      {sendingDeleteOtp ? <LoadingSpinner size="sm" /> : <Mail className="h-4 w-4" />}
                      {sendingDeleteOtp ? 'Enviando...' : 'Enviar código'}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      Código enviado a <span className="font-semibold">{authProfile?.email}</span>
                    </p>
                  </div>
                  <div className="mt-4">
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Código de verificación (6 dígitos)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={deleteOtp}
                      onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className={cn(inputCls, 'text-center font-mono text-xl tracking-[0.5em]')}
                      autoFocus
                    />
                  </div>
                  <div className="mt-3 rounded-xl bg-red-500/10 p-3 text-xs text-red-400">
                    ⚠️ Al confirmar, tu cuenta y todos tus datos serán eliminados permanentemente.
                  </div>
                  <div className="mt-5 flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => { setDeleteStep(1); setDeleteOtp(''); }}
                      disabled={deletingAccount}
                    >
                      ← Volver
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={deletingAccount || deleteOtp.length < 6}
                    >
                      {deletingAccount ? <LoadingSpinner size="sm" /> : <Trash2 className="h-4 w-4" />}
                      Confirmar eliminación
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
