import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Key,
  Mail,
  ChevronDown,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Card, Button } from '@/shared/ui';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';

type SecuritySection = 'password' | 'email' | null;

export function AccountSecurityCard() {
  const [expandedSection, setExpandedSection] = useState<SecuritySection>(null);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordOtp, setPasswordOtp] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordOtpSent, setPasswordOtpSent] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  
  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  const toggleSection = (section: SecuritySection) => {
    if (expandedSection === section) {
      setExpandedSection(null);
      resetPasswordForm();
      resetEmailForm();
    } else {
      setExpandedSection(section);
      if (section === 'password') resetEmailForm();
      if (section === 'email') resetPasswordForm();
    }
  };

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordOtp('');
    setPasswordOtpSent(false);
    setPasswordSuccess(false);
  };

  const resetEmailForm = () => {
    setNewEmail('');
    setEmailOtp('');
    setEmailOtpSent(false);
    setEmailSuccess(false);
  };

  const handleSendPasswordOtp = async () => {
    setPasswordLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setPasswordOtpSent(true);
    setPasswordLoading(false);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) return;
    if (passwordOtp.length !== 6) return;
    
    setPasswordLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setPasswordLoading(false);
    setPasswordSuccess(true);
    
    // Reset and close after success
    setTimeout(() => {
      setExpandedSection(null);
      resetPasswordForm();
    }, 2000);
  };

  const handleSendEmailOtp = async () => {
    if (!newEmail) return;
    
    setEmailLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setEmailOtpSent(true);
    setEmailLoading(false);
  };

  const handleChangeEmail = async () => {
    if (emailOtp.length !== 6) return;
    
    setEmailLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setEmailLoading(false);
    setEmailSuccess(true);
    
    // Reset and close after success
    setTimeout(() => {
      setExpandedSection(null);
      resetEmailForm();
    }, 2000);
  };

  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  return (
    <Card className="w-full border-gray-200 bg-white p-0 sm:p-0 dark:border-white/10 dark:bg-zinc-950">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 sm:p-6 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 sm:h-11 sm:w-11 sm:rounded-2xl dark:bg-red-500/10 dark:text-red-400">
            <Shield className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-black sm:text-xl dark:text-white">Seguridad de la Cuenta</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gestiona tu contrasena y correo electronico
            </p>
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="border-b border-gray-200 dark:border-white/10">
        <button
          type="button"
          onClick={() => toggleSection('password')}
          className="flex w-full items-center justify-between gap-2 p-4 text-left transition-colors hover:bg-gray-50 sm:p-6 dark:hover:bg-white/5"
        >
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 sm:h-10 sm:w-10 dark:bg-violet-500/10 dark:text-violet-400">
              <Key className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-black sm:text-base dark:text-white">Cambiar Contrasena</p>
              <p className="truncate text-xs text-gray-500 sm:text-sm dark:text-gray-400">
                Actualiza tu contrasena de acceso
              </p>
            </div>
          </div>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-300 dark:text-gray-500 ${
              expandedSection === 'password' ? 'rotate-180' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {expandedSection === 'password' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-5 border-t border-gray-200 bg-gray-50 p-5 sm:p-6 dark:border-white/10 dark:bg-black/30">
                {passwordSuccess ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center gap-3 py-6 text-center"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                      <CheckCircle2 className="h-7 w-7" />
                    </div>
                    <p className="text-lg font-medium text-black dark:text-white">
                      Contrasena actualizada
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Tu contrasena ha sido cambiada exitosamente.
                    </p>
                  </motion.div>
                ) : !passwordOtpSent ? (
                  <>
                    {/* Step 1: Request OTP */}
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-black/50">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-violet-600 dark:text-violet-400" />
                        <div>
                          <p className="text-sm font-medium text-black dark:text-white">
                            Verificacion requerida
                          </p>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Por seguridad, enviaremos un codigo de 6 digitos a tu correo electronico
                            para confirmar tu identidad.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => toggleSection(null)}
                        className="border-gray-200 bg-white text-black hover:bg-gray-50 dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSendPasswordOtp}
                        disabled={passwordLoading}
                        className="bg-violet-600 text-white hover:bg-violet-700"
                      >
                        {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar Codigo'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Step 2: Enter OTP and new password */}
                    <div className="space-y-4">
                      {/* OTP Input */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-black dark:text-white">
                          Codigo de verificacion
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Ingresa el codigo de 6 digitos enviado a tu correo
                        </p>
                        <div className="flex justify-center overflow-x-auto py-2">
                          <div className="scale-90 sm:scale-100">
                            <InputOTP
                              maxLength={6}
                              value={passwordOtp}
                              onChange={setPasswordOtp}
                            >
                              <InputOTPGroup>
                                <InputOTPSlot index={0} className="border-gray-200 dark:border-white/20 dark:bg-black" />
                                <InputOTPSlot index={1} className="border-gray-200 dark:border-white/20 dark:bg-black" />
                                <InputOTPSlot index={2} className="border-gray-200 dark:border-white/20 dark:bg-black" />
                              </InputOTPGroup>
                              <InputOTPSeparator />
                              <InputOTPGroup>
                                <InputOTPSlot index={3} className="border-gray-200 dark:border-white/20 dark:bg-black" />
                                <InputOTPSlot index={4} className="border-gray-200 dark:border-white/20 dark:bg-black" />
                                <InputOTPSlot index={5} className="border-gray-200 dark:border-white/20 dark:bg-black" />
                              </InputOTPGroup>
                            </InputOTP>
                          </div>
                        </div>
                      </div>

                      {/* Current Password */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-black dark:text-white">
                          Contrasena Actual
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Ingresa tu contrasena actual"
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 text-black placeholder:text-gray-400 transition-colors focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-white/20 dark:bg-black dark:text-white dark:placeholder:text-gray-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:text-gray-500 dark:hover:text-white"
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* New Password */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-black dark:text-white">
                          Nueva Contrasena
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Ingresa tu nueva contrasena"
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 text-black placeholder:text-gray-400 transition-colors focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-white/20 dark:bg-black dark:text-white dark:placeholder:text-gray-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:text-gray-500 dark:hover:text-white"
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {newPassword && (
                          <PasswordStrengthIndicator password={newPassword} />
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-black dark:text-white">
                          Confirmar Nueva Contrasena
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirma tu nueva contrasena"
                            className={`w-full rounded-xl border bg-white px-4 py-3 pr-12 text-black placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-1 dark:bg-black dark:text-white dark:placeholder:text-gray-500 ${
                              confirmPassword && !passwordsMatch
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                : confirmPassword && passwordsMatch
                                  ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20'
                                  : 'border-gray-200 focus:border-violet-500 focus:ring-violet-500/20 dark:border-white/20'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:text-gray-500 dark:hover:text-white"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {confirmPassword && !passwordsMatch && (
                          <p className="text-xs text-red-600 dark:text-red-400">
                            Las contrasenas no coinciden
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => toggleSection(null)}
                        className="border-gray-200 bg-white text-black hover:bg-gray-50 dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleChangePassword}
                        disabled={
                          passwordLoading ||
                          !currentPassword ||
                          !newPassword ||
                          !confirmPassword ||
                          !passwordsMatch ||
                          passwordOtp.length !== 6
                        }
                        className="bg-violet-600 text-white hover:bg-violet-700"
                      >
                        {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar Cambios'}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Change Email Section */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection('email')}
          className="flex w-full items-center justify-between gap-2 p-4 text-left transition-colors hover:bg-gray-50 sm:p-6 dark:hover:bg-white/5"
        >
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600 sm:h-10 sm:w-10 dark:bg-cyan-500/10 dark:text-cyan-400">
              <Mail className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-black sm:text-base dark:text-white">Cambiar Correo Electronico</p>
              <p className="truncate text-xs text-gray-500 sm:text-sm dark:text-gray-400">
                Actualiza tu direccion de email
              </p>
            </div>
          </div>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-300 dark:text-gray-500 ${
              expandedSection === 'email' ? 'rotate-180' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {expandedSection === 'email' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-5 border-t border-gray-200 bg-gray-50 p-5 sm:p-6 dark:border-white/10 dark:bg-black/30">
                {emailSuccess ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center gap-3 py-6 text-center"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                      <CheckCircle2 className="h-7 w-7" />
                    </div>
                    <p className="text-lg font-medium text-black dark:text-white">
                      Correo actualizado
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Tu direccion de correo ha sido cambiada exitosamente.
                    </p>
                  </motion.div>
                ) : !emailOtpSent ? (
                  <>
                    {/* Step 1: Enter new email */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-black dark:text-white">
                        Nuevo Correo Electronico
                      </label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="nuevo@email.com"
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-black placeholder:text-gray-400 transition-colors focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-white/20 dark:bg-black dark:text-white dark:placeholder:text-gray-500"
                      />
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-black/50">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-violet-600 dark:text-violet-400" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Enviaremos un codigo de verificacion a tu correo actual para
                          confirmar este cambio.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => toggleSection(null)}
                        className="border-gray-200 bg-white text-black hover:bg-gray-50 dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSendEmailOtp}
                        disabled={!newEmail || emailLoading}
                        className="bg-violet-600 text-white hover:bg-violet-700"
                      >
                        {emailLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar Codigo'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Step 2: Verify with OTP */}
                    <div className="space-y-4">
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/5">
                        <p className="text-sm text-emerald-800 dark:text-emerald-300">
                          Codigo enviado a tu correo actual. Ingresa el codigo de
                          6 digitos para confirmar el cambio.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-black dark:text-white">
                          Codigo de verificacion
                        </label>
                        <div className="flex justify-center overflow-x-auto py-2">
                          <div className="scale-90 sm:scale-100">
                            <InputOTP
                              maxLength={6}
                              value={emailOtp}
                              onChange={setEmailOtp}
                            >
                              <InputOTPGroup>
                                <InputOTPSlot index={0} className="border-gray-200 dark:border-white/20 dark:bg-black" />
                                <InputOTPSlot index={1} className="border-gray-200 dark:border-white/20 dark:bg-black" />
                                <InputOTPSlot index={2} className="border-gray-200 dark:border-white/20 dark:bg-black" />
                              </InputOTPGroup>
                              <InputOTPSeparator />
                              <InputOTPGroup>
                                <InputOTPSlot index={3} className="border-gray-200 dark:border-white/20 dark:bg-black" />
                                <InputOTPSlot index={4} className="border-gray-200 dark:border-white/20 dark:bg-black" />
                                <InputOTPSlot index={5} className="border-gray-200 dark:border-white/20 dark:bg-black" />
                              </InputOTPGroup>
                            </InputOTP>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-black/50">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-medium text-black dark:text-white">
                            Nuevo correo:
                          </span>{' '}
                          {newEmail}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => toggleSection(null)}
                        className="border-gray-200 bg-white text-black hover:bg-gray-50 dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleChangeEmail}
                        disabled={emailOtp.length !== 6 || emailLoading}
                        className="bg-violet-600 text-white hover:bg-violet-700"
                      >
                        {emailLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verificar y Guardar'}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
