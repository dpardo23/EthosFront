import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface PasswordRequirement {
  key: string;
  label: string;
  validator: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { key: 'minLength', label: 'Mínimo 8 caracteres',           validator: (p) => p.length >= 8 },
  { key: 'maxLength', label: 'Máximo 30 caracteres',           validator: (p) => p.length <= 30 },
  { key: 'uppercase', label: 'Al menos 1 mayúscula',           validator: (p) => /[A-Z]/.test(p) },
  { key: 'lowercase', label: 'Al menos 1 minúscula',           validator: (p) => /[a-z]/.test(p) },
  { key: 'number',    label: 'Al menos 1 número',              validator: (p) => /[0-9]/.test(p) },
  { key: 'special',   label: 'Al menos 1 carácter especial',   validator: (p) => /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\;'/`~]/.test(p) },
];

function strengthLabel(passed: number, allPassed: boolean): { text: string; color: string } {
  if (allPassed) return { text: 'Segura', color: 'text-emerald-400' };
  if (passed === 0) return { text: 'Ingresa una contraseña', color: 'text-white/30' };
  if (passed <= 2) return { text: 'Muy débil', color: 'text-red-400' };
  if (passed <= 4) return { text: 'Débil', color: 'text-orange-400' };
  return { text: 'Casi lista', color: 'text-yellow-400' };
}

function strengthBarColor(passed: number, allPassed: boolean): string {
  if (allPassed) return 'bg-emerald-500';
  if (passed <= 2) return 'bg-red-500';
  if (passed <= 4) return 'bg-orange-500';
  return 'bg-yellow-500';
}

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const validation = useMemo(() => {
    return passwordRequirements.map((req) => ({
      ...req,
      passed: password.length > 0 ? req.validator(password) : false,
    }));
  }, [password]);

  const passedCount = validation.filter((v) => v.passed).length;
  const totalCount = validation.length;
  const allPassed = passedCount === totalCount && password.length > 0;
  const progress = password.length > 0 ? (passedCount / totalCount) * 100 : 0;
  const { text, color } = strengthLabel(passedCount, allPassed);

  if (password.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('space-y-3 overflow-hidden', className)}
    >
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-white/35">Seguridad</span>
          <span className={cn('text-[11px] font-semibold transition-colors duration-300', color)}>
            {text}
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/6">
          <motion.div
            className={cn('h-full rounded-full transition-colors duration-500', strengthBarColor(passedCount, allPassed))}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Requirements grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {validation.map((req, i) => (
          <motion.div
            key={req.key}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: i * 0.03 }}
            className={cn(
              'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] transition-all duration-200',
              req.passed
                ? 'bg-emerald-500/8 text-emerald-400'
                : 'bg-white/3 text-white/30'
            )}
          >
            <AnimatePresence mode="wait">
              {req.passed ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Check className="h-3 w-3 shrink-0 text-emerald-400" />
                </motion.span>
              ) : (
                <motion.span key="minus" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Minus className="h-3 w-3 shrink-0 text-white/20" />
                </motion.span>
              )}
            </AnimatePresence>
            <span className="leading-tight">{req.label}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export function usePasswordValidation(password: string) {
  return useMemo(() => {
    const results = passwordRequirements.map((req) => ({
      key: req.key,
      passed: req.validator(password),
    }));
    const allPassed = results.every((r) => r.passed) && password.length > 0;
    return { results, allPassed };
  }, [password]);
}
