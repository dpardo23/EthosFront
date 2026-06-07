import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Briefcase, Building2, Check, ChevronDown, Eye, EyeOff, LockKeyhole, Mail, MapPin, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import type { ProfileRole } from '@/shared/types';
import { useAuthStore } from '@/store';
import { cn } from '@/shared/lib/utils';
import { authService } from '@/shared/services/authService';
import {
  AuthHero,
  AuthFooterLink,
  AuthDivider,
  SocialAuthGroup,
} from '@/components/auth/AuthShared';
import { PasswordStrengthIndicator, usePasswordValidation } from '@/components/auth/PasswordStrengthIndicator';
import { TermsModal } from '@/components/auth/TermsModal';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * Registration page collecting name, email, password, role, and optional contact details.
 */
type Country = { code: string; name: string; dial: string; flag: string };

const COUNTRIES: Country[] = [
  { code: 'BO', name: 'Bolivia',          dial: '+591', flag: '🇧🇴' },
  { code: 'AR', name: 'Argentina',        dial: '+54',  flag: '🇦🇷' },
  { code: 'BR', name: 'Brasil',           dial: '+55',  flag: '🇧🇷' },
  { code: 'CL', name: 'Chile',            dial: '+56',  flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia',         dial: '+57',  flag: '🇨🇴' },
  { code: 'MX', name: 'México',           dial: '+52',  flag: '🇲🇽' },
  { code: 'PE', name: 'Perú',             dial: '+51',  flag: '🇵🇪' },
  { code: 'EC', name: 'Ecuador',          dial: '+593', flag: '🇪🇨' },
  { code: 'VE', name: 'Venezuela',        dial: '+58',  flag: '🇻🇪' },
  { code: 'UY', name: 'Uruguay',          dial: '+598', flag: '🇺🇾' },
  { code: 'PY', name: 'Paraguay',         dial: '+595', flag: '🇵🇾' },
  { code: 'CR', name: 'Costa Rica',       dial: '+506', flag: '🇨🇷' },
  { code: 'ES', name: 'España',           dial: '+34',  flag: '🇪🇸' },
  { code: 'US', name: 'Estados Unidos',   dial: '+1',   flag: '🇺🇸' },
  { code: 'CA', name: 'Canadá',           dial: '+1',   flag: '🇨🇦' },
  { code: 'GB', name: 'Reino Unido',      dial: '+44',  flag: '🇬🇧' },
  { code: 'DE', name: 'Alemania',         dial: '+49',  flag: '🇩🇪' },
  { code: 'FR', name: 'Francia',          dial: '+33',  flag: '🇫🇷' },
  { code: 'PT', name: 'Portugal',         dial: '+351', flag: '🇵🇹' },
  { code: 'IN', name: 'India',            dial: '+91',  flag: '🇮🇳' },
];

function PremiumInput({
  id,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  icon: Icon,
  error,
  suffix,
}: {
  id?: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  icon: React.ElementType;
  error?: boolean;
  suffix?: React.ReactNode;
}) {
  return (
    <div className="relative group">
      <Icon
        className={cn(
          'pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200',
          error ? 'text-red-400' : 'text-white/30 group-focus-within:text-violet-400'
        )}
      />
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={cn(
          'h-11 w-full rounded-xl border bg-white/[0.04] pl-10 pr-11 text-sm text-white placeholder:text-white/22 transition-all duration-200 outline-none',
          'focus:bg-white/[0.06]',
          error
            ? 'border-red-500/50 focus:border-red-500/70 focus:ring-2 focus:ring-red-500/15'
            : 'border-white/8 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15'
        )}
      />
      {suffix && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>
      )}
    </div>
  );
}

function PhoneInputField({
  country,
  onCountryChange,
  value,
  onChange,
}: {
  country: Country;
  onCountryChange: (c: Country) => void;
  value: string;
  onChange: (v: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [pickerOpen]);

  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dial.includes(search)
  );

  return (
    <div ref={containerRef} className="relative flex">
      <button
        type="button"
        onClick={() => setPickerOpen((p) => !p)}
        className={cn(
          'flex h-11 shrink-0 items-center gap-1.5 rounded-l-xl border border-r-0 px-3 transition-all duration-150 focus:outline-none',
          pickerOpen
            ? 'border-violet-500/50 bg-violet-500/[0.07]'
            : 'border-white/8 bg-white/[0.04] hover:border-white/[0.12] hover:bg-white/[0.065]'
        )}
      >
        <span className="text-base leading-none">{country.flag}</span>
        <span className="font-mono text-xs text-white/65">{country.dial}</span>
        <ChevronDown
          className={cn(
            'h-3 w-3 transition-transform duration-150',
            pickerOpen ? 'rotate-180 text-violet-400/70' : 'text-white/30'
          )}
        />
      </button>

      <input
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
        placeholder="Número de celular"
        className="h-11 flex-1 rounded-r-xl border border-white/8 bg-white/[0.04] px-4 text-sm text-white placeholder:text-white/22 outline-none transition-all duration-200 focus:border-violet-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-500/15"
      />

      <AnimatePresence>
        {pickerOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-xl border border-white/[0.09] bg-[#0E0E1C] shadow-[0_8px_40px_rgba(0,0,0,0.88),0_0_0_1px_rgba(255,255,255,0.04)]"
          >
            <div className="border-b border-white/[0.06] p-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar país..."
                autoFocus
                className="w-full rounded-lg border border-white/[0.07] bg-white/[0.05] px-3 py-2 text-xs text-white/75 placeholder:text-white/28 outline-none transition-colors focus:border-violet-500/40 focus:bg-white/[0.07]"
              />
            </div>
            <div className="max-h-52 overflow-y-auto py-1">
              {filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    onCountryChange(c);
                    setPickerOpen(false);
                    setSearch('');
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors duration-100',
                    country.code === c.code
                      ? 'bg-violet-500/[0.12] text-violet-300'
                      : 'text-white/62 hover:bg-white/[0.05] hover:text-white/80'
                  )}
                >
                  <span className="text-base leading-none">{c.flag}</span>
                  <span className="flex-1 text-[12px]">{c.name}</span>
                  <span className="font-mono text-[11px] text-white/28">{c.dial}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-3 py-3 text-xs text-white/30">Sin resultados</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RoleCard({
  role,
  selected,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  role: 'Estandar' | 'Reclutador';
  selected: boolean;
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'relative flex flex-col items-start gap-2 overflow-hidden rounded-xl border p-3 text-left transition-all duration-300',
        selected
          ? 'border-violet-500/50 bg-violet-500/8 shadow-[0_0_32px_-8px_rgba(168,85,247,0.35)]'
          : 'border-white/8 bg-white/[0.025] hover:border-violet-500/25 hover:bg-violet-500/4'
      )}
    >
      {}
      {selected && (
        <motion.div
          layoutId={`role-glow-${role}`}
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(168,85,247,0.04) 100%)',
          }}
        />
      )}

      {}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 rounded-xl"
            style={{
              boxShadow: 'inset 0 0 0 1px rgba(168,85,247,0.4)',
            }}
          />
        )}
      </AnimatePresence>

      {}
      <div
        className={cn(
          'relative z-10 flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300',
          selected
            ? 'bg-violet-600 shadow-[0_0_20px_rgba(124,58,237,0.5)]'
            : 'bg-white/8'
        )}
      >
        <Icon className={cn('h-4.5 w-4.5', selected ? 'text-white' : 'text-white/45')} />
      </div>

      {}
      <div className="relative z-10">
        <p className={cn('text-sm font-semibold transition-colors', selected ? 'text-white' : 'text-white/55')}>
          {title}
        </p>
        <p className="mt-0.5 text-[11px] leading-5 text-white/32">{description}</p>
      </div>

      {}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-violet-500 shadow-[0_0_12px_rgba(168,85,247,0.6)]"
          >
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const completeOAuthLogin = useAuthStore((state) => state.completeOAuthLogin);
  const [selectedRole, setSelectedRole] = useState<'Estandar' | 'Reclutador' | null>(null);
  const [showRoleRequiredMessage, setShowRoleRequiredMessage] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneCountry, setPhoneCountry] = useState<Country>(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [region, setRegion] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { allPassed: isPasswordValid } = usePasswordValidation(password);
  const isFormValid = fullName.trim().length >= 2 && email.length > 0 && isPasswordValid && acceptedTerms && selectedRole !== null;

  const handlePhoneCountryChange = (country: Country) => {
    setPhoneCountry(country);
    setRegion(country.name);
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    if (!selectedRole) {
      setShowRoleRequiredMessage(true);
      toast.error('Debes elegir un rol antes de continuar', {
        description: 'Selecciona si eres Profesional o Reclutador para usar OAuth.',
      });
      return;
    }

    const oauthRole = selectedRole === 'Estandar' ? 'PROFESSIONAL' : 'RECRUITER';

    if (isSupabaseConfigured && supabase) {
      localStorage.setItem('ethoshub_pending_oauth_role', oauthRole);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/oauth-success` },
      });
      if (error) {
        localStorage.removeItem('ethoshub_pending_oauth_role');
        toast.error('Error al continuar con OAuth', { description: error.message });
      }
      return;
    }

    window.location.href = `${window.location.origin}/oauth2/authorization/${provider}?role=${oauthRole}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (fullName.trim().length < 2) {
      toast.error('El nombre es obligatorio');
      return;
    }

    if (!password.trim()) {
      setPasswordError(true);
      toast.error('La contraseña es obligatoria');
      return;
    }
    setPasswordError(false);

    if (!selectedRole) {
      toast.error('Debes elegir un rol para crear tu cuenta');
      return;
    }
    if (!isFormValid) return;

    const selectedFrontendRole = selectedRole === 'Estandar' ? 'professional' : 'recruiter';
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    try {
      setSubmitting(true);
      const sanitizedPhoneCode = phoneCountry.dial.replace(/[^+\d]/g, '').slice(0, 10);
      const authData = await authService.registerLocal(email, password, selectedFrontendRole, {
        firstName,
        lastName,
        ...(phoneNumber.trim() ? {
          phoneCode: sanitizedPhoneCode,
          phoneNumber: phoneNumber.trim(),
        } : {}),
        ...(phoneCountry.code ? { countryCode: phoneCountry.code } : {}),
      });

      const { ROLE_INITIAL_PATHS } = await import('@/app/router/routes');

      if (authData?.token) {
        
        const rawRole = (authData.role || '').toLowerCase();
        const normalizedRole: ProfileRole = rawRole.includes('rec') ? 'recruiter' : 'professional';
        completeOAuthLogin({
          profile: {
            id: authData.profileId,
            profile_id: authData.profileId,
            email: authData.email,
            name: `${firstName} ${lastName}`.trim() || authData.email.split('@')[0],
            role: normalizedRole,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(authData.email)}`,
            createdAt: new Date().toISOString(),
          },
          token: authData.token,
          expiresIn: 3600,
        });
        toast.success('Cuenta creada e iniciada correctamente', {
          description: `Accediendo como ${normalizedRole === 'recruiter' ? 'Reclutador' : 'Profesional'}.`,
        });
        navigate(ROLE_INITIAL_PATHS[normalizedRole] ?? '/dashboard', { replace: true });
        return;
      }

      
      const loginResult = await login(email, password, selectedFrontendRole);
      if (loginResult) {
        toast.success('Cuenta creada e iniciada correctamente', {
          description: `Accediendo como ${loginResult.roleDisplayName}.`,
        });
        navigate(ROLE_INITIAL_PATHS[loginResult.profile.role] ?? '/dashboard', { replace: true });
        return;
      }

      
      toast.success('Cuenta creada correctamente', {
        description: 'Ahora puedes iniciar sesión con tus credenciales.',
      });
      navigate('/login', {
        replace: false,
        state: { prefills: { email, password, role: selectedFrontendRole, fromRegister: true } },
      });
    } catch (error: any) {
      const status = error?.response?.status;
      const errorMessage: string = error?.response?.data?.message || error?.message || '';
      if (status === 409 || errorMessage.toLowerCase().includes('already exists')) {
        toast.error('Este correo ya está registrado', {
          description: 'Ya existe una cuenta con este correo. Intenta iniciar sesión.',
        });
      } else if (status === 403 || errorMessage.toLowerCase().includes('dominio no autorizado')) {
        toast.error('Dominio de correo no autorizado', {
          description: 'El dominio de tu correo institucional no está en la lista de instituciones permitidas.',
        });
      } else {
        toast.error('No se pudo crear la cuenta', {
          description: errorMessage || 'Intenta nuevamente.',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-white/35 transition-colors hover:text-white/65"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al inicio
        </Link>
      </motion.div>

      <AuthHero
        eyebrow="Únete a EthosHub"
        title="Crea tu cuenta"
        description="Construye tu portafolio digital y conecta con la comunidad tech."
      />

      {}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-5 rounded-2xl border border-white/8 bg-white/[0.025] p-6 backdrop-blur-sm"
      >
        {}
        <div className="space-y-2.5">
          <p className="text-xs font-semibold text-white/45">¿Cuál es tu perfil?</p>
          <div className="grid grid-cols-2 gap-3">
            <RoleCard
              role="Estandar"
              selected={selectedRole === 'Estandar'}
              icon={Briefcase}
              title="Soy Profesional"
              description="Construye tu identidad profesional..."
              onClick={() => {
                setSelectedRole('Estandar');
                setShowRoleRequiredMessage(false);
              }}
            />
            <RoleCard
              role="Reclutador"
              selected={selectedRole === 'Reclutador'}
              icon={Building2}
              title="Soy Reclutador"
              description="Encuentra talento verificado..."
              onClick={() => {
                setSelectedRole('Reclutador');
                setShowRoleRequiredMessage(false);
              }}
            />
          </div>

          <AnimatePresence>
            {!selectedRole && showRoleRequiredMessage && (
              <motion.p
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                className="rounded-xl border border-orange-500/20 bg-orange-500/8 px-3.5 py-2.5 text-xs text-orange-300"
              >
                Selecciona tu perfil antes de continuar con Google o GitHub.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {}
          <div className="space-y-1.5">
            <label htmlFor="register-name" className="block text-xs font-semibold text-white/55">
              Nombre completo
            </label>
            <PremiumInput
              id="register-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛäëïöüÄËÏÖÜñÑçÇ'\- ]/g, ''))}
              placeholder="Tu nombre y apellido"
              autoComplete="name"
              icon={UserRound}
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="register-email" className="block text-xs font-semibold text-white/55">
              Correo electrónico
            </label>
            <PremiumInput
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              icon={Mail}
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="register-password" className="block text-xs font-semibold text-white/55">
              Contraseña
            </label>
            <PremiumInput
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError(false);
              }}
              placeholder="Crea una contraseña segura"
              autoComplete="new-password"
              icon={LockKeyhole}
              error={passwordError}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-white/30 transition-colors hover:text-white/60"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
          </div>

          <PasswordStrengthIndicator password={password} />

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-white/55">
              Celular{' '}
              <span className="font-normal text-white/25">(opcional)</span>
            </label>
            <PhoneInputField
              country={phoneCountry}
              onCountryChange={handlePhoneCountryChange}
              value={phoneNumber}
              onChange={setPhoneNumber}
            />
          </div>

          {/* Region */}
          <div className="space-y-1.5">
            <label htmlFor="register-region" className="block text-xs font-semibold text-white/55">
              País / Región{' '}
              <span className="font-normal text-white/25">(opcional)</span>
            </label>
            <PremiumInput
              id="register-region"
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛäëïöüÄËÏÖÜñÑçÇ ]/g, ''))}
              placeholder="Ej: Bolivia, México..."
              icon={MapPin}
            />
          </div>

          {/* Terms */}
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/6 bg-white/[0.02] px-3.5 py-3 transition-colors hover:bg-white/[0.035]">
            <div className="relative mt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-white/15 bg-white/5 transition-all checked:border-violet-500 checked:bg-violet-600"
              />
              <Check className="pointer-events-none absolute inset-0 m-auto h-2.5 w-2.5 text-white opacity-0 transition-opacity peer-checked:opacity-100" strokeWidth={3} />
            </div>
            <span className="text-xs leading-5 text-white/40">
              Acepto los{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setTermsModalOpen(true);
                }}
                className="font-semibold text-violet-400 underline-offset-2 hover:underline"
              >
                Términos y Condiciones
              </button>
            </span>
          </label>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={submitting || (!isFormValid && password.length > 0)}
            whileHover={{
              scale: submitting ? 1 : 1.015,
              boxShadow: submitting ? 'none' : '0 0 40px rgba(168,85,247,0.35)',
            }}
            whileTap={{ scale: 0.985 }}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all disabled:cursor-not-allowed disabled:opacity-55"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Creando cuenta...
              </>
            ) : (
              'Crear cuenta'
            )}
          </motion.button>
        </form>

        <AuthDivider label="O regístrate con" />

        <SocialAuthGroup
          googleLabel="Google"
          githubLabel="GitHub"
          onProviderClick={handleOAuth}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="mt-5"
      >
        <AuthFooterLink prompt="¿Ya tienes cuenta?" cta="Iniciar sesión" to="/login" />
      </motion.div>

      <TermsModal isOpen={termsModalOpen} onClose={() => setTermsModalOpen(false)} />
    </div>
  );
}
