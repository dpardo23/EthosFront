import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, User, ChevronDown } from 'lucide-react';
import { Button } from '@/shared/ui';
import { useAuthStore } from '@/store/authStore';

const countries = [
  'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia',
  'Costa Rica', 'Cuba', 'Ecuador', 'El Salvador', 'España',
  'Guatemala', 'Honduras', 'México', 'Nicaragua', 'Panamá',
  'Paraguay', 'Perú', 'República Dominicana', 'Uruguay', 'Venezuela',
];

// Mapeo de países a country_id (ajusta los IDs según tu BD)
// TODO: Verificar los IDs exactos en core.countries
const COUNTRY_ID_MAP: Record<string, number> = {
  'Argentina': 1,
  'Bolivia': 2,
  'Brasil': 3,
  'Chile': 4,
  'Colombia': 5,
  'Costa Rica': 6,
  'Cuba': 7,
  'Ecuador': 8,
  'El Salvador': 9,
  'España': 10,
  'Guatemala': 11,
  'Honduras': 12,
  'México': 13,
  'Nicaragua': 14,
  'Panamá': 15,
  'Paraguay': 16,
  'Perú': 17,
  'República Dominicana': 18,
  'Uruguay': 19,
  'Venezuela': 20,
};

interface RecruiterProfileEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RecruiterProfileEditorModal({ isOpen, onClose }: RecruiterProfileEditorModalProps) {
  const { user, updateRecruiterIdentity, loading } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [countryOpen, setCountryOpen] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    avatarPreview: user?.avatar || '',
    country: user?.location || '',
    phone: user?.phone || '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        avatarPreview: user.avatar || '',
        country: user.location || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setCountryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, avatarPreview: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    // Validar que se haya seleccionado un país
    if (!formData.country) {
      alert('Por favor selecciona un país');
      return;
    }

    const countryId = COUNTRY_ID_MAP[formData.country];
    if (!countryId) {
      alert('País no reconocido');
      return;
    }

    // Validar que nombre y apellido no estén vacíos
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert('Por favor ingresa nombre y apellido');
      return;
    }

    // Llamar a updateRecruiterIdentity con los datos correctos
    await updateRecruiterIdentity({
      firstName: formData.firstName,
      lastName: formData.lastName,
      photoUrl: formData.avatarPreview,
      country: formData.country,
      countryId: countryId,
      phone: formData.phone,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-950"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-white/10">
              <h2 className="font-sans text-xl font-semibold text-black dark:text-white">
                Editar Identidad Reclutador
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-black dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body — sin overflow para que el dropdown no se recorte */}
            <div className="p-6 space-y-6">

              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <div
                  onClick={handleAvatarClick}
                  className="group relative h-24 w-24 cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 transition-colors hover:border-violet-500 dark:border-white/10"
                >
                  {formData.avatarPreview ? (
                    <img src={formData.avatarPreview} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-50 dark:bg-white/5">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload className="h-6 w-6 text-white" />
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                <p className="text-xs text-gray-500">Formato cuadrado recomendado</p>
              </div>

              {/* Nombre y Apellido */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Nombre</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(p => ({ ...p, firstName: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Apellido</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(p => ({ ...p, lastName: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* País */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">País</label>
                  <div ref={countryRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setCountryOpen(o => !o)}
                      className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                    >
                      <span className={formData.country ? 'text-black dark:text-white' : 'text-gray-400'}>
                        {formData.country || 'Selecciona...'}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${countryOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {countryOpen && (
                        <motion.ul
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 top-full z-[200] mt-1 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-white/10 dark:bg-zinc-900"
                          style={{ maxHeight: '10rem' }}
                        >
                          {countries.map((c) => (
                            <li
                              key={c}
                              onClick={() => {
                                setFormData(p => ({ ...p, country: c }));
                                setCountryOpen(false);
                              }}
                              className={`cursor-pointer px-4 py-2 text-sm transition-colors hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-500/10 dark:hover:text-violet-300 ${
                                formData.country === c
                                  ? 'bg-violet-50 font-medium text-violet-600 dark:bg-violet-500/10 dark:text-violet-300'
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {c}
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="Ej. +591 77712345"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-white/10">
              <Button variant="ghost" onClick={onClose} className="text-red-500 hover:bg-red-50">
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                loading={loading}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 text-white shadow-lg hover:from-violet-700"
              >
                Actualizar Perfil
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
