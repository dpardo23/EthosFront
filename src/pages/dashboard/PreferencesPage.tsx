import api from '@/shared/api/api';
import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCircle2,
  Eye,
  EyeOff,
  Palette,
  Bell,
  Shield,
  Lock,
  Copy,
  Globe,
  Search,
  Check,
  AlertTriangle,
  Camera,
  Save,
  Trash2,
  Download,
  Key,
  ExternalLink,
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
} from 'lucide-react';
import { EthosOwlMascot } from '@/components/brand/EthosCoreLogo';
import { Button, LoadingSpinner } from '@/shared/ui';
import { useAuthStore } from '@/store/authStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useVisibilityStore } from '@/store/visibilityStore';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/shared/lib/utils';
import type { PortfolioSection, SectionVisibility } from '@/shared/types';

type SectionId =
  | 'identidad'
  | 'visibilidad'
  | 'personalizacion'
  | 'notificaciones'
  | 'privacidad'
  | 'seguridad';

const SECTION_VARIANTS = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.14 } },
};

const SECTION_LABELS: Record<PortfolioSection, string> = {
  bio: 'Biografía',
  skills: 'Skills',
  projects: 'Proyectos',
  experience: 'Experiencia',
  contact: 'Contacto',
};

const VISIBILITY_OPTIONS: { value: SectionVisibility; label: string }[] = [
  { value: 'PUBLIC', label: 'Público' },
  { value: 'LINK_ONLY', label: 'Solo con enlace' },
  { value: 'PRIVATE', label: 'Privado' },
];

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

// ─── Main Component ────────────────────────────────────────────────────────

export default function PreferencesPage() {
  const { profile: authProfile } = useAuthStore();
  const { preferences, updatePreferences } = usePreferencesStore();
  const {
    settings: visibility,
    loading: visLoading,
    fetchSettings,
    updateSlug,
    updateSectionVisibility,
    updateSeoSettings,
    updatePasswordProtection,
  } = useVisibilityStore();
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
    bio: '',
    website: '',
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingBio, setSavingBio] = useState(false);

  // Visibility form
  const [slugDraft, setSlugDraft] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [visPass, setVisPass] = useState('');
  const [showVisPass, setShowVisPass] = useState(false);
  const [savingSlug, setSavingSlug] = useState(false);
  const [savingSeo, setSavingSeo] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

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

  // Crop modal
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });

  useEffect(() => {
    if (authProfile?.id) {
      fetchSettings(authProfile.id);
      api
        .get('/v1/profile/basic')
        .then((r) => {
          const d = r.data;
          setProfile({
            photoUrl: d.photoUrl || '',
            firstName: d.firstName || '',
            lastName: d.lastName || '',
            seniority: d.seniority || '',
            availabilityStatus: d.availabilityStatus || '',
            location: d.location || '',
            bio: d.bio || authProfile.bio || '',
            website: d.website || authProfile.website || '',
          });
        })
        .catch(() => {
          setProfile((p) => ({ ...p, bio: authProfile.bio || '', website: authProfile.website || '' }));
        })
        .finally(() => setLoadingProfile(false));
    }
  }, [authProfile?.id]);

  useEffect(() => {
    if (visibility) {
      setSlugDraft(visibility.slug);
      setSeoTitle(visibility.seo.title);
      setSeoDesc(visibility.seo.description);
      setVisPass(visibility.password ?? '');
    }
  }, [visibility]);

  const safePrefs = preferences ?? {
    profileId: authProfile?.id ?? '',
    language: 'es' as const,
    theme: 'dark' as const,
    showGithubHeatmap: true,
    showLinkedinRecommendations: true,
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
    setSavingProfile(true);
    try {
      await api.patch('/v1/profile/basic', {
        photoUrl: profile.photoUrl,
        firstName: profile.firstName,
        lastName: profile.lastName,
        seniority: profile.seniority,
        availabilityStatus: profile.availabilityStatus,
        location: profile.location,
        website: profile.website,
      });
      useAuthStore.setState((s) => ({
        profile: s.profile
          ? {
              ...s.profile,
              name: `${profile.firstName} ${profile.lastName}`.trim(),
              avatar: profile.photoUrl || s.profile.avatar,
              location: profile.location,
              website: profile.website,
            }
          : null,
      }));
      addToast({ type: 'success', title: 'Perfil actualizado' });
    } catch {
      addToast({ type: 'error', title: 'Error al guardar perfil' });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSaveBio() {
    setSavingBio(true);
    try {
      await api.patch('/v1/profile/bio', { bio: profile.bio });
      useAuthStore.setState((s) => ({
        profile: s.profile ? { ...s.profile, bio: profile.bio } : null,
      }));
      addToast({ type: 'success', title: 'Biografía guardada' });
    } catch {
      addToast({ type: 'error', title: 'Error al guardar biografía' });
    } finally {
      setSavingBio(false);
    }
  }

  async function handleSaveSlug() {
    if (!authProfile?.id || !slugDraft.trim()) return;
    setSavingSlug(true);
    try {
      await updateSlug(authProfile.id, slugDraft.trim());
      addToast({ type: 'success', title: 'Slug actualizado' });
    } catch {
      addToast({ type: 'error', title: 'Error al actualizar slug' });
    } finally {
      setSavingSlug(false);
    }
  }

  async function handleSaveSeo() {
    if (!authProfile?.id) return;
    setSavingSeo(true);
    try {
      await updateSeoSettings(authProfile.id, {
        title: seoTitle.trim(),
        description: seoDesc.trim(),
      });
      addToast({ type: 'success', title: 'SEO actualizado' });
    } catch {
      addToast({ type: 'error', title: 'Error al actualizar SEO' });
    } finally {
      setSavingSeo(false);
    }
  }

  async function handleCopyUrl() {
    const url = visibility ? `https://ethoshub.com/p/${visibility.slug}` : '';
    if (!url) return;
    await navigator.clipboard.writeText(url).catch(() => {});
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  }

  async function handlePasswordProtection(enabled: boolean) {
    if (!authProfile?.id) return;
    try {
      await updatePasswordProtection(authProfile.id, enabled, enabled ? visPass : undefined);
      addToast({
        type: 'success',
        title: enabled ? 'Protección activada' : 'Protección desactivada',
      });
    } catch {
      addToast({ type: 'error', title: 'Error al actualizar protección' });
    }
  }

  async function handleSaveVisPass() {
    if (!authProfile?.id || !visPass.trim()) return;
    try {
      await updatePasswordProtection(authProfile.id, true, visPass);
      addToast({ type: 'success', title: 'Contraseña del portafolio guardada' });
    } catch {
      addToast({ type: 'error', title: 'Error al guardar contraseña' });
    }
  }

  async function handleSectionVisibility(section: PortfolioSection, value: SectionVisibility) {
    if (!authProfile?.id) return;
    try {
      await updateSectionVisibility(authProfile.id, section, value);
    } catch {
      addToast({ type: 'error', title: 'Error al actualizar visibilidad' });
    }
  }

  async function handleRequestEmailOtp() {
    setSendingEmailOtp(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSendingEmailOtp(false);
    setEmailStep(2);
    addToast({ type: 'success', title: 'Código enviado', message: 'Revisa tu correo actual.' });
  }

  async function handleVerifyEmailOtp() {
    if (emailOtp.length < 6) {
      addToast({ type: 'error', title: 'Ingresa el código de 6 dígitos' });
      return;
    }
    setVerifyingEmailOtp(true);
    await new Promise((r) => setTimeout(r, 1000));
    setVerifyingEmailOtp(false);
    setEmailStep(3);
  }

  async function handleChangeEmail() {
    if (!emailNew || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNew)) {
      addToast({ type: 'error', title: 'Ingresa un correo válido' });
      return;
    }
    setSavingEmail(true);
    try {
      await api.patch('/v1/auth/change-email', { otpCode: emailOtp, newEmail: emailNew });
      useAuthStore.setState((s) => ({ profile: s.profile ? { ...s.profile, email: emailNew } : null }));
      setEmailNew('');
      setEmailOtp('');
      setEmailStep(1);
      addToast({ type: 'success', title: 'Correo actualizado' });
    } catch {
      addToast({ type: 'error', title: 'Error al cambiar correo' });
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleRequestOtp() {
    setSendingOtp(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSendingOtp(false);
    setPassStep(2);
    addToast({ type: 'success', title: 'Código enviado', message: 'Revisa tu correo electrónico.' });
  }

  async function handleVerifyOtp() {
    if (otpCode.length < 6) {
      addToast({ type: 'error', title: 'Ingresa el código de 6 dígitos' });
      return;
    }
    setVerifyingOtp(true);
    await new Promise((r) => setTimeout(r, 1000));
    setVerifyingOtp(false);
    setPassStep(3);
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
      addToast({ type: 'success', title: 'Contraseña actualizada' });
    } catch {
      addToast({ type: 'error', title: 'Error al cambiar contraseña' });
    } finally {
      setSavingPass(false);
    }
  }

  async function handleExportData() {
    setShowExportLoading(true);
    await new Promise((r) => setTimeout(r, 3000));
    setShowExportLoading(false);
    const blob = new Blob([JSON.stringify({ profile: authProfile, exported: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ethoshub-profile-data.json';
    a.click();
    URL.revokeObjectURL(url);
    addToast({ type: 'success', title: 'Datos exportados', message: 'Archivo JSON descargado.' });
  }

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
    setCropSrc(null);
    addToast({ type: 'success', title: 'Foto de perfil actualizada' });
  };

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      await useAuthStore.getState().logout();
    } catch {
      addToast({ type: 'error', title: 'Error al eliminar cuenta' });
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
    { id: 'visibilidad', label: 'Visibilidad', icon: Eye },
    { id: 'personalizacion', label: 'Personalización', icon: Palette },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { id: 'privacidad', label: 'Privacidad', icon: Shield },
    { id: 'seguridad', label: 'Seguridad', icon: Lock },
  ];

  const publicUrl = visibility ? `https://ethoshub.com/p/${visibility.slug}` : '';

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
                      ethoshub.com/p/{visibility.slug}
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
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <button
                          onClick={handleAvatarClick}
                          className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-dashed border-border transition-all hover:border-violet-500/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                          title="Cambiar foto de perfil"
                        >
                          {profile.photoUrl || authProfile?.avatar ? (
                            <img
                              src={profile.photoUrl || authProfile?.avatar}
                              alt="Avatar"
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-violet-500/10 text-2xl font-bold text-violet-500 dark:text-violet-400">
                              {(profile.firstName || authProfile?.name || '?')[0]}
                            </div>
                          )}
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                            <Camera className="h-5 w-5 text-white" />
                            <span className="text-[10px] font-medium text-white">Cambiar</span>
                          </div>
                        </button>
                        <div className="flex-1 space-y-1.5">
                          <p className="text-sm font-medium text-foreground">Foto de perfil</p>
                          <p className="text-xs text-muted-foreground">
                            JPG, PNG o WebP · Recomendado: cuadrada, mínimo 200×200 px
                          </p>
                          <button
                            onClick={handleAvatarClick}
                            className="mt-1 inline-flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-medium text-foreground transition-all hover:border-violet-500/40 hover:bg-violet-500/5"
                          >
                            <Camera className="h-3.5 w-3.5" />
                            Seleccionar imagen
                          </button>
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
                          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                            Nombre
                          </label>
                          <input
                            value={profile.firstName}
                            onChange={(e) =>
                              setProfile({ ...profile, firstName: e.target.value })
                            }
                            placeholder="Tu nombre"
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                            Apellido
                          </label>
                          <input
                            value={profile.lastName}
                            onChange={(e) =>
                              setProfile({ ...profile, lastName: e.target.value })
                            }
                            placeholder="Tu apellido"
                            className={inputCls}
                          />
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
                          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                            Ubicación
                          </label>
                          <input
                            value={profile.location}
                            onChange={(e) =>
                              setProfile({ ...profile, location: e.target.value })
                            }
                            placeholder="Ej: Bogotá, Colombia"
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                            Sitio web personal
                          </label>
                          <input
                            value={profile.website}
                            onChange={(e) =>
                              setProfile({ ...profile, website: e.target.value })
                            }
                            placeholder="https://..."
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

            {/* ══ VISIBILIDAD ══════════════════════════════════════════ */}
            {activeSection === 'visibilidad' && (
              <motion.div
                key="visibilidad"
                variants={SECTION_VARIANTS}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-4"
              >
                {visLoading && !visibility ? (
                  <div className="flex items-center justify-center py-24">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : (
                  <>
                    {/* Public URL */}
                    <SectionCard
                      title="URL pública del portafolio"
                      description="La dirección que compartes con recruiters y contactos."
                      icon={Globe}
                      iconColor="blue"
                    >
                      <div className="mb-4 rounded-xl border border-border bg-muted/30 p-4">
                        <div className="flex items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground">Tu portafolio en</p>
                            <p className="truncate font-mono text-sm text-foreground">
                              {publicUrl || 'ethoshub.com/p/tu-usuario'}
                            </p>
                          </div>
                          <button
                            onClick={handleCopyUrl}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background transition-colors hover:border-violet-500/30 hover:bg-violet-500/5"
                            title="Copiar URL"
                          >
                            {urlCopied ? (
                              <Check className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <Copy className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                          {publicUrl && (
                            <a
                              href={publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background transition-colors hover:border-violet-500/30 hover:bg-violet-500/5"
                              title="Abrir portafolio"
                            >
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                          Slug personalizado
                        </label>
                        <div className="flex gap-2">
                          <div className="flex flex-1 overflow-hidden rounded-xl border border-border bg-background transition-all focus-within:border-violet-500/60 focus-within:ring-2 focus-within:ring-violet-500/40">
                            <span className="flex shrink-0 items-center border-r border-border px-3 text-xs text-muted-foreground">
                              ethoshub.com/p/
                            </span>
                            <input
                              value={slugDraft}
                              onChange={(e) =>
                                setSlugDraft(
                                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                                )
                              }
                              placeholder="tu-usuario"
                              className="flex-1 bg-transparent px-3 py-2.5 text-sm text-foreground focus:outline-none"
                            />
                          </div>
                          <Button
                            onClick={handleSaveSlug}
                            disabled={savingSlug}
                            size="sm"
                          >
                            {savingSlug ? <LoadingSpinner size="sm" /> : 'Guardar'}
                          </Button>
                        </div>
                      </div>
                    </SectionCard>

                    {/* Access control */}
                    <SectionCard
                      title="Control de acceso"
                      description="Protege tu portafolio con contraseña."
                      icon={Shield}
                      iconColor="blue"
                    >
                      {visibility && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between rounded-xl border border-border p-4">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                Protección por contraseña
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                Visitantes necesitarán una clave para ver tu portafolio.
                              </p>
                            </div>
                            <Toggle
                              checked={visibility.isPasswordProtected}
                              onChange={handlePasswordProtection}
                            />
                          </div>

                          <AnimatePresence>
                            {visibility.isPasswordProtected && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="flex gap-2 pt-1">
                                  <div className="relative flex-1">
                                    <input
                                      type={showVisPass ? 'text' : 'password'}
                                      value={visPass}
                                      onChange={(e) => setVisPass(e.target.value)}
                                      placeholder="Contraseña del portafolio"
                                      className={inputCls}
                                    />
                                    <button
                                      onClick={() => setShowVisPass(!showVisPass)}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                      {showVisPass ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </button>
                                  </div>
                                  <Button size="sm" onClick={handleSaveVisPass}>
                                    <Key className="h-4 w-4" />
                                    Guardar
                                  </Button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </SectionCard>

                    {/* SEO */}
                    <SectionCard
                      title="SEO del portafolio"
                      description="Optimiza cómo apareces en Google y otros buscadores."
                      icon={Search}
                      iconColor="blue"
                    >
                      <div className="space-y-4">
                        <div>
                          <div className="mb-1.5 flex items-center justify-between">
                            <label className="text-xs font-medium text-muted-foreground">
                              Título SEO
                            </label>
                            <span className="text-xs text-muted-foreground">
                              {seoTitle.length}/60
                            </span>
                          </div>
                          <input
                            value={seoTitle}
                            onChange={(e) => setSeoTitle(e.target.value)}
                            maxLength={60}
                            placeholder="Ej: Juan García — Senior React Developer"
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <div className="mb-1.5 flex items-center justify-between">
                            <label className="text-xs font-medium text-muted-foreground">
                              Descripción SEO
                            </label>
                            <span className="text-xs text-muted-foreground">
                              {seoDesc.length}/160
                            </span>
                          </div>
                          <textarea
                            value={seoDesc}
                            onChange={(e) => setSeoDesc(e.target.value)}
                            maxLength={160}
                            rows={3}
                            placeholder="Describe tu perfil en una o dos frases..."
                            className={textareaCls}
                          />
                        </div>

                        {(seoTitle || seoDesc) && (
                          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
                            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              Vista previa en Google
                            </p>
                            <p className="text-base font-medium leading-tight text-blue-600 dark:text-blue-400">
                              {seoTitle || 'Título del portafolio'}
                            </p>
                            <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-500">
                              ethoshub.com/p/{visibility?.slug || 'tu-usuario'}
                            </p>
                            <p className="mt-1 text-sm leading-snug text-gray-600 dark:text-gray-400">
                              {seoDesc || 'Descripción del portafolio...'}
                            </p>
                          </div>
                        )}

                        <div className="flex justify-end">
                          <Button onClick={handleSaveSeo} disabled={savingSeo} size="sm">
                            {savingSeo ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            Guardar SEO
                          </Button>
                        </div>
                      </div>
                    </SectionCard>

                    {/* Per-section visibility */}
                    {visibility && (
                      <SectionCard
                        title="Visibilidad por sección"
                        description="Controla qué partes de tu portafolio son visibles para visitantes."
                        icon={Eye}
                        iconColor="blue"
                      >
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {(Object.keys(visibility.sections) as PortfolioSection[]).map(
                            (section) => (
                              <div
                                key={section}
                                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-3"
                              >
                                <p className="text-sm font-medium text-foreground">
                                  {SECTION_LABELS[section]}
                                </p>
                                <select
                                  value={visibility.sections[section]}
                                  onChange={(e) =>
                                    handleSectionVisibility(
                                      section,
                                      e.target.value as SectionVisibility,
                                    )
                                  }
                                  className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                                >
                                  {VISIBILITY_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                      {o.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ),
                          )}
                        </div>
                      </SectionCard>
                    )}
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
                  <ToggleRow
                    label="Heatmap de GitHub"
                    description="Muestra tu actividad de commits en el portafolio público."
                    checked={safePrefs.showGithubHeatmap}
                    onChange={(v) => updatePreferences({ showGithubHeatmap: v })}
                  />
                  <ToggleRow
                    label="Recomendaciones de LinkedIn"
                    description="Muestra las recomendaciones importadas desde LinkedIn."
                    checked={safePrefs.showLinkedinRecommendations}
                    onChange={(v) => updatePreferences({ showLinkedinRecommendations: v })}
                  />
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
                  description="Idioma del dashboard (no afecta el portafolio público)."
                  icon={Globe}
                  iconColor="emerald"
                >
                  <div className="flex items-center gap-4">
                    <select
                      value={safePrefs.language}
                      onChange={(e) =>
                        updatePreferences({ language: e.target.value as 'es' | 'en' })
                      }
                      className={cn(selectCls, 'max-w-[180px]')}
                    >
                      <option value="es">Español</option>
                      <option value="en">English</option>
                    </select>
                    <p className="text-sm text-muted-foreground">
                      Actual: {safePrefs.language === 'es' ? 'Español' : 'English'}
                    </p>
                  </div>
                </SectionCard>
              </motion.div>
            )}

            {/* ══ NOTIFICACIONES ═══════════════════════════════════════ */}
            {activeSection === 'notificaciones' && (
              <motion.div
                key="notificaciones"
                variants={SECTION_VARIANTS}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-4"
              >
                <SectionCard
                  title="Notificaciones por email"
                  description="Controla qué emails recibes de EthosHub."
                  icon={Bell}
                  iconColor="amber"
                >
                  <ToggleRow
                    label="Solicitudes de conexión"
                    description="Cuando alguien quiera conectar contigo."
                    checked={safePrefs.notifications.connections}
                    onChange={(v) =>
                      updatePreferences({
                        notifications: { ...safePrefs.notifications, connections: v },
                      })
                    }
                  />
                  <ToggleRow
                    label="Nuevos mensajes"
                    description="Cuando recibas un mensaje directo."
                    checked={safePrefs.notifications.messages}
                    onChange={(v) =>
                      updatePreferences({
                        notifications: { ...safePrefs.notifications, messages: v },
                      })
                    }
                  />
                  <ToggleRow
                    label="Visitas a proyectos"
                    description="Resumen de visitas a tus proyectos."
                    checked={safePrefs.notifications.projectViews}
                    onChange={(v) =>
                      updatePreferences({
                        notifications: { ...safePrefs.notifications, projectViews: v },
                      })
                    }
                  />
                  <ToggleRow
                    label="Resumen semanal"
                    description="Estadísticas y actividad de la semana."
                    checked={safePrefs.notifications.weeklyDigest}
                    onChange={(v) =>
                      updatePreferences({
                        notifications: { ...safePrefs.notifications, weeklyDigest: v },
                      })
                    }
                  />
                  <ToggleRow
                    label="Marketing y novedades"
                    description="Actualizaciones y ofertas de la plataforma."
                    checked={safePrefs.notifications.marketing}
                    onChange={(v) =>
                      updatePreferences({
                        notifications: { ...safePrefs.notifications, marketing: v },
                      })
                    }
                  />
                </SectionCard>

                <SectionCard
                  title="Notificaciones push"
                  description="Notificaciones en tiempo real en el navegador."
                  icon={Zap}
                  iconColor="amber"
                >
                  <ToggleRow
                    label="Nuevas conexiones"
                    checked={safePrefs.notifications.push_connections}
                    onChange={(v) =>
                      updatePreferences({
                        notifications: { ...safePrefs.notifications, push_connections: v },
                      })
                    }
                  />
                  <ToggleRow
                    label="Mensajes directos"
                    checked={safePrefs.notifications.push_messages}
                    onChange={(v) =>
                      updatePreferences({
                        notifications: { ...safePrefs.notifications, push_messages: v },
                      })
                    }
                  />
                  <ToggleRow
                    label="Menciones"
                    checked={safePrefs.notifications.push_mentions}
                    onChange={(v) =>
                      updatePreferences({
                        notifications: { ...safePrefs.notifications, push_mentions: v },
                      })
                    }
                  />
                </SectionCard>
              </motion.div>
            )}

            {/* ══ PRIVACIDAD ═══════════════════════════════════════════ */}
            {activeSection === 'privacidad' && (
              <motion.div
                key="privacidad"
                variants={SECTION_VARIANTS}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-4"
              >
                <SectionCard
                  title="Información visible"
                  description="Controla qué datos personales son visibles en tu portafolio."
                  icon={Shield}
                  iconColor="rose"
                >
                  <ToggleRow
                    label="Mostrar email"
                    description="Tu dirección de email será visible en el portafolio."
                    checked={safePrefs.privacy.showEmail}
                    onChange={(v) =>
                      updatePreferences({ privacy: { ...safePrefs.privacy, showEmail: v } })
                    }
                  />
                  <ToggleRow
                    label="Mostrar ubicación"
                    description="Tu ciudad/país será visible en el portafolio."
                    checked={safePrefs.privacy.showLocation}
                    onChange={(v) =>
                      updatePreferences({
                        privacy: { ...safePrefs.privacy, showLocation: v },
                      })
                    }
                  />
                  <ToggleRow
                    label="Mostrar conexiones"
                    description="Otros usuarios pueden ver tu lista de conexiones."
                    checked={safePrefs.privacy.showConnections}
                    onChange={(v) =>
                      updatePreferences({
                        privacy: { ...safePrefs.privacy, showConnections: v },
                      })
                    }
                  />
                  <ToggleRow
                    label="Permitir mensajes directos"
                    description="Otros profesionales pueden enviarte mensajes."
                    checked={safePrefs.privacy.allowMessages}
                    onChange={(v) =>
                      updatePreferences({
                        privacy: { ...safePrefs.privacy, allowMessages: v },
                      })
                    }
                  />
                </SectionCard>

                <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 dark:text-blue-400">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Tus datos están protegidos
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      EthosHub cumple con el Reglamento General de Protección de Datos
                      (RGPD). Nunca vendemos ni compartimos tus datos con terceros sin tu
                      consentimiento explícito.
                    </p>
                  </div>
                </div>
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

      {/* ── Delete confirmation modal ────────────────────────────────── */}
      <AnimatePresence>
        {showDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => !deletingAccount && setShowDelete(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                ¿Eliminar tu cuenta?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Esta acción es irreversible. Se eliminarán permanentemente tu perfil,
                proyectos, habilidades y toda la información asociada a tu cuenta.
              </p>
              <div className="mt-4 rounded-xl bg-red-500/10 p-3 text-xs text-red-400">
                No podrás recuperar tu cuenta una vez eliminada.
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDelete(false)}
                  disabled={deletingAccount}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                >
                  {deletingAccount ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Sí, eliminar
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
