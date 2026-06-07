import { useState } from 'react';
import { useNavigate, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, RotateCcw, UserRound, ChevronDown } from 'lucide-react';
import { Button } from '@/shared/ui';

/**
 * Error boundary for route-level errors: renders a fallback UI and logs the caught error.
 */
const SPRING = { type: 'spring' as const, stiffness: 360, damping: 30 };

function describeError(error: unknown): { title: string; detail: string } {
  if (isRouteErrorResponse(error)) {
    return {
      title: `Error ${error.status}`,
      detail: error.statusText || 'La ruta solicitada no pudo cargarse.',
    };
  }
  if (error instanceof Error) {
    return { title: error.name || 'Error', detail: error.message };
  }
  return { title: 'Error desconocido', detail: String(error ?? 'Sin detalles disponibles.') };
}

export default function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  const [showDetail, setShowDetail] = useState(false);
  const { title, detail } = describeError(error);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={SPRING}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card px-7 py-9 text-center shadow-2xl"
      >
        {}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,_hsl(var(--primary)/0.14)_0%,_transparent_100%)]" />

        <div className="relative flex flex-col items-center">
          {}
          <div className="relative mb-6 flex h-16 w-16 items-center justify-center">
            <motion.span
              className="absolute inset-0 rounded-2xl bg-destructive/15"
              animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0.25, 0.6] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-destructive/25 bg-destructive/10">
              <AlertTriangle className="h-7 w-7 text-destructive" strokeWidth={2} />
            </div>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Algo salió mal
          </h1>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Encontramos un problema al mostrar esta sección. Tu información está
            a salvo: puedes recargar o volver a tu perfil para continuar.
          </p>

          {}
          <div className="mt-7 flex w-full flex-col gap-2.5 sm:flex-row">
            <Button
              variant="primary"
              onClick={() => window.location.reload()}
              className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <RotateCcw className="h-4 w-4" />
              Recargar
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/portfolio')}
              className="flex-1 gap-2"
            >
              <UserRound className="h-4 w-4" />
              Volver al perfil
            </Button>
          </div>

          {}
          <button
            type="button"
            onClick={() => setShowDetail(v => !v)}
            className="mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground/70 transition-colors hover:text-muted-foreground"
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${showDetail ? 'rotate-180' : ''}`}
            />
            {showDetail ? 'Ocultar detalle técnico' : 'Ver detalle técnico'}
          </button>

          <motion.div
            initial={false}
            animate={{ height: showDetail ? 'auto' : 0, opacity: showDetail ? 1 : 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="w-full overflow-hidden"
          >
            <div className="mt-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {title}
              </p>
              <p className="mt-1 break-words font-mono text-xs leading-relaxed text-foreground/80">
                {detail}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
