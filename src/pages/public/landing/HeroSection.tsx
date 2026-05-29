import { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, GitBranch } from 'lucide-react';
import { EthosOwlMascot } from '@/components/brand/EthosCoreLogo';
import { AmbientBackground, GradientText, PulseDot } from '@/shared/landing';
import { easeOut, springConfig, fadeUp } from '@/shared/motion';

const HERO_LINES: { words: { text: string; gradient?: boolean }[] }[] = [
  { words: [{ text: 'Tu' }, { text: 'código.' }] },
  { words: [{ text: 'Tu' }, { text: 'identidad.' }] },
  { words: [{ text: 'Tu' }, { text: 'plataforma.', gradient: true }] },
];

const CODE_SYMBOLS = [
  { text: '{ }',  top: '14%',   right: '8%',  delay: 0.9  },
  { text: '</>',  top: '60%',   right: '1%',  delay: 1.15 },
  { text: '[ ]',  top: '5%',    right: '38%', delay: 1.35 },
  { text: '=>',   bottom: '24%', right: '18%', delay: 1.05 },
  { text: '#!',   top: '38%',   right: '50%', delay: 1.55 },
];

function FloatingNotification() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 2.2, ease: easeOut }}
      className="absolute -bottom-6 -left-8 z-10 hidden sm:block"
    >
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        className="flex items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-black/80 px-3.5 py-2.5 shadow-xl backdrop-blur-md"
        style={{ boxShadow: '0 0 32px rgba(124,58,237,0.14), 0 4px 24px rgba(0,0,0,0.6)' }}
      >
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500/15">
          <GitBranch className="h-3.5 w-3.5 text-violet-400" />
        </div>
        <div>
          <p className="text-[11px] font-semibold leading-none text-white/80">Reclutador vio tu perfil</p>
          <p className="mt-0.5 text-[10px] text-white/35">Acme Corp · hace 2 min</p>
        </div>
        <PulseDot className="ml-1" />
      </motion.div>
    </motion.div>
  );
}

export function HeroSection() {
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const spring = springConfig;
  const pX = useSpring(useTransform(mouseX, [0, 1], [-22, 22]), spring);
  const pY = useSpring(useTransform(mouseY, [0, 1], [-14, 14]), spring);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth);
      mouseY.set(e.clientY / window.innerHeight);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [mouseX, mouseY]);

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-black pb-16 pt-20 sm:pt-24">
      <AmbientBackground variant="hero" showBottomFade />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-[1.3fr_0.7fr] lg:gap-8">

          {/* Text column */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">

            <motion.div {...fadeUp(0, 0.5)}>
              <span className="inline-flex items-center gap-2.5 rounded-full border border-violet-500/20 bg-violet-500/6 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400 shadow-[0_0_8px_rgba(168,85,247,0.9)]" />
                Plataforma developer
              </span>
            </motion.div>

            <div className="mt-8 space-y-1">
              {HERO_LINES.map((line, li) => (
                <div key={li} className="flex flex-wrap items-baseline justify-center gap-x-[0.28em] lg:justify-start">
                  {line.words.map((word, wi) => {
                    const delay = 0.06 + li * 0.18 + wi * 0.1;
                    return (
                      <div key={wi} className="overflow-hidden leading-none">
                        <motion.span
                          initial={{ y: '110%', opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ duration: 0.78, delay, ease: easeOut }}
                          className="block text-[clamp(2.2rem,5vw,4.2rem)] font-black leading-[1.06] tracking-tight text-white"
                        >
                          {word.gradient ? <GradientText>{word.text}</GradientText> : word.text}
                        </motion.span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.72, ease: easeOut }}
              style={{ originX: 0 }}
              className="mt-7 h-px w-24 bg-gradient-to-r from-violet-500/60 to-transparent lg:self-start"
            />

            <motion.p {...fadeUp(0.76, 0.65)} className="mt-6 max-w-lg text-[1.0625rem] leading-[1.85] text-white/42">
              Construye un portafolio que habla por ti. Conecta con oportunidades. Deja que tu trabajo cuente tu historia.
            </motion.p>

            <motion.div {...fadeUp(0.92, 0.6)} className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <div className="relative">
                <motion.div
                  className="pointer-events-none absolute -inset-[3px] rounded-[14px] blur-sm"
                  style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.7), rgba(168,85,247,0.7), rgba(124,58,237,0.7))' }}
                  animate={{ opacity: [0.45, 0.85, 0.45], scale: [0.97, 1.03, 0.97] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                />
                <Link to="/register">
                  <motion.button
                    whileHover={{ scale: 1.04, boxShadow: '0 0 64px rgba(168,85,247,0.55), 0 0 24px rgba(124,58,237,0.35)' }}
                    whileTap={{ scale: 0.97 }}
                    className="group relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-violet-500/30 transition-all"
                  >
                    Crear mi portafolio
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </motion.button>
                </Link>
              </div>

              <Link to="/explorar">
                <motion.button
                  whileHover={{ scale: 1.02, borderColor: 'rgba(168,85,247,0.25)' }}
                  whileTap={{ scale: 0.97 }}
                  className="rounded-xl border border-white/12 bg-white/[0.03] px-8 py-4 text-sm font-medium text-white/60 backdrop-blur transition-all hover:bg-white/[0.06] hover:text-white"
                >
                  Explorar talento
                </motion.button>
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.8 }}
              className="mt-5 text-[11px] text-white/18 lg:self-start"
            >
              Sin tarjeta de crédito · Gratis para siempre
            </motion.p>
          </div>

          {/* Mascot column */}
          <div className="relative flex items-center justify-center">
            <div
              className="pointer-events-none absolute h-72 w-72 rounded-full sm:h-[420px] sm:w-[420px]"
              style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 65%)' }}
            />

            {CODE_SYMBOLS.map((sym, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: sym.delay, ease: easeOut }}
                className="absolute hidden h-8 w-10 items-center justify-center rounded-xl border border-violet-500/15 bg-black/70 font-mono text-[10px] font-medium text-violet-400/60 backdrop-blur-sm sm:flex"
                style={{ top: sym.top, bottom: (sym as { bottom?: string }).bottom, right: sym.right }}
              >
                {sym.text}
              </motion.div>
            ))}

            <motion.div className="relative" style={{ x: pX, y: pY }}>
              <div className="pointer-events-none absolute inset-0 rounded-full" style={{ margin: '-22%', border: '1px solid rgba(168,85,247,0.1)' }} />
              <div className="pointer-events-none absolute inset-0 rounded-full" style={{ margin: '-44%', border: '1px solid rgba(168,85,247,0.055)' }} />
              <div className="pointer-events-none absolute inset-0 rounded-full" style={{ margin: '-66%', border: '1px solid rgba(168,85,247,0.025)' }} />

              <FloatingNotification />
              <EthosOwlMascot size={220} floating />
            </motion.div>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.6, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        aria-hidden
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-2"
        >
          <div className="h-10 w-px bg-gradient-to-b from-white/20 to-transparent" />
          <span className="text-[9px] uppercase tracking-[0.3em] text-white/18">scroll</span>
        </motion.div>
      </motion.div>
    </section>
  );
}
