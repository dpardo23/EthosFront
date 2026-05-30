import api from '@/shared/api/api';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Camera,
  Save,
  Globe,
  Users,
  Calendar,
  Briefcase,
  Bell,
  Shield,
  Palette,
  Lock,
  CreditCard,
  ChevronRight,
  AlertCircle,
  Check,
  Download,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  Button,
  Card,
  Input,
  Avatar,
  Badge,
  Modal,
  LoadingSpinner,
  Switch,
} from '@/shared/ui';
import { useAuthStore } from '@/store/authStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/shared/lib/utils';
import { useTranslation } from 'react-i18next';
import type { ProfilePreferences } from '@/shared/types';

type SettingsTab = 'company' | 'account' | 'notifications' | 'privacy' | 'appearance' | 'billing';

type CompanyForm = {
  companyName: string;
  industry: string;
  website: string;
  headcount: string;
  foundedYear: string;
  photoUrl: string;
};

const INDUSTRIES = [
  'Tecnología', 'Finanzas', 'Salud', 'Educación', 'Manufactura',
  'Retail', 'Construcción', 'Logística', 'Energía', 'Consultoría',
  'Marketing', 'Legal', 'Medios', 'Turismo', 'Agroindustria', 'Otro',
];

export default function RecruiterSettingsPage() {
  const { t, i18n } = useTranslation();
  const { profile, logout } = useAuthStore();
  const { preferences, updatePreferences } = usePreferencesStore();
  const { addToast, setTheme, theme: activeTheme } = useUiStore();

  const [activeTab, setActiveTab]           = useState<SettingsTab>('company');
  const [loading, setLoading]               = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [showPassword, setShowPassword]     = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const [companyForm, setCompanyForm] = useState<CompanyForm>({
    companyName: '',
    industry: '',
    website: '',
    headcount: '',
    foundedYear: '',
    photoUrl: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const safePreferences: ProfilePreferences = preferences ?? {
    profileId: profile?.id ?? '',
    language: 'es',
    theme: 'light',
    showGithubHeatmap: true,
    showLinkedinRecommendations: true,
    sectionOrder: ['bio', 'skills', 'projects', 'experience', 'contact'],
    notifications: {
      connections: true, messages: true, projectViews: true,
      weeklyDigest: true, marketing: false,
      push_connections: true, push_messages: true, push_mentions: true,
    },
    privacy: {
      showEmail: false, showLocation: true,
      showConnections: true, allowMessages: true,
    },
  };

  useEffect(() => {
    if (!profile?.profile_id) { setFetchingProfile(false); return; }
    const fetchCompanyProfile = async () => {
      try {
        const response = await api.get(`/v1/recruiter/profile/company/${profile.profile_id}`);
        const data = response.data?.data ?? response.data;
        setCompanyForm({
          companyName: data.companyName ?? '',
          industry:    data.industry    ?? '',
          website:     data.website     ?? '',
          headcount:   data.headcount != null ? String(data.headcount) : '',
          foundedYear: data.foundedYear != null ? String(data.foundedYear) : '',
          photoUrl:    data.photoUrl    ?? profile?.avatar ?? '',
        });
      } catch {
        // keep defaults
      } finally {
        setFetchingProfile(false);
      }
    };
    fetchCompanyProfile();
  }, [profile?.profile_id]);

  const tabs = [
    { id: 'company'       as SettingsTab, label: 'Mi Empresa',           icon: Building2  },
    { id: 'account'       as SettingsTab, label: t('settings.account'),   icon: Lock       },
    { id: 'notifications' as SettingsTab, label: t('settings.notifications'), icon: Bell  },
    { id: 'privacy'       as SettingsTab, label: t('settings.privacy'),   icon: Shield     },
    { id: 'appearance'    as SettingsTab, label: t('settings.appearance'), icon: Palette   },
    { id: 'billing'       as SettingsTab, label: t('settings.billing'),   icon: CreditCard },
  ];

  const handleSaveCompany = async () => {
    if (!profile?.profile_id) return;
    if (!companyForm.companyName.trim()) {
      addToast({ type: 'error', title: 'Error', message: 'El nombre de la empresa es obligatorio.' });
      return;
    }
    setLoading(true);
    try {
      await api.put(`/v1/recruiter/profile/${profile.profile_id}`, {
        companyName: companyForm.companyName.trim(),
        industry:    companyForm.industry    || null,
        website:     companyForm.website     || null,
        headcount:   companyForm.headcount   ? parseInt(companyForm.headcount, 10) : null,
        foundedYear: companyForm.foundedYear ? parseInt(companyForm.foundedYear, 10) : null,
        photoUrl:    companyForm.photoUrl    || null,
      });
      useAuthStore.setState((s) => ({
        profile: s.profile
          ? { ...s.profile, name: companyForm.companyName, avatar: companyForm.photoUrl || s.profile.avatar }
          : null,
      }));
      addToast({ type: 'success', title: 'Guardado', message: 'Perfil de empresa actualizado.' });
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'No se pudo guardar el perfil.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast({ type: 'error', title: 'Error', message: t('settings.passwordMismatch') });
      return;
    }
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      addToast({ type: 'success', title: t('settings.passwordChanged'), message: t('settings.passwordChangedMessage') });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      addToast({ type: 'error', title: 'Error', message: t('settings.passwordChangeError') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground mt-1">Administra tu perfil de empresa y preferencias</p>
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

            {/* ── Empresa ──────────────────────────────────────────────── */}
            {activeTab === 'company' && (
              <motion.div
                key="company"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {fetchingProfile ? (
                  <div className="flex justify-center p-12"><LoadingSpinner size="lg" /></div>
                ) : (
                  <>
                    {/* Logo */}
                    <Card className="p-6">
                      <h2 className="text-lg font-semibold text-foreground mb-4">Logo de la empresa</h2>
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <Avatar src={companyForm.photoUrl || profile?.avatar} name={companyForm.companyName || 'E'} size="2xl" />
                          <button className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors">
                            <Camera className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-3">URL de imagen del logo (formato cuadrado recomendado)</p>
                          <Input
                            placeholder="https://empresa.com/logo.png"
                            value={companyForm.photoUrl}
                            onChange={(e) => setCompanyForm({ ...companyForm, photoUrl: e.target.value })}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </Card>

                    {/* Datos de empresa */}
                    <Card className="p-6">
                      <h2 className="text-lg font-semibold text-foreground mb-4">Datos de la empresa</h2>
                      <div className="space-y-4">

                        {/* Nombre */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            <Building2 className="inline w-4 h-4 mr-1 text-muted-foreground" />
                            Nombre de la empresa *
                          </label>
                          <Input
                            value={companyForm.companyName}
                            onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                            placeholder="Ej: TechCorp Bolivia S.R.L."
                          />
                        </div>

                        {/* Industria */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            <Briefcase className="inline w-4 h-4 mr-1 text-muted-foreground" />
                            Industria / Sector
                          </label>
                          <select
                            value={companyForm.industry}
                            onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <option value="">Selecciona el sector</option>
                            {INDUSTRIES.map((ind) => (
                              <option key={ind} value={ind}>{ind}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {/* Sitio web */}
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                              <Globe className="inline w-4 h-4 mr-1 text-muted-foreground" />
                              Sitio web
                            </label>
                            <Input
                              value={companyForm.website}
                              onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                              placeholder="https://empresa.com"
                              type="url"
                            />
                          </div>

                          {/* Año de fundación */}
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                              <Calendar className="inline w-4 h-4 mr-1 text-muted-foreground" />
                              Año de fundación
                            </label>
                            <Input
                              value={companyForm.foundedYear}
                              onChange={(e) => setCompanyForm({ ...companyForm, foundedYear: e.target.value })}
                              placeholder="Ej: 2015"
                              type="number"
                              min="1800"
                              max={new Date().getFullYear()}
                            />
                          </div>
                        </div>

                        {/* Tamaño de equipo */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            <Users className="inline w-4 h-4 mr-1 text-muted-foreground" />
                            Número de empleados
                          </label>
                          <Input
                            value={companyForm.headcount}
                            onChange={(e) => setCompanyForm({ ...companyForm, headcount: e.target.value })}
                            placeholder="Ej: 50"
                            type="number"
                            min="1"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end mt-6">
                        <Button onClick={handleSaveCompany} disabled={loading || !companyForm.companyName.trim()}>
                          {loading ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4 mr-2" />}
                          Guardar empresa
                        </Button>
                      </div>
                    </Card>
                  </>
                )}
              </motion.div>
            )}

            {/* ── Cuenta ───────────────────────────────────────────────── */}
            {activeTab === 'account' && (
              <motion.div
                key="account"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">{t('settings.changePassword')}</h2>
                  <div className="space-y-4">
                    {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((field, i) => (
                      <div key={field}>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          {i === 0 ? t('settings.currentPassword') : i === 1 ? t('settings.newPassword') : t('settings.confirmPassword')}
                        </label>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            value={passwordForm[field]}
                            onChange={(e) => setPasswordForm({ ...passwordForm, [field]: e.target.value })}
                          />
                          {i === 0 && (
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end mt-6">
                    <Button onClick={handleChangePassword} disabled={loading}>{t('settings.updatePassword')}</Button>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">{t('settings.exportData')}</h2>
                      <p className="text-sm text-muted-foreground mt-1">{t('settings.exportDataDesc')}</p>
                    </div>
                    <Button variant="outline" onClick={() => setExportModalOpen(true)}>
                      <Download className="w-4 h-4 mr-2" />{t('settings.export')}
                    </Button>
                  </div>
                </Card>

                <Card className="p-6 border-red-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-red-500">{t('settings.deleteAccount')}</h2>
                      <p className="text-sm text-muted-foreground mt-1">{t('settings.deleteAccountDesc')}</p>
                    </div>
                    <Button variant="destructive" onClick={() => setDeleteModalOpen(true)}>
                      <Trash2 className="w-4 h-4 mr-2" />{t('settings.delete')}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* ── Notificaciones ───────────────────────────────────────── */}
            {activeTab === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">{t('settings.emailNotifications')}</h2>
                  <div className="space-y-4">
                    {[
                      { key: 'connections', label: t('settings.connectionRequests') },
                      { key: 'messages',    label: t('settings.newMessages') },
                      { key: 'weeklyDigest',label: t('settings.weeklyDigest') },
                      { key: 'marketing',   label: t('settings.marketing') },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <span className="text-foreground">{item.label}</span>
                        <Switch
                          checked={safePreferences.notifications[item.key as keyof ProfilePreferences['notifications']] ?? true}
                          onChange={(checked) =>
                            updatePreferences({ notifications: { ...safePreferences.notifications, [item.key]: checked } })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* ── Privacidad ───────────────────────────────────────────── */}
            {activeTab === 'privacy' && (
              <motion.div
                key="privacy"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">{t('settings.profilePrivacy')}</h2>
                  <div className="space-y-4">
                    {[
                      { key: 'showEmail',       label: t('settings.showEmail') },
                      { key: 'showLocation',    label: t('settings.showLocation') },
                      { key: 'showConnections', label: t('settings.showConnections') },
                      { key: 'allowMessages',   label: t('settings.allowMessages') },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <span className="text-foreground">{item.label}</span>
                        <Switch
                          checked={safePreferences.privacy[item.key as keyof ProfilePreferences['privacy']] ?? true}
                          onChange={(checked) =>
                            updatePreferences({ privacy: { ...safePreferences.privacy, [item.key]: checked } })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* ── Apariencia ───────────────────────────────────────────── */}
            {activeTab === 'appearance' && (
              <motion.div
                key="appearance"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <Card className="p-6">
                  <div className="mb-5">
                    <h2 className="text-base font-semibold text-foreground">Tema de la interfaz</h2>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">Elige cómo se ve EthosHub en tu dispositivo.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {(['light', 'dark', 'system'] as const).map((value) => {
                      const labels = { light: 'Claro', dark: 'Oscuro', system: 'Sistema' };
                      const isActive = activeTheme === value;
                      return (
                        <button
                          key={value}
                          onClick={() => { setTheme(value); updatePreferences({ theme: value }); }}
                          className={cn(
                            'group flex flex-col gap-2.5 rounded-xl border-2 p-3 text-left transition-all duration-150',
                            isActive
                              ? 'border-violet-500 bg-violet-500/5'
                              : 'border-border hover:border-violet-500/40'
                          )}
                        >
                          <div className="w-full aspect-video rounded-lg bg-muted border border-border" />
                          <div className="flex items-center justify-between">
                            <p className="text-[13px] font-medium text-foreground">{labels[value]}</p>
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
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">{t('settings.language')}</h2>
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

            {/* ── Facturación ──────────────────────────────────────────── */}
            {activeTab === 'billing' && (
              <motion.div
                key="billing"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">{t('settings.currentPlan')}</h2>
                      <p className="text-muted-foreground">{t('settings.freePlan')}</p>
                    </div>
                    <Badge>{t('settings.free')}</Badge>
                  </div>
                  <Button className="w-full">
                    {t('settings.upgradeToPro')} <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Card>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* Modales */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title={t('settings.deleteAccountConfirm')}>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-500/10 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-500">{t('settings.deleteAccountWarning')}</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={() => { setLoading(true); logout().finally(() => setLoading(false)); }} disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : t('settings.deleteAccount')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)} title={t('settings.exportData')}>
        <div className="space-y-4">
          <p className="text-muted-foreground">{t('settings.exportDataMessage')}</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setExportModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={() => setExportModalOpen(false)} disabled={loading}>
              <Download className="w-4 h-4 mr-2" />{t('settings.export')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
