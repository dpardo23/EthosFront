import { motion, AnimatePresence } from 'framer-motion';
import { X, ScrollText } from 'lucide-react';
import { Button } from '@/shared/ui';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsModal({ isOpen, onClose }: TermsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ScrollText className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Términos y Condiciones
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    EthosHub - Plataforma Profesional
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                aria-label="Cerrar modal"
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground">
                <h3>1. Aceptación de los Términos</h3>
                <p>
                  Al acceder y utilizar EthosHub, aceptas cumplir con estos
                  Términos y Condiciones. Si no estás de acuerdo con alguna parte
                  de estos términos, no podrás acceder al servicio.
                </p>

                <h3>2. Descripción del Servicio</h3>
                <p>
                  EthosHub es una plataforma profesional diseñada para que los
                  profesionales del sector tecnológico puedan crear y compartir
                  sus portafolios digitales, conectar con otros profesionales y
                  mostrar sus habilidades y proyectos.
                </p>

                <h3>3. Registro de Cuenta</h3>
                <p>
                  Para utilizar ciertas funciones de EthosHub, debes registrar
                  una cuenta. Al hacerlo, garantizas que la información
                  proporcionada es precisa, completa y actualizada. Eres
                  responsable de mantener la confidencialidad de tu contraseña y
                  cuenta.
                </p>

                <h3>4. Uso Aceptable</h3>
                <p>Te comprometes a:</p>
                <ul>
                  <li>
                    No utilizar el servicio para fines ilegales o no autorizados.
                  </li>
                  <li>
                    No publicar contenido ofensivo, difamatorio o que infrinja
                    derechos de terceros.
                  </li>
                  <li>
                    No intentar acceder a cuentas de otros usuarios sin
                    autorización.
                  </li>
                  <li>
                    No interferir con el funcionamiento normal de la plataforma.
                  </li>
                </ul>

                <h3>5. Propiedad Intelectual</h3>
                <p>
                  Todo el contenido que publiques en EthosHub seguirá siendo de
                  tu propiedad. Sin embargo, al publicarlo, nos otorgas una
                  licencia no exclusiva para mostrar, distribuir y promocionar
                  dicho contenido dentro de la plataforma.
                </p>

                <h3>6. Privacidad</h3>
                <p>
                  Tu privacidad es importante para nosotros. Consulta nuestra
                  Política de Privacidad para entender cómo recopilamos,
                  utilizamos y protegemos tu información personal.
                </p>

                <h3>7. Modificaciones del Servicio</h3>
                <p>
                  Nos reservamos el derecho de modificar o discontinuar el
                  servicio en cualquier momento, con o sin previo aviso. No
                  seremos responsables ante ti ni ante terceros por cualquier
                  modificación, suspensión o discontinuación del servicio.
                </p>

                <h3>8. Limitación de Responsabilidad</h3>
                <p>
                  EthosHub se proporciona &quot;tal cual&quot; y sin garantías de
                  ningún tipo. No garantizamos que el servicio sea
                  ininterrumpido, seguro o libre de errores.
                </p>

                <h3>9. Terminación</h3>
                <p>
                  Podemos suspender o terminar tu acceso al servicio en cualquier
                  momento por cualquier motivo, incluyendo el incumplimiento de
                  estos términos.
                </p>

                <h3>10. Ley Aplicable</h3>
                <p>
                  Estos términos se regirán e interpretarán de acuerdo con las
                  leyes aplicables, sin tener en cuenta sus disposiciones sobre
                  conflictos de leyes.
                </p>

                <h3>11. Contacto</h3>
                <p>
                  Si tienes preguntas sobre estos Términos y Condiciones, puedes
                  contactarnos a través de los canales oficiales de EthosHub.
                </p>

                <div className="mt-6 rounded-2xl border border-border bg-muted/50 p-4">
                  <p className="m-0 text-sm text-foreground">
                    <strong>Última actualización:</strong> 2026
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border px-6 py-4">
              <Button
                onClick={onClose}
                className="w-full rounded-xl"
              >
                Entendido
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}