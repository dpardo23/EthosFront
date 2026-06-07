import api from '@/shared/api/api';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
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
  Globe,
  Users,
  Phone,
  FileText,
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
  LanguageSelector,
} from '@/shared/ui';
import { useAuthStore } from '@/store/authStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useUiStore } from '@/store/uiStore';
import { usePortfolioStore } from '@/store';
import { cn } from '@/shared/lib/utils';
import type { ProfilePreferences } from '@/shared/types';

/**
 * Recruiter-specific settings page for updating company profile, industry, and contact information.
 */
type SettingsTab = 'company' | 'account' | 'notifications' | 'privacy' | 'appearance' | 'billing';

const INDUSTRIES = [
  'Tecnología', 'Finanzas', 'Salud', 'Educación', 'Manufactura',
  'Retail', 'Construcción', 'Logística', 'Energía', 'Consultoría',
  'Marketing', 'Legal', 'Medios', 'Turismo', 'Agroindustria', 'Otro',
];

const COMPANY_SIZES = [
  '1-10', '11-50', '51-200', '201-500', '501-1000', '1000+',
];

export default function RecruiterSettingsPage() {
  const { t } = useTranslation();
  const { profile, logout } = useAuthStore();
  const { preferences, updatePreferences } = usePreferencesStore();
  const { addToast, setTheme, theme: activeTheme } = useUiStore();
  const { updateSettings: updatePortfolioSettings } = usePortfolioStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('company');
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
      connections: true, messages: true, projectViews: true,
      weeklyDigest: true, marketing: false,
      push_connections: true, push_messages: true, push_mentions: true,
    },
    privacy: {
      showEmail: false, showLocation: true,
      showConnections: true, allowMessages: true,
    },
  };

  const [companyForm, setCompanyForm] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    photoUrl: '',
    countryCode: '',
    industry: '',
    companyWebsite: '',
    companySize: '',
    companyDescription: '',
    phoneNumber: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!profile?.id) { setFetchingProfile(false); return; }
    api.get(`/v1/recruiter/profile/company/${profile.id}`)
      .then(res => {
        const data = res.data?.data ?? res.data;
        setCompanyForm({
          firstName:          data.firstName          ?? '',
          lastName:           data.lastName           ?? '',
          companyName:        data.companyName        ?? '',
          photoUrl:           data.photoUrl           ?? profile?.avatar ?? '',
          countryCode:        data.countryCode        ?? '',
          industry:           data.industry           ?? '',
          companyWebsite:     data.companyWebsite     ?? '',
          companySize:        data.companySize        ?? '',
          companyDescription: data.companyDescription ?? '',
          phoneNumber:        data.phoneNumber        ?? '',
        });
      })
      .catch(() => {
        
      })
      .finally(() => setFetchingProfile(false));
  }, [profile?.id]);

  const tabs = [
    { id: 'company'       as SettingsTab, label: 'Mi Empresa',     icon: Building2  },
    { id: 'account'       as SettingsTab, label: 'Cuenta',         icon: Lock       },
    { id: 'notifications' as SettingsTab, label: 'Notificaciones', icon: Bell       },
    { id: 'privacy'       as SettingsTab, label: 'Privacidad',     icon: Shield     },
    { id: 'appearance'    as SettingsTab, label: 'Apariencia',     icon: Palette    },
    { id: 'billing'       as SettingsTab, label: 'Facturación',    icon: CreditCard },
  ];

  const handleSaveCompany = async () => {
    if (!profile?.id) return;
    if (!companyForm.companyName.trim()) {
      addToast({ type: 'error', title: 'Error', message: 'El nombre de la empresa es obligatorio.' });
      return;
    }
    setLoading(true);
    try {
      await api.put(`/v1/recruiter/profile/${profile.id}`, {
        firstName:          companyForm.firstName          || null,
        lastName:           companyForm.lastName           || null,
        companyName:        companyForm.companyName.trim(),
        photoUrl:           companyForm.photoUrl           || null,
        countryCode:        companyForm.countryCode        || null,
        industry:           companyForm.industry           || null,
        companyWebsite:     companyForm.companyWebsite     || null,
        companySize:        companyForm.companySize        || null,
        companyDescription: companyForm.companyDescription || null,
        phoneNumber:        companyForm.phoneNumber        || null,
      });
      useAuthStore.setState(s => ({
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
      await new Promise(r => setTimeout(r, 1000));
      addToast({ type: 'success', title: t('settings.passwordChanged'), message: t('settings.passwordChangedMessage') });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      addToast({ type: 'error', title: 'Error', message: t('settings.passwordChangeError') });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 2000));
      addToast({ type: 'success', title: 'Datos exportados', message: 'Recibirás el enlace por correo.' });
      setExportModalOpen(false);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'No se pudo exportar.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground mt-1">Tu espacio de gestión de empresa y preferencias</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {}
        <nav className="lg:w-64 flex-shrink-0">
          <Card className="p-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </Card>
        </nav>

        {}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">

            {}
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
                    {}
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
                            onChange={e => setCompanyForm({ ...companyForm, photoUrl: e.target.value })}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </Card>

                    {}
                    <Card className="p-6">
                      <h2 className="text-lg font-semibold text-foreground mb-4">Datos de la empresa</h2>
                      <div className="space-y-4">

                        {}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Nombre</label>
                            <Input
                              value={companyForm.firstName}
                              onChange={e => setCompanyForm({ ...companyForm, firstName: e.target.value })}
                              placeholder="Tu nombre"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Apellido</label>
                            <Input
                              value={companyForm.lastName}
                              onChange={e => setCompanyForm({ ...companyForm, lastName: e.target.value })}
                              placeholder="Tu apellido"
                            />
                          </div>
                        </div>

                        {}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            <Building2 className="inline w-4 h-4 mr-1 text-muted-foreground" />
                            Nombre de la empresa *
                          </label>
                          <Input
                            value={companyForm.companyName}
                            onChange={e => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                            placeholder="Ej: TechCorp Bolivia S.R.L."
                          />
                        </div>

                        {}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Industria / Sector</label>
                          <select
                            value={companyForm.industry}
                            onChange={e => setCompanyForm({ ...companyForm, industry: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <option value="">Selecciona el sector</option>
                            {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                          </select>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {}
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                              <Globe className="inline w-4 h-4 mr-1 text-muted-foreground" />
                              Sitio web
                            </label>
                            <Input
                              value={companyForm.companyWebsite}
                              onChange={e => setCompanyForm({ ...companyForm, companyWebsite: e.target.value })}
                              placeholder="https://empresa.com"
                              type="url"
                            />
                          </div>

                          {}
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                              <Users className="inline w-4 h-4 mr-1 text-muted-foreground" />
                              Tamaño de equipo
                            </label>
                            <select
                              value={companyForm.companySize}
                              onChange={e => setCompanyForm({ ...companyForm, companySize: e.target.value })}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              <option value="">Selecciona el tamaño</option>
                              {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} empleados</option>)}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {}
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">País (código ISO)</label>
                            <Input
                              value={companyForm.countryCode}
                              onChange={e => setCompanyForm({ ...companyForm, countryCode: e.target.value.toUpperCase().slice(0, 2) })}
                              placeholder="Ej: BO, AR, MX"
                              maxLength={2}
                            />
                          </div>

                          {}
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                              <Phone className="inline w-4 h-4 mr-1 text-muted-foreground" />
                              Teléfono
                            </label>
                            <Input
                              value={companyForm.phoneNumber}
                              onChange={e => setCompanyForm({ ...companyForm, phoneNumber: e.target.value })}
                              placeholder="+591 7XXXXXXX"
                              type="tel"
                            />
                          </div>
                        </div>

                        {}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            <FileText className="inline w-4 h-4 mr-1 text-muted-foreground" />
                            Descripción de la empresa
                          </label>
                          <textarea
                            value={companyForm.companyDescription}
                            onChange={e => setCompanyForm({ ...companyForm, companyDescription: e.target.value })}
                            placeholder="Breve descripción de tu empresa, misión y cultura..."
                            rows={4}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
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

            {}
            {activeTab === 'account' && (
              <motion.div
                key="account"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">{t('settings.changePassword')}</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">{t('settings.currentPassword')}</label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordForm.currentPassword}
                          onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
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
                      <label className="block text-sm font-medium text-foreground mb-1">{t('settings.newPassword')}</label>
                      <Input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">{t('settings.confirmPassword')}</label>
                      <Input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      />
                    </div>
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

            {}
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
                      { key: 'connections',  label: t('settings.connectionRequests') },
                      { key: 'messages',     label: t('settings.newMessages') },
                      { key: 'weeklyDigest', label: t('settings.weeklyDigest') },
                      { key: 'marketing',    label: t('settings.marketing') },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <span className="text-foreground">{item.label}</span>
                        <Switch
                          checked={safePreferences.notifications[item.key as keyof ProfilePreferences['notifications']] ?? true}
                          onChange={checked => updatePreferences({ notifications: { ...safePreferences.notifications, [item.key]: checked } })}
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {}
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
                      { key: 'showEmail',       label: t('settings.showEmail'),       portfolioKey: 'showEmail' as const },
                      { key: 'showLocation',    label: t('settings.showLocation'),    portfolioKey: 'showLocation' as const },
                      { key: 'showConnections', label: t('settings.showConnections'), portfolioKey: 'showConnections' as const },
                      { key: 'allowMessages',   label: t('settings.allowMessages'),   portfolioKey: null },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <span className="text-foreground">{item.label}</span>
                        <Switch
                          checked={safePreferences.privacy[item.key as keyof ProfilePreferences['privacy']] ?? true}
                          onChange={checked => {
                            updatePreferences({ privacy: { ...safePreferences.privacy, [item.key]: checked } });
                            if (item.portfolioKey) updatePortfolioSettings({ [item.portfolioKey]: checked });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {}
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
                          onClick={() => { setTheme(value); updatePreferences({ theme: value }); }}
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
                <Card className="p-6">
                  <div className="mb-4">
                    <h2 className="text-base font-semibold text-foreground">{t('settings.language')}</h2>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">{t('settings.languageDesc')}</p>
                  </div>
                  <LanguageSelector />
                </Card>
              </motion.div>
            )}

            {}
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

      {}
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
