import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store';
import { cn } from '@/shared/lib/utils';
import {
  AuthHero,
  AuthFooterLink,
  AuthDivider,
  SocialAuthGroup,
} from '@/components/auth/AuthShared';
import { useAuthFlow } from '@/hooks/useAuthFlow';

type RegisterPrefills = {
  email?: string;
  password?: string;
  fromRegister?: boolean;
  fullName?: string;
  role?: 'professional' | 'recruiter' | 'admin' | 'guest';
};

// ─── Premium Input ────────────────────────────────────────────────────
function PremiumInput({
  id,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
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
  required?: boolean;
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
        required={required}
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

export default function LoginPage() {
  const location = useLocation();
  const { loading } = useAuthStore();
  const { loginWithPassword, loginWithOAuth, oauthLoading } = useAuthFlow();
  const prefills = (location.state as { prefills?: RegisterPrefills } | null)?.prefills;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  useEffect(() => {
    if (prefills?.email) setEmail(prefills.email);
    if (prefills?.password) setPassword(prefills.password);
  }, [prefills]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setPasswordError(true);
      toast.error('La contraseña es requerida para iniciar sesión');
      return;
    }
    setPasswordError(false);

    try {
      const result = await loginWithPassword(email, password);
      if (result) {
        toast.success(`Bienvenido de nuevo, ${result.roleDisplayName}`, {
          description: 'Has iniciado sesión correctamente',
          duration: 4000,
        });
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || '';
      const status = error?.response?.status;

      if (status === 403 || errorMessage.toLowerCase().includes('dominio no autorizado')) {
        toast.error('Dominio de correo no autorizado', {
          description: 'El dominio de tu correo institucional ha sido revocado o no es válido.',
        });
      } else if (status === 429) {
        toast.error('Demasiados intentos', {
          description: 'Has intentado iniciar sesión demasiadas veces. Intenta más tarde.',
        });
      } else {
        toast.error('No se pudo iniciar sesión', {
          description: 'Verifica tus credenciales e intenta nuevamente.',
        });
      }
    }
  };

  const handleOAuth = (provider: 'google' | 'github') => {
    void loginWithOAuth(provider, prefills?.role as 'professional' | 'recruiter' | undefined);
  };

  return (
    <div className="w-full">
      {/* Back link */}
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

      <AuthHero eyebrow="Bienvenido de vuelta" title="Inicia sesión" />

      {/* Form card */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-5 rounded-2xl border border-white/8 bg-white/[0.025] p-6 backdrop-blur-sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="block text-xs font-semibold text-white/55">
              Correo electrónico
            </label>
            <PremiumInput
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="profileHandle"
              required
              icon={Mail}
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="block text-xs font-semibold text-white/55">
                Contraseña
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] font-semibold text-violet-400 transition-colors hover:text-violet-300"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <PremiumInput
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError(false);
              }}
              placeholder="Tu contraseña"
              autoComplete="current-password"
              icon={LockKeyhole}
              error={passwordError}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-white/30 transition-colors hover:text-white/60"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.015, boxShadow: loading ? 'none' : '0 0 40px rgba(168,85,247,0.35)' }}
            whileTap={{ scale: 0.985 }}
            className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Iniciando sesión...
              </>
            ) : (
              'Iniciar sesión'
            )}
          </motion.button>
        </form>

        <AuthDivider />

        <SocialAuthGroup
          googleLabel="Google"
          githubLabel="GitHub"
          onProviderClick={handleOAuth}
          loadingProvider={oauthLoading}
          disabled={loading}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="mt-5"
      >
        <AuthFooterLink prompt="¿No tienes cuenta?" cta="Crear cuenta" to="/register" />
      </motion.div>
    </div>
  );
}
