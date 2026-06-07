import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, User as ProfileIcon, Briefcase, Clock, MapPin, Search } from 'lucide-react';
import { Button, LoadingSpinner } from '@/shared/ui';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
// Importamos tu cliente API configurado
import api from '@/shared/api/api';

const seniorityOptions = ['Junior', 'Mid', 'Senior', 'Lead', 'Architect'];
const statusOptions = ['Disponible', 'Ocupado', 'Incógnito'];

interface ProfileEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileEditorModal({ isOpen, onClose }: ProfileEditorModalProps) {
  const { profile } = useAuthStore();
  const { addToast } = useUiStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [countries, setCountries] = useState<string[]>([]);
  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    photoUrl: '',
    seniority: 'Junior',
    availabilityStatus: 'Disponible',
    location: '',
  });

  useEffect(() => {
    if (!isOpen) return;
    const fetchCountries = async () => {
      try {
        const response = await api.get('/v1/countries');
        setCountries(response.data);
      } catch (error) {
        console.error("Error al cargar la lista de países", error);
      }
    };
    fetchCountries();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && profile?.id) {
      const fetchProfile = async () => {
        setIsFetching(true);
        try {
          const response = await api.get('/v1/profile/professional');
          const data = response.data;

          setFormData({
            firstName: data.firstName || profile.name?.split(' ')[0] || '',
            lastName: data.lastName || profile.name?.split(' ').slice(1).join(' ') || '',
            photoUrl: data.photoUrl || profile.avatar || '',
            seniority: data.seniority || 'Junior',
            availabilityStatus: data.availabilityStatus || 'Disponible',
            location: data.location || profile.location || '',
          });
          setPreviewUrl(data.photoUrl || profile.avatar || null);
        } catch (error) {
          console.error("Error al cargar el perfil", error);
        } finally {
          setIsFetching(false);
        }
      };

      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      addToast({ type: 'error', title: 'Error', message: 'Nombre y apellido requeridos.' });
      return;
    }

    setIsSaving(true);
    try {
      await api.put('/v1/profile/professional', formData);

      useAuthStore.setState((state) => ({
        profile: state.profile ? {
          ...state.profile,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          avatar: formData.photoUrl || state.profile.avatar,
          location: formData.location || state.profile.location,
        } : null
      }));

      addToast({ type: 'success', title: '¡Éxito!', message: 'Perfil actualizado correctamente.' });
      onClose();

    } catch (error) {
      console.error(error);
      addToast({ type: 'error', title: 'Error', message: 'No se pudo actualizar el perfil.' });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCountries = countries.filter(c =>
    c.toLowerCase().includes(formData.location.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg overflow-visible rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-950"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-white/10">
              <h2 className="font-sans text-xl font-semibold text-gray-900 dark:text-white">
                Editar Identidad Profesional
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
              {isFetching ? (
                <div className="flex justify-center py-10">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center gap-3">
                    <div
                      onClick={handleAvatarClick}
                      className="group relative h-24 w-24 cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 transition-colors hover:border-violet-500 dark:border-white/10"
                    >
                      {previewUrl ? (
                        <img src={previewUrl} className="h-full w-full object-cover" alt="Preview" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-50 dark:bg-white/5">
                          <ProfileIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    <p className="text-xs text-gray-500">Haz clic para cambiar la foto</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-400">Nombre</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData(p => ({ ...p, firstName: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-violet-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-400">Apellido</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData(p => ({ ...p, lastName: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-violet-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-400 flex items-center gap-2">
                        <Briefcase className="h-3 w-3" /> Nivel
                      </label>
                      <select
                        value={formData.seniority}
                        onChange={(e) => setFormData(p => ({ ...p, seniority: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-violet-500 focus:outline-none dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                      >
                        {seniorityOptions.map(opt => (
                          <option key={opt} value={opt} className="bg-white text-gray-900 dark:bg-zinc-900 dark:text-white">
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-gray-400 flex items-center gap-2">
                        <Clock className="h-3 w-3" /> Estado
                      </label>
                      <select
                        value={formData.availabilityStatus}
                        onChange={(e) => setFormData(p => ({ ...p, availabilityStatus: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-violet-500 focus:outline-none dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                      >
                        {statusOptions.map(opt => (
                          <option key={opt} value={opt} className="bg-white text-gray-900 dark:bg-zinc-900 dark:text-white">
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 relative">
                    <label className="text-xs font-bold uppercase text-gray-400 flex items-center gap-2">
                      <MapPin className="h-3 w-3" /> País
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => {
                          setFormData(p => ({ ...p, location: e.target.value }));
                          setShowCountrySuggestions(true);
                        }}
                        onFocus={() => setShowCountrySuggestions(true)}
                        onBlur={() => setTimeout(() => setShowCountrySuggestions(false), 200)}
                        placeholder="Buscar país..."
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:border-violet-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                      />
                    </div>

                    {showCountrySuggestions && formData.location && filteredCountries.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-white/10 dark:bg-zinc-900">
                        {filteredCountries.map(country => (
                          <div
                            key={country}
                            onClick={() => {
                              setFormData(p => ({ ...p, location: country }));
                              setShowCountrySuggestions(false);
                            }}
                            className="cursor-pointer px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                          >
                            {country}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-white/10">
              <Button variant="ghost" onClick={onClose} className="text-red-500 hover:bg-red-50">
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || isFetching}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 text-white min-w-[150px]"
              >
                {isSaving ? <LoadingSpinner size="sm" /> : 'Guardar Cambios'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}