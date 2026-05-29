import api from '@/shared/api/api';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User as ProfileIcon,
  Lock,
  Bell,
  Palette,
  Shield,
  CreditCard,
  Eye,
  EyeOff,
  Camera,
  Save,
  Trash2,
  Download,
  Check,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import {
  Button,
  Card,
  Input,
  Switch,
  Avatar,
  Badge,
  Modal,
  LoadingSpinner,
} from '@/shared/ui';
import { useAuthStore } from '@/store/authStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/shared/lib/utils';
import type { ProfilePreferences } from '@/shared/types';

type SettingsTab = 'profile' | 'account' | 'notifications' | 'privacy' | 'appearance' | 'billing';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { profile, logout } = useAuthStore();
  const { preferences, updatePreferences } = usePreferencesStore();
  const { addToast, setTheme, theme: activeTheme } = useUiStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const safePreferences: ProfilePreferences = preferences ?? {
    profileId: profile?.id ?? '',
    language: 'es',
    theme: 'light',
    showGithubHeatmap: true,
    showLinkedinRecommendations: true,
    sectionOrder: ['bio', 'skills', 'projects', 'experience', 'contact'],
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

  // --- NUEVO ESTADO PARA EL PERFIL BÁSICO ---
  const [profileForm, setProfileForm] = useState({
    photoUrl: '',
    firstName: '',
    lastName: '',
    seniority: '',
    availabilityStatus: '',
    location: '', // Nacionalidad / Ubicación
  });

  // Cargar datos iniciales del perfil básico desde el backend
  useEffect(() => {
    const fetchBasicProfile = async () => {
      try {
        const response = await api.get('/v1/profile/basic');
        const data = response.data;

        setProfileForm({
          photoUrl: data.photoUrl || '',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          seniority: data.seniority || '',
          availabilityStatus: data.availabilityStatus || '',
          location: data.location || '',
        });
      } catch (error) {
        console.error("Error cargando el perfil básico:", error);
      } finally {
        setFetchingProfile(false);
      }
    };

    fetchBasicProfile();
  }, []);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const tabs = [
    { id: 'profile' as SettingsTab, label: t('settings.profile'), icon: ProfileIcon },
    { id: 'account' as SettingsTab, label: t('settings.account'), icon: Lock },
    { id: 'notifications' as SettingsTab, label: t('settings.notifications'), icon: Bell },
    { id: 'privacy' as SettingsTab, label: t('settings.privacy'), icon: Shield },
    { id: 'appearance' as SettingsTab, label: t('settings.appearance'), icon: Palette },
    { id: 'billing' as SettingsTab, label: t('settings.billing'), icon: CreditCard },
  ];

  // --- NUEVA FUNCIÓN PARA GUARDAR EL PERFIL BÁSICO ---
  const handleSaveProfile = async () => {
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      addToast({ type: 'error', title: 'Error', message: 'El nombre y apellido son obligatorios.' });
      return;
    }

    setLoading(true);
    try {
      await api.patch('/v1/profile/basic', profileForm);
      useAuthStore.setState((state) => ({
        profile: state.profile ? {
          ...state.profile,
          name: `${profileForm.firstName} ${profileForm.lastName}`.trim(),
          avatar: profileForm.photoUrl || state.profile.avatar
        } : null
      }));

      addToast({
        type: 'success',
        title: t('settings.profileUpdated'),
        message: t('settings.profileUpdatedMessage'),
      });
    } catch {
      addToast({
        type: 'error',
        title: t('common.error'),
        message: t('settings.profileUpdateError'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast({
        type: 'error',
        title: t('common.error'),
        message: t('settings.passwordMismatch'),
      });
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      addToast({
        type: 'success',
        title: t('settings.passwordChanged'),
        message: t('settings.passwordChangedMessage'),
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      addToast({
        type: 'error',
        title: t('common.error'),
        message: t('settings.passwordChangeError'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await logout();
    } catch {
      addToast({
        type: 'error',
        title: t('common.error'),
        message: t('settings.deleteAccountError'),
      });
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      addToast({
        type: 'success',
        title: t('settings.dataExported'),
        message: t('settings.dataExportedMessage'),
      });
      setExportModalOpen(false);
    } catch {
      addToast({
        type: 'error',
        title: t('common.error'),
        message: t('settings.exportError'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('settings.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('settings.subtitle')}</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <nav className="lg:w-64 flex-shrink-0">
          <Card className="p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </Card>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {fetchingProfile ? (
                  <div className="flex justify-center p-12"><LoadingSpinner size="lg" /></div>
                ) : (
                  <>
                    {/* Avatar */}
                    <Card className="p-6">
                      <h2 className="text-lg font-semibold text-foreground mb-4">
                        {t('settings.profilePhoto')}
                      </h2>
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <Avatar src={profileForm.photoUrl || profile?.avatar} name={profileForm.firstName || ''} size="2xl" />
                          <button className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors">
                            <Camera className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-3">
                            {t('settings.profilePhotoDesc')} (También puedes usar una URL externa)
                          </p>
                          <Input
                            placeholder="URL de la imagen (Ej: https://...)"
                            value={profileForm.photoUrl}
                            onChange={(e) => setProfileForm({ ...profileForm, photoUrl: e.target.value })}
                            className="w-full mb-3"
                          />
                        </div>
                      </div>
                    </Card>

                    {/* Profile Info */}
                    <Card className="p-6">
                      <h2 className="text-lg font-semibold text-foreground mb-4">
                        Datos del Perfil Básico
                      </h2>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Nombre</label>
                            <Input
                              value={profileForm.firstName}
                              onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                              placeholder="Tu nombre"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Apellido</label>
                            <Input
                              value={profileForm.lastName}
                              onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                              placeholder="Tu apellido"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Nivel Profesional</label>
                            <select
                              value={profileForm.seniority}
                              onChange={(e) => setProfileForm({ ...profileForm, seniority: e.target.value })}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              <option value="">Selecciona tu nivel</option>
                              <option value="Junior">Junior</option>
                              <option value="Mid">Mid Level</option>
                              <option value="Senior">Senior</option>
                              <option value="Lead">Lead / Principal</option>
                              <option value="Architect">Arquitecto</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Disponibilidad</label>
                            <select
                              value={profileForm.availabilityStatus}
                              onChange={(e) => setProfileForm({ ...profileForm, availabilityStatus: e.target.value })}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              <option value="">No especificado</option>
                              <option value="Disponible">Disponible para trabajar</option>
                              <option value="Ocupado">Ocupado actualmente</option>
                              <option value="Incógnito">Modo Incógnito</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Nacionalidad / Ubicación</label>
                          <Input
                            value={profileForm.location}
                            onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                            placeholder="Ej: Bolivia, México, España..."
                          />
                        </div>

                      </div>
                      <div className="flex justify-end mt-6">
                        <Button
                          onClick={handleSaveProfile}
                          disabled={loading || !profileForm.firstName.trim()}
                        >
                          {loading ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4 mr-2" />}
                          {t('common.save')}
                        </Button>
                      </div>
                    </Card>
                  </>
                )}
              </motion.div>
            )}

            {activeTab === 'account' && (
              <motion.div
                key="account"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">
                    {t('settings.changePassword')}
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        {t('settings.currentPassword')}
                      </label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                          }
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        {t('settings.newPassword')}
                      </label>
                      <Input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        {t('settings.confirmPassword')}
                      </label>
                      <Input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-6">
                    <Button onClick={handleChangePassword} disabled={loading}>
                      {t('settings.updatePassword')}
                    </Button>
                  </div>
                </Card>

                {/* Export Data */}
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">
                        {t('settings.exportData')}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('settings.exportDataDesc')}
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => setExportModalOpen(true)}>
                      <Download className="w-4 h-4 mr-2" />
                      {t('settings.export')}
                    </Button>
                  </div>
                </Card>

                {/* Delete Account */}
                <Card className="p-6 border-red-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-red-500">
                        {t('settings.deleteAccount')}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('settings.deleteAccountDesc')}
                      </p>
                    </div>
                    <Button variant="destructive" onClick={() => setDeleteModalOpen(true)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('settings.delete')}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">
                    {t('settings.emailNotifications')}
                  </h2>
                  <div className="space-y-4">
                    {[
                      { key: 'connections', label: t('settings.connectionRequests') },
                      { key: 'messages', label: t('settings.newMessages') },
                      { key: 'projectViews', label: t('settings.projectViews') },
                      { key: 'weeklyDigest', label: t('settings.weeklyDigest') },
                      { key: 'marketing', label: t('settings.marketing') },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      >
                        <span className="text-foreground">{item.label}</span>
                        <Switch
                          checked={safePreferences.notifications[item.key as keyof ProfilePreferences['notifications']] ?? true}
                          onChange={(checked) =>
                            updatePreferences({
                              notifications: {
                                ...safePreferences.notifications,
                                [item.key]: checked,
                              },
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'privacy' && (
              <motion.div
                key="privacy"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">
                    {t('settings.profilePrivacy')}
                  </h2>
                  <div className="space-y-4">
                    {[
                      { key: 'showEmail', label: t('settings.showEmail') },
                      { key: 'showLocation', label: t('settings.showLocation') },
                      { key: 'showConnections', label: t('settings.showConnections') },
                      { key: 'allowMessages', label: t('settings.allowMessages') },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      >
                        <span className="text-foreground">{item.label}</span>
                        <Switch
                          checked={safePreferences.privacy[item.key as keyof ProfilePreferences['privacy']] ?? true}
                          onChange={(checked) =>
                            updatePreferences({
                              privacy: {
                                ...safePreferences.privacy,
                                [item.key]: checked,
                              },
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'appearance' && (
              <motion.div
                key="appearance"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Theme */}
                <Card className="p-6">
                  <div className="mb-5">
                    <h2 className="text-base font-semibold text-foreground">Tema de la interfaz</h2>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">Elige cómo se ve EthosHub en tu dispositivo.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      {
                        value: 'light',
                        label: 'Claro',
                        preview: (
                          <div className="w-full aspect-video rounded-lg overflow-hidden border border-zinc-200 bg-white flex flex-col">
                            <div className="h-2.5 bg-zinc-100 border-b border-zinc-200 flex items-center gap-1 px-1.5">
                              <div className="h-1 w-1 rounded-full bg-zinc-300" />
                              <div className="h-1 w-4 rounded-full bg-zinc-200" />
                            </div>
                            <div className="flex-1 p-1.5 flex flex-col gap-1">
                              <div className="h-1.5 w-3/4 rounded-full bg-zinc-200" />
                              <div className="h-1.5 w-1/2 rounded-full bg-zinc-100" />
                              <div className="mt-1 h-4 w-full rounded-md bg-zinc-100 border border-zinc-200" />
                            </div>
                          </div>
                        ),
                      },
                      {
                        value: 'dark',
                        label: 'Oscuro',
                        preview: (
                          <div className="w-full aspect-video rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900 flex flex-col">
                            <div className="h-2.5 bg-zinc-800 border-b border-zinc-700 flex items-center gap-1 px-1.5">
                              <div className="h-1 w-1 rounded-full bg-zinc-600" />
                              <div className="h-1 w-4 rounded-full bg-zinc-700" />
                            </div>
                            <div className="flex-1 p-1.5 flex flex-col gap-1">
                              <div className="h-1.5 w-3/4 rounded-full bg-zinc-700" />
                              <div className="h-1.5 w-1/2 rounded-full bg-zinc-800" />
                              <div className="mt-1 h-4 w-full rounded-md bg-zinc-800 border border-zinc-700" />
                            </div>
                          </div>
                        ),
                      },
                      {
                        value: 'system',
                        label: 'Sistema',
                        preview: (
                          <div className="w-full aspect-video rounded-lg overflow-hidden border border-zinc-300 flex flex-col" style={{ background: 'linear-gradient(135deg, #fff 50%, #18181b 50%)' }}>
                            <div className="h-2.5 flex items-center gap-1 px-1.5" style={{ background: 'linear-gradient(135deg, #f4f4f5 50%, #27272a 50%)' }}>
                              <div className="h-1 w-1 rounded-full bg-zinc-400" />
                              <div className="h-1 w-4 rounded-full bg-zinc-300" />
                            </div>
                            <div className="flex-1 p-1.5 flex flex-col gap-1">
                              <div className="h-1.5 w-3/4 rounded-full" style={{ background: 'linear-gradient(90deg, #e4e4e7 50%, #3f3f46 50%)' }} />
                              <div className="h-1.5 w-1/2 rounded-full" style={{ background: 'linear-gradient(90deg, #f4f4f5 50%, #27272a 50%)' }} />
                            </div>
                          </div>
                        ),
                      },
                    ] as const).map(({ value, label, preview }) => {
                      const isActive = activeTheme === value;
                      return (
                        <button
                          key={value}
                          onClick={() => {
                            setTheme(value);
                            updatePreferences({ theme: value });
                          }}
                          className={cn(
                            'group flex flex-col gap-2.5 rounded-xl border-2 p-3 text-left transition-all duration-150',
                            isActive
                              ? 'border-violet-500 bg-violet-500/5 shadow-sm shadow-violet-500/10'
                              : 'border-border hover:border-violet-500/40 hover:bg-muted/30',
                          )}
                        >
                          {preview}
                          <div className="flex items-center justify-between">
                            <p className="text-[13px] font-medium text-foreground">{label}</p>
                            {isActive && (
                              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-500">
                                <Check className="h-2.5 w-2.5 text-white" />
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Card>

                {/* Language */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">
                    {t('settings.language')}
                  </h2>
                  <select
                    value={i18n.language}
                    onChange={(e) => i18n.changeLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="pt">Português</option>
                  </select>
                </Card>
              </motion.div>
            )}

            {activeTab === 'billing' && (
              <motion.div
                key="billing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">
                        {t('settings.currentPlan')}
                      </h2>
                      <p className="text-muted-foreground">{t('settings.freePlan')}</p>
                    </div>
                    <Badge>{t('settings.free')}</Badge>
                  </div>
                  <Button className="w-full">
                    {t('settings.upgradeToPro')}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modales al final ... */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={t('settings.deleteAccountConfirm')}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-500/10 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-500">{t('settings.deleteAccountWarning')}</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : t('settings.deleteAccount')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title={t('settings.exportData')}
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">{t('settings.exportDataMessage')}</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setExportModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleExportData} disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : <Download className="w-4 h-4 mr-2" />}
              {t('settings.export')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}