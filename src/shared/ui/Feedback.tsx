import { createElement, isValidElement, type ReactNode, type ElementType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './Button';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
}

// ─── LoadingSpinner ───────────────────────────────────────────────────────────

const SPINNER_SIZES = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };

export function LoadingSpinner({ size = 'md', className }: { size?: keyof typeof SPINNER_SIZES; className?: string }) {
  return <Loader2 className={cn('animate-spin text-primary', SPINNER_SIZES[size], className)} />;
}

// ─── Progress ─────────────────────────────────────────────────────────────────

const PROGRESS_SIZES = { sm: 'h-2', md: 'h-3', lg: 'h-4' };

export function Progress({ value, size = 'md', className }: { value: number; size?: keyof typeof PROGRESS_SIZES; className?: string }) {
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-muted', PROGRESS_SIZES[size], className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: ReactNode | ElementType;
  title: string;
  description?: string;
  action?: ReactNode | { label: string; onClick?: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const iconNode = !icon
    ? null
    : isValidElement(icon)
    ? icon
    : typeof icon === 'function' || typeof icon === 'object'
    ? createElement(icon as ElementType, { className: 'h-10 w-10' })
    : null;

  const actionNode = action && typeof action === 'object' && 'label' in action
    ? <Button onClick={action.onClick}>{action.label}</Button>
    : action;

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {iconNode && <div className="mb-4 text-muted-foreground">{iconNode}</div>}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      {actionNode && <div className="mt-4">{actionNode as ReactNode}</div>}
    </div>
  );
}

// ─── ErrorState ───────────────────────────────────────────────────────────────

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Error', message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      {onRetry && <Button onClick={onRetry} variant="outline" className="mt-4">Reintentar</Button>}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

const TOAST_ICONS = {
  success: <CheckCircle  className="h-5 w-5 text-success"     />,
  error:   <AlertCircle  className="h-5 w-5 text-destructive" />,
  warning: <AlertTriangle className="h-5 w-5 text-warning"   />,
  info:    <Info          className="h-5 w-5 text-primary"    />,
};

interface ToastProps {
  type: keyof typeof TOAST_ICONS;
  title: string;
  message?: string;
  onClose: () => void;
}

export function Toast({ type, title, message, onClose }: ToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="flex w-full max-w-sm items-start gap-3 rounded-lg border border-border bg-card/95 backdrop-blur-xl p-4 shadow-lg"
    >
      {TOAST_ICONS[type]}
      <div className="flex-1">
        <p className="font-medium text-card-foreground">{title}</p>
        {message && <p className="mt-1 text-sm text-muted-foreground">{message}</p>}
      </div>
      <button onClick={onClose} className="rounded p-1 hover:bg-accent" aria-label="Cerrar">
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

const MODAL_SIZES = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl' };

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: keyof typeof MODAL_SIZES;
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn('w-full rounded-xl bg-card p-6 shadow-lg', MODAL_SIZES[size])}
            >
              {title && (
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
                  <button onClick={onClose} className="rounded-lg p-1 hover:bg-accent" aria-label="Cerrar">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── ConfirmDialog ────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  loading?: boolean;
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', variant = 'default', loading }: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-muted-foreground">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
        <Button variant={variant === 'destructive' ? 'destructive' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
