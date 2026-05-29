import { useState, useEffect } from 'react';
import { Building2, ChevronDown, ChevronUp, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from '@/shared/ui';
import { useAuthStore } from '@/store/authStore';
import { companyProfileService } from '@/shared/services/companyProfileService';

export function CompanyProfileCard() {
  const { user, syncUser } = useAuthStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    companySize: '',
    nit: '',
    contactFirstName: '',
    contactLastName: '',
    websiteUrl: '',
  });

  useEffect(() => {
    if (user?.profile_id) {
      loadCompanyProfile();
    }
  }, [user?.profile_id]);

  const loadCompanyProfile = async () => {
    if (!user?.profile_id) return;
    try {
      const profile = await companyProfileService.getCompanyProfile(user.profile_id);
      if (profile) {
        setFormData({
          companyName: profile.company_name || '',
          industry: profile.industry || '',
          companySize: profile.company_size?.toString() || '',
          nit: profile.nit || '',
          contactFirstName: profile.contact_first_name || '',
          contactLastName: profile.contact_last_name || '',
          websiteUrl: profile.website_url || '',
        });

        syncUser({
          website: profile.website_url || '',
        });
      }
    } catch (error) {
      console.debug('Perfil de empresa no encontrado, se creará al guardar');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!user?.profile_id) {
      setErrorMessage('No se encontró el ID del perfil');
      return;
    }

    setIsLoading(true);
    try {
      await companyProfileService.saveCompanyProfile(user.profile_id, {
        company_name: formData.companyName,
        industry: formData.industry,
        company_size: parseInt(formData.companySize, 10),
        nit: formData.nit,
        contact_first_name: formData.contactFirstName,
        contact_last_name: formData.contactLastName,
        website_url: formData.websiteUrl,
      });

      syncUser({
        name: `${formData.contactFirstName} ${formData.contactLastName}`.trim(),
        website: formData.websiteUrl,
      });

      setSuccessMessage('Perfil de empresa guardado correctamente');
      setTimeout(() => {
        setSuccessMessage('');
        setIsExpanded(false);
      }, 2000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al guardar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full overflow-hidden border-gray-200 bg-white transition-colors dark:border-white/10 dark:bg-zinc-950">
      <div
        className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-gray-50 sm:p-6 dark:hover:bg-white/[0.02]"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 sm:h-12 sm:w-12 sm:rounded-2xl dark:bg-blue-500/10 dark:text-blue-400">
            <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-black sm:text-lg dark:text-white">
              Perfil de la Empresa
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nombre, rubro, tamaño y datos fiscales.
            </p>
          </div>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-zinc-900 dark:text-gray-400">
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-4 sm:p-6 dark:border-white/5 dark:bg-black/20">
          {successMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">{successMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-700 dark:bg-red-500/10 dark:text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-black dark:text-white">Nombre de la empresa</label>
                <input
                  type="text"
                  placeholder="Ej. TechCorp"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-black dark:text-white">Rubro / Industria</label>
                <input
                  type="text"
                  placeholder="Ej. Desarrollo de Software"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-black dark:text-white">Tamaño de la empresa</label>
                <select
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  value={formData.companySize}
                  onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                  disabled={isLoading}
                  required
                >
                  <option value="">Selecciona un tamaño</option>
                  <option value="1">1-10 empleados</option>
                  <option value="2">11-50 empleados</option>
                  <option value="3">51-200 empleados</option>
                  <option value="4">Más de 200 empleados</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-black dark:text-white">NIT</label>
                <input
                  type="text"
                  placeholder="Número de Identificación Tributaria"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  value={formData.nit}
                  onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-black dark:text-white">Nombre del contacto</label>
                <input
                  type="text"
                  placeholder="Ej. Laura"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  value={formData.contactFirstName}
                  onChange={(e) => setFormData({ ...formData, contactFirstName: e.target.value })}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-black dark:text-white">Apellido del contacto</label>
                <input
                  type="text"
                  placeholder="Ej. Torres"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  value={formData.contactLastName}
                  onChange={(e) => setFormData({ ...formData, contactLastName: e.target.value })}
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Sitio web y Teléfono lado a lado */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-black dark:text-white">Sitio web</label>
                <input
                  type="url"
                  placeholder="https://miempresa.com"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-black focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  disabled={isLoading}
                />
              </div>

            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-50 dark:bg-violet-600 dark:hover:bg-violet-700"
                disabled={isLoading}
              >
                <Save className="h-4 w-4" />
                {isLoading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      )}
    </Card>
  );
}