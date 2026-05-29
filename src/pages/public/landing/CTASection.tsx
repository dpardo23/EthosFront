import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { EthosOwlMascot } from '@/components/brand/EthosCoreLogo';
import { AmbientBackground, GradientText } from '@/shared/landing';
import { easeOut, fadeUpView, slideUpView, fadeView } from '@/shared/motion';

export function CTASection() {
  return (
    <section className="relative overflow-hidden bg-black py-32 sm:py-48">
      <AmbientBackground variant="cta" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">

          {/* Mascot with rings */}
          <motion.div
            initial={{ opacity: 0, scale: 0.75 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: easeOut }}
            className="relative mb-14"
            style={{ width: 240, height: 240 }}
          >
            <div
              className="animate-pulse-glow absolute inset-0 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 65%)' }}
            />

            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full"
              style={{ margin: '-8%', border: '1px dashed rgba(168,85,247,0.18)' }}
            />

            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full"
              style={{ margin: '-20%', border: '1px dashed rgba(168,85,247,0.1)' }}
            />

            <div
              className="absolute inset-0 rounded-full"
              style={{ margin: '-34%', border: '1px solid rgba(168,85,247,0.045)' }}
            />

            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full"
              style={{ margin: '-8%' }}
            >
              <div
                className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-violet-400"
                style={{ boxShadow: '0 0 12px rgba(168,85,247,0.9)' }}
              />
            </motion.div>

            <div className="absolute inset-0 flex items-center justify-center">
              <EthosOwlMascot size={140} floating />
            </div>
          </motion.div>

          <motion.div {...fadeUpView(0.15)}>
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/22 bg-violet-500/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
              <Sparkles className="h-3 w-3" />
              Empieza hoy. Es gratuito.
            </span>
          </motion.div>

          <div className="mt-7 space-y-0.5">
            {['Construye tu universo', 'profesional.'].map((line, i) => (
              <div key={i} className="overflow-hidden">
                <motion.p
                  {...slideUpView(0.22 + i * 0.12)}
                  className={`text-[clamp(2rem,5.5vw,3.8rem)] font-black leading-[1.05] tracking-tight ${
                    i === 1 ? '' : 'text-white'
                  }`}
                >
                  {i === 1 ? <GradientText>{line}</GradientText> : line}
                </motion.p>
              </div>
            ))}
          </div>

          <motion.p {...fadeUpView(0.38, 0.65)} className="mt-7 max-w-md text-base leading-8 text-white/38">
            Un portafolio que evoluciona contigo. Conectado a tus herramientas, listo para ser descubierto.
          </motion.p>

          <motion.div {...fadeUpView(0.46, 0.6)} className="mt-11 flex flex-col items-center gap-4 sm:flex-row">
            <Link to="/register">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 0 52px rgba(168,85,247,0.42)' }}
                whileTap={{ scale: 0.96 }}
                className="group flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-violet-500/25 transition-all"
              >
                Crear mi portafolio gratis
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </motion.button>
            </Link>
            <Link to="/explorar">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-8 py-3.5 text-sm font-medium text-white/60 backdrop-blur transition-all hover:border-white/18 hover:bg-white/[0.06] hover:text-white"
              >
                Ver portafolios reales
              </motion.button>
            </Link>
          </motion.div>

          <motion.p {...fadeView(0.6)} className="mt-6 text-xs text-white/20">
            Sin tarjeta de crédito · Configuración en minutos · Cancela cuando quieras
          </motion.p>
        </div>
      </div>
    </section>
  );
}
