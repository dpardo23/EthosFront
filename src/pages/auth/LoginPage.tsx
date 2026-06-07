import { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, AlertTriangle } from 'lucide-react';
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

/**
 * Login page with email/password form, OAuth buttons, and post-login role-based redirect.
 */
const RL_KEY = 'ethoshub_login_rl';
const MAX_ATTEMPTS  = 15; 
const WARN_ATTEMPTS = 5;  

interface RLData {
  attempts: number;       
  blockedUntil: number;   
  blockCount: number;     
}

function getRLData(): RLData {
  try {
    const raw = localStorage.getItem(RL_KEY);
    if (raw) return JSON.parse(raw) as RLData;
  } catch {  }
  return { attempts: 0, blockedUntil: 0, blockCount: 0 };
}

function saveRLData(d: RLData) {
  localStorage.setItem(RL_KEY, JSON.stringify(d));
}

function getBlockDuration(blockCount: number): number {
  
  return Math.min(3 + blockCount * 3, 30) * 60 * 1000;
}

function formatTimeLeft(ms: number): string {
  const secs = Math.ceil(ms / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

type RegisterPrefills = {
  email?: string;
  password?: string;
  fromRegister?: boolean;
  fullName?: string;
  role?: 'professional' | 'recruiter' | 'admin' | 'guest';
};

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
  const [timeLeft, setTimeLeft] = useState(0); 
  const [attempts, setAttempts] = useState(() => getRLData().attempts);

  useEffect(() => {
    if (prefills?.email) setEmail(prefills.email);
    if (prefills?.password) setPassword(prefills.password);
  }, [prefills]);

  
  useEffect(() => {
    const rl = getRLData();
    const remaining = rl.blockedUntil - Date.now();
    if (remaining > 0) setTimeLeft(remaining);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1000) { clearInterval(id); return 0; }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  const isBlocked = timeLeft > 0;
  const attemptsLeft = Math.max(0, WARN_ATTEMPTS - attempts);

  const recordFailure = useCallback(() => {
    const rl = getRLData();
    rl.attempts += 1;
    setAttempts(rl.attempts);

    if (rl.attempts >= MAX_ATTEMPTS) {
      
      saveRLData(rl);
      return;
    }

    
    if (rl.attempts % WARN_ATTEMPTS === 0) {
      const duration = getBlockDuration(rl.blockCount);
      rl.blockedUntil = Date.now() + duration;
      rl.blockCount += 1;
      setTimeLeft(duration);
      toast.error(`Cuenta bloqueada temporalmente`, {
        description: `Demasiados intentos. Intenta de nuevo en ${formatTimeLeft(duration)}.`,
      });
    }

    saveRLData(rl);
  }, []);

  const recordSuccess = useCallback(() => {
    saveRLData({ attempts: 0, blockedUntil: 0, blockCount: 0 });
    setAttempts(0);
    setTimeLeft(0);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isBlocked) {
      toast.error(`Cuenta bloqueada`, { description: `Espera ${formatTimeLeft(timeLeft)} antes de intentar de nuevo.` });
      return;
    }

    const rl = getRLData();
    if (rl.attempts >= MAX_ATTEMPTS) {
      toast.error('Acceso bloqueado', { description: 'Has superado el máximo de intentos. Contacta soporte.' });
      return;
    }

    if (!password.trim()) {
      setPasswordError(true);
      toast.error('La contraseña es requerida para iniciar sesión');
      return;
    }
    setPasswordError(false);

    try {
      const result = await loginWithPassword(email, password);
      if (result) {
        recordSuccess();
        toast.success(`Bienvenido de nuevo, ${result.roleDisplayName}`, {
          description: 'Has iniciado sesión correctamente',
          duration: 4000,
        });
      }
    } catch (error: any) {
      recordFailure();
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
        const newAttempts = getRLData().attempts;
        const left = Math.max(0, WARN_ATTEMPTS - newAttempts % WARN_ATTEMPTS);
        toast.error('No se pudo iniciar sesión', {
          description: left > 0 && left < WARN_ATTEMPTS
            ? `Credenciales incorrectas. Te quedan ${left} intentos antes del bloqueo temporal.`
            : 'Verifica tus credenciales e intenta nuevamente.',
        });
      }
    }
  };

  const handleOAuth = (provider: 'google' | 'github') => {
    void loginWithOAuth(provider, prefills?.role as 'professional' | 'recruiter' | undefined);
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

      <AuthHero eyebrow="Bienvenido de vuelta" title="Inicia sesión" />

      {}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-5 rounded-2xl border border-white/8 bg-white/[0.025] p-6 backdrop-blur-sm"
      >
        {}
        {isBlocked && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
            <div>
              <p className="text-xs font-semibold text-red-300">Cuenta bloqueada temporalmente</p>
              <p className="text-xs text-red-400/80 mt-0.5">Podrás intentarlo de nuevo en <span className="font-bold text-red-300">{formatTimeLeft(timeLeft)}</span></p>
            </div>
          </div>
        )}

        {}
        {!isBlocked && attempts > 0 && attempts < MAX_ATTEMPTS && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-xs text-amber-300/90">
              {attemptsLeft > 0
                ? `${attemptsLeft} intento${attemptsLeft !== 1 ? 's' : ''} restante${attemptsLeft !== 1 ? 's' : ''} antes del bloqueo temporal`
                : 'Muchos intentos fallidos. Verifica bien tus credenciales.'}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {}
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
              autoComplete="email"
              required
              icon={Mail}
            />
          </div>

          {}
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

          {}
          <motion.button
            type="submit"
            disabled={loading || isBlocked || getRLData().attempts >= MAX_ATTEMPTS}
            whileHover={{ scale: (loading || isBlocked) ? 1 : 1.015, boxShadow: (loading || isBlocked) ? 'none' : '0 0 40px rgba(168,85,247,0.35)' }}
            whileTap={{ scale: 0.985 }}
            className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Iniciando sesión...
              </>
            ) : isBlocked ? (
              `Bloqueado — ${formatTimeLeft(timeLeft)}`
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
