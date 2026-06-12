import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Mail, LockKeyhole, Eye, EyeOff,
  CheckCircle, AlertTriangle, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '@/shared/services/authService';
import { cn } from '@/shared/lib/utils';
import { AuthHero } from '@/components/auth/AuthShared';

// ── constants ───────────────────────────────────────────────────────────────
const OTP_MAX_ATTEMPTS   = 5;   // mirrored from backend
const COOLDOWN_SECONDS   = 60;  // 1-minute cooldown between requests (backend enforces 1 min)

// ── types ───────────────────────────────────────────────────────────────────
type Step = 'request' | 'verify' | 'reset' | 'done';

// ── helper: local countdown hook ────────────────────────────────────────────
function useCountdown(initial = 0) {
  const [secs, setSecs] = useState(initial);
  const idRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback((s: number) => {
    setSecs(s);
  }, []);

  useEffect(() => {
    if (secs <= 0) { if (idRef.current) clearInterval(idRef.current); return; }
    idRef.current = setInterval(() => setSecs(p => { if (p <= 1) { clearInterval(idRef.current!); return 0; } return p - 1; }), 1000);
    return () => { if (idRef.current) clearInterval(idRef.current); };
  }, [secs]);

  return { secs, start, active: secs > 0 };
}

// ── reusable input ──────────────────────────────────────────────────────────
function PremiumInput({
  id, type, value, onChange, placeholder, autoComplete,
  icon: Icon, error, suffix, disabled,
}: {
  id?: string; type: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; autoComplete?: string; icon: React.ElementType;
  error?: boolean; suffix?: React.ReactNode; disabled?: boolean;
}) {
  return (
    <div className="relative group">
      <Icon className={cn(
        'pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200',
        error ? 'text-red-400' : 'text-white/30 group-focus-within:text-violet-400',
      )} />
      <input
        id={id} type={type} value={value} onChange={onChange}
        placeholder={placeholder} autoComplete={autoComplete} disabled={disabled}
        className={cn(
          'h-11 w-full rounded-xl border bg-white/[0.04] pl-10 pr-11 text-sm text-white',
          'placeholder:text-white/22 transition-all duration-200 outline-none focus:bg-white/[0.06]',
          error
            ? 'border-red-500/50 focus:border-red-500/70 focus:ring-2 focus:ring-red-500/15'
            : 'border-white/8 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      />
      {suffix && <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>}
    </div>
  );
}

// ── step indicator ──────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: Step }) {
  const steps = [
    { key: 'request' as Step, label: 'Correo' },
    { key: 'verify'  as Step, label: 'Código' },
    { key: 'reset'   as Step, label: 'Contraseña' },
  ];
  const activeIdx = step === 'done' ? 3 : steps.findIndex(s => s.key === step);

  return (
    <div className="flex items-center mb-6">
      {steps.map((s, i) => {
        const done   = i < activeIdx;
        const active = i === activeIdx;
        return (
          <div key={s.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className={cn(
                'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                done   && 'bg-violet-500 text-white',
                active && 'bg-violet-600 text-white ring-2 ring-violet-400/40',
                !done && !active && 'bg-white/[0.06] text-white/30 border border-white/10',
              )}>
                {i + 1}
              </div>
              <span className={cn(
                'text-[10px] font-medium transition-colors',
                active ? 'text-violet-300' : done ? 'text-white/50' : 'text-white/25',
              )}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                'h-px flex-1 mb-4 mx-1 transition-all duration-500',
                i < activeIdx ? 'bg-violet-500/60' : 'bg-white/8',
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── page ────────────────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [step, setStep]               = useState<Step>('request');
  const [loading, setLoading]         = useState(false);
  const [email, setEmail]             = useState('');
  const [otpCode, setOtpCode]         = useState('');
  const [otpAttempts, setOtpAttempts] = useState(0);  // client-side mirror
  const [newPassword, setNewPassword] = useState('');
  const [confirmPwd, setConfirmPwd]   = useState('');
  const [showPwd, setShowPwd]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdError, setPwdError]       = useState(false);

  const cooldown = useCountdown();

  // ── step 1: request OTP ──────────────────────────────────────────────────
  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || cooldown.active) return;
    setLoading(true);
    try {
      await authService.forgotPasswordRequest(email);
      cooldown.start(COOLDOWN_SECONDS);
      setOtpAttempts(0);
      setOtpCode('');
      setStep('verify');
      toast.success('Código enviado', {
        description: `Revisa tu bandeja en ${email.trim().toLowerCase()}.`,
      });
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 429) {
        cooldown.start(COOLDOWN_SECONDS);
        toast.error('Demasiadas solicitudes', {
          description: 'Debes esperar al menos 1 minuto antes de solicitar otro código.',
        });
      } else {
        // Generic — don't reveal if email exists
        toast.info('Si el correo está registrado, recibirás un código.');
        cooldown.start(COOLDOWN_SECONDS);
        setStep('verify');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── step 2: verify OTP ───────────────────────────────────────────────────
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6 || loading) return;
    setLoading(true);
    try {
      const valid = await authService.forgotPasswordVerify(email, otpCode);
      if (valid) {
        setStep('reset');
      } else {
        const nextAttempts = otpAttempts + 1;
        setOtpAttempts(nextAttempts);

        if (nextAttempts >= OTP_MAX_ATTEMPTS) {
          // Backend already invalidated the code — send back to step 1
          toast.error('Código inválido', {
            description: 'Agotaste los 5 intentos. Solicita un nuevo código.',
          });
          setOtpCode('');
          setOtpAttempts(0);
          cooldown.start(COOLDOWN_SECONDS);
          setStep('request');
        } else {
          toast.error('Código incorrecto', {
            description: `Te quedan ${OTP_MAX_ATTEMPTS - nextAttempts} intento${OTP_MAX_ATTEMPTS - nextAttempts !== 1 ? 's' : ''}.`,
          });
          setOtpCode('');
        }
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        toast.error('Perfil no encontrado');
      } else {
        toast.error('Error verificando el código. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown.active || loading) return;
    setLoading(true);
    try {
      await authService.forgotPasswordRequest(email);
      setOtpCode('');
      setOtpAttempts(0);
      cooldown.start(COOLDOWN_SECONDS);
      toast.success('Nuevo código enviado');
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 429) {
        cooldown.start(COOLDOWN_SECONDS);
        toast.error('Demasiadas solicitudes', { description: 'Espera 1 minuto.' });
      } else {
        toast.error('No se pudo reenviar el código.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── step 3: reset password ───────────────────────────────────────────────
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPwdError(true);
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (newPassword !== confirmPwd) {
      setPwdError(true);
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setPwdError(false);
    setLoading(true);
    try {
      await authService.forgotPasswordReset(email, otpCode, newPassword);
      setStep('done');
      toast.success('Contraseña actualizada', {
        description: 'Ahora inicia sesión con tu nueva contraseña.',
      });
      setTimeout(() => navigate('/login', { replace: true }), 2500);
    } catch (err: any) {
      const status  = err?.response?.status;
      const message: string = err?.response?.data?.message ?? '';
      if (status === 401 || message.toLowerCase().includes('inválido') || message.toLowerCase().includes('expirado')) {
        toast.error('Código expirado', { description: 'Solicita un nuevo código.' });
        setOtpCode('');
        setOtpAttempts(0);
        cooldown.start(COOLDOWN_SECONDS);
        setStep('request');
      } else {
        toast.error('No se pudo actualizar la contraseña.', {
          description: message || 'Intenta nuevamente.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      {/* back link */}
      <motion.div
        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }} className="mb-6"
      >
        <Link to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-white/35 transition-colors hover:text-white/65"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al inicio de sesión
        </Link>
      </motion.div>

      <AuthHero
        eyebrow="Recupera tu cuenta"
        title={
          step === 'done'    ? '¡Contraseña actualizada!' :
          step === 'request' ? 'Olvidé mi contraseña' :
          step === 'verify'  ? 'Verifica tu identidad' :
                               'Nueva contraseña'
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-5 rounded-2xl border border-white/8 bg-white/[0.025] p-6 backdrop-blur-sm"
      >
        {step !== 'done' && <StepIndicator step={step} />}

        <AnimatePresence mode="wait">

          {/* ── Step 1: email ── */}
          {step === 'request' && (
            <motion.form key="request"
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }} onSubmit={handleRequest} className="space-y-4"
            >
              <p className="text-xs text-white/45 leading-relaxed">
                Ingresa tu correo registrado. Si existe una cuenta, recibirás un código de 6 dígitos.
              </p>

              <div className="space-y-1.5">
                <label htmlFor="fp-email" className="block text-xs font-semibold text-white/55">
                  Correo electrónico
                </label>
                <PremiumInput
                  id="fp-email" type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com" autoComplete="email" icon={Mail}
                  disabled={cooldown.active}
                />
              </div>

              <motion.button type="submit"
                disabled={loading || !email.trim() || cooldown.active}
                whileHover={{ scale: (loading || cooldown.active) ? 1 : 1.015 }}
                whileTap={{ scale: 0.985 }}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Enviando...</>
                ) : cooldown.active ? (
                  `Reenviar en ${cooldown.secs}s`
                ) : (
                  'Enviar código'
                )}
              </motion.button>
            </motion.form>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 'verify' && (
            <motion.div key="verify"
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }} className="space-y-4"
            >
              <p className="text-xs text-white/45 leading-relaxed">
                Hemos enviado un código a{' '}
                <span className="font-semibold text-white/70">{email.trim().toLowerCase()}</span>.
                Tienes <span className="font-semibold text-amber-300">{OTP_MAX_ATTEMPTS - otpAttempts} intento{OTP_MAX_ATTEMPTS - otpAttempts !== 1 ? 's' : ''}</span> restantes.
              </p>

              {otpAttempts > 0 && (
                <div className="flex items-center gap-3 rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                  <p className="text-xs text-amber-300/90">
                    {OTP_MAX_ATTEMPTS - otpAttempts} intento{OTP_MAX_ATTEMPTS - otpAttempts !== 1 ? 's' : ''} antes de invalidar el código
                  </p>
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="fp-otp" className="block text-xs font-semibold text-white/55">
                    Código de verificación
                  </label>
                  <input
                    id="fp-otp" type="text" inputMode="numeric" maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000" autoComplete="one-time-code"
                    className="h-11 w-full rounded-xl border border-white/8 bg-white/[0.04] px-4 text-center text-lg font-bold tracking-[0.5em] text-white placeholder:text-white/22 placeholder:tracking-normal transition-all duration-200 outline-none focus:bg-white/[0.06] focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15"
                  />
                </div>

                <motion.button type="submit"
                  disabled={loading || otpCode.length !== 6}
                  whileHover={{ scale: loading ? 1 : 1.015 }} whileTap={{ scale: 0.985 }}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Verificando...</>
                    : 'Verificar código'}
                </motion.button>
              </form>

              <button type="button" onClick={handleResend}
                disabled={loading || cooldown.active}
                className="flex w-full items-center justify-center gap-1.5 text-xs font-medium text-white/40 transition-colors hover:text-white/65 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {cooldown.active ? `Reenviar en ${cooldown.secs}s` : 'Reenviar código'}
              </button>
            </motion.div>
          )}

          {/* ── Step 3: new password ── */}
          {step === 'reset' && (
            <motion.form key="reset"
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }} onSubmit={handleReset} className="space-y-4"
            >
              <p className="text-xs text-white/45 leading-relaxed">
                Elige una nueva contraseña segura. Debe tener al menos 8 caracteres.
              </p>

              <div className="space-y-1.5">
                <label htmlFor="fp-newpwd" className="block text-xs font-semibold text-white/55">
                  Nueva contraseña
                </label>
                <PremiumInput
                  id="fp-newpwd" type={showPwd ? 'text' : 'password'} value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); if (pwdError) setPwdError(false); }}
                  placeholder="Mínimo 8 caracteres" autoComplete="new-password"
                  icon={LockKeyhole} error={pwdError}
                  suffix={
                    <button type="button" onClick={() => setShowPwd(v => !v)} tabIndex={-1}
                      className="text-white/30 hover:text-white/60 transition-colors">
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="fp-confirm" className="block text-xs font-semibold text-white/55">
                  Confirmar contraseña
                </label>
                <PremiumInput
                  id="fp-confirm" type={showConfirm ? 'text' : 'password'} value={confirmPwd}
                  onChange={e => { setConfirmPwd(e.target.value); if (pwdError) setPwdError(false); }}
                  placeholder="Repite tu contraseña" autoComplete="new-password"
                  icon={LockKeyhole} error={pwdError}
                  suffix={
                    <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                      className="text-white/30 hover:text-white/60 transition-colors">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
              </div>

              <motion.button type="submit"
                disabled={loading || !newPassword || !confirmPwd}
                whileHover={{ scale: loading ? 1 : 1.015 }} whileTap={{ scale: 0.985 }}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Guardando...</>
                  : 'Actualizar contraseña'}
              </motion.button>
            </motion.form>
          )}

          {/* ── Done ── */}
          {step === 'done' && (
            <motion.div key="done"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center gap-4 py-4"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/15 ring-2 ring-violet-500/30">
                <CheckCircle className="h-8 w-8 text-violet-400" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-white">¡Contraseña actualizada!</p>
                <p className="text-xs text-white/45">Redirigiendo al inicio de sesión…</p>
              </div>
              <Link to="/login"
                className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors">
                Ir al inicio de sesión →
              </Link>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}
