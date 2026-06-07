import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Copy,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Lock,
  Search,
  Shield,
  Tag,
  UserCircle2,
} from 'lucide-react';
import { Badge, Button, Card, EmptyState, Input, LoadingSpinner, Select } from '@/shared/ui';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { useVisibilityStore } from '@/store/visibilityStore';
import type { PortfolioSection, SectionVisibility } from '@/shared/types';

const sectionLabels: Record<PortfolioSection, string> = {
  bio: 'Biografia',
  skills: 'Skills',
  projects: 'Proyectos',
  experience: 'Experiencia',
  contact: 'Contacto',
};

const visibilityOptions: { value: SectionVisibility; label: string }[] = [
  { value: 'PUBLIC', label: 'Publico' },
  { value: 'LINK_ONLY', label: 'Solo con enlace' },
  { value: 'PRIVATE', label: 'Privado' },
];

export default function VisibilityPage() {
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  const { addToast } = useUiStore();
  const {
    settings,
    loading,
    error,
    fetchSettings,
    updateSlug,
    updateSectionVisibility,
    updateSeoSettings,
  } = useVisibilityStore();

  const [slugDraft, setSlugDraft] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  useEffect(() => {
    if (profile?.id) {
      fetchSettings(profile.id);
    }
  }, [fetchSettings, profile?.id]);

  useEffect(() => {
    if (!settings) {
      return;
    }

    setSlugDraft(settings.slug);
    setSeoTitle(settings.seo.title);
    setSeoDescription(settings.seo.description);
  }, [settings]);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const publicUrl = useMemo(() => {
    const slug = slugDraft.trim() || settings?.slug || 'tu-usuario';
    return `${baseUrl}/p/${slug}`;
  }, [baseUrl, slugDraft, settings?.slug]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      addToast({ type: 'success', title: 'Enlace copiado' });
    } catch {
      addToast({ type: 'error', title: 'No se pudo copiar el enlace' });
    }
  };

  const handleSaveSlug = async () => {
    if (!profile?.id || !slugDraft.trim()) {
      addToast({ type: 'error', title: 'Ingresa un slug valido' });
      return;
    }

    try {
      await updateSlug(profile.id, slugDraft.trim());
      addToast({ type: 'success', title: 'Slug actualizado' });
    } catch {
      addToast({ type: 'error', title: 'No se pudo actualizar el slug' });
    }
  };

  const handleSaveSeo = async () => {
    if (!profile?.id) {
      return;
    }

    try {
      await updateSeoSettings(profile.id, {
        title: seoTitle.trim(),
        description: seoDescription.trim(),
      });
      addToast({ type: 'success', title: 'SEO actualizado' });
    } catch {
      addToast({ type: 'error', title: 'No se pudo actualizar el SEO' });
    }
  };

  const handleSectionChange = async (section: PortfolioSection, value: SectionVisibility) => {
    if (!profile?.id) {
      return;
    }

    try {
      await updateSectionVisibility(profile.id, section, value);
      addToast({ type: 'success', title: `Visibilidad de ${sectionLabels[section]} actualizada` });
    } catch {
      addToast({ type: 'error', title: 'No se pudo actualizar la seccion' });
    }
  };

  if (loading && !settings) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!settings) {
    return (
      <EmptyState
        icon={EyeOff}
        title="No hay configuracion de visibilidad disponible"
        description={error ?? 'Esta cuenta aun no tiene ajustes de visibilidad cargados.'}
      />
    );
  }

  return (
    <div className="space-y-6 xl:space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t('visibility.title', 'Visibilidad')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Controla el enlace publico, el SEO y la privacidad de tu portafolio.
          </p>
        </div>
        <Badge
          className={
            settings.isPublicProfileEnabled
              ? 'bg-green-500/10 text-green-600'
              : 'bg-slate-500/10 text-slate-600'
          }
        >
          {settings.isPublicProfileEnabled ? 'Perfil publico' : 'Perfil privado'}
        </Badge>
      </div>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-foreground">Slug publico</label>
            <Input value={slugDraft} onChange={(e) => setSlugDraft(e.target.value)} />
          </div>
          <Button onClick={handleSaveSlug}>Guardar slug</Button>
        </div>

        <div className="mt-4 rounded-2xl bg-muted/40 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">URL publica</p>
              <p className="font-medium text-foreground">{publicUrl}</p>
            </div>
            <Button variant="outline" onClick={handleCopyUrl}>
              <Copy className="mr-2 h-4 w-4" />
              Copiar enlace
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <Search className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">SEO basico</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Titulo</label>
            <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={60} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Descripcion</label>
            <textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
          <Button onClick={handleSaveSeo}>Guardar SEO</Button>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Privacidad</h2>
        </div>

        <div className="rounded-2xl border border-border p-4">
            <p className="font-medium text-foreground">Estado actual</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-4 w-4" />
                <span>
                  Perfil: {settings.isPublicProfileEnabled ? 'publicado' : 'oculto'}
                </span>
              </div>
            </div>
          </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <UserCircle2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Visibilidad por seccion</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(Object.keys(settings.sections) as PortfolioSection[]).map((section) => (
            <div key={section} className="rounded-2xl border border-border p-4">
              <div className="mb-3 flex items-center gap-2">
                {section === 'bio' && <FileText className="h-4 w-4 text-primary" />}
                {section === 'skills' && <Tag className="h-4 w-4 text-primary" />}
                {section === 'projects' && <Globe className="h-4 w-4 text-primary" />}
                {section === 'experience' && <Eye className="h-4 w-4 text-primary" />}
                {section === 'contact' && <Lock className="h-4 w-4 text-primary" />}
                <p className="font-medium text-foreground">{sectionLabels[section]}</p>
              </div>

              <Select
                value={settings.sections[section]}
                onChange={(e) =>
                  handleSectionChange(section, e.target.value as SectionVisibility)
                }
                options={visibilityOptions}
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
