import { useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EthosCoreLogo, EthosOwlMascot } from '@/components/brand/EthosCoreLogo';

const FLOAT_TAGS = [
  { label: '< />', x: '12%', y: '22%', delay: 0 },
  { label: '{ }',  x: '78%', y: '18%', delay: 0.4 },
  { label: '→',    x: '8%',  y: '68%', delay: 0.7 },
  { label: '#!',   x: '82%', y: '72%', delay: 0.2 },
  { label: '/**',  x: '55%', y: '12%', delay: 0.9 },
];

function VisualPanel() {
  return (
    <div className="relative hidden w-[46%] shrink-0 flex-col overflow-hidden bg-black lg:flex">
      {}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 48%, rgba(124,58,237,0.18) 0%, transparent 68%)',
        }}
      />
      <div
        className="animate-blob pointer-events-none absolute left-[-10%] top-[15%] h-[480px] w-[480px] rounded-full opacity-[0.09]"
        style={{ background: 'radial-gradient(circle, #7C3AED, transparent 70%)' }}
      />
      <div
        className="animate-blob pointer-events-none absolute -right-20 bottom-[10%] h-[400px] w-[400px] rounded-full opacity-[0.07]"
        style={{
          background: 'radial-gradient(circle, #A855F7, transparent 70%)',
          animationDelay: '-5s',
        }}
      />
      {}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      {}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/8 to-transparent" />

      {}
      <div className="absolute left-8 top-8 z-10">
        <Link to="/">
          <EthosCoreLogo size="sm" />
        </Link>
      </div>

      {}
      {FLOAT_TAGS.map(({ label, x, y, delay }) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none absolute flex items-center justify-center rounded-xl border border-violet-500/12 bg-violet-500/5 px-3 py-1.5 font-mono text-[11px] text-violet-400/50"
          style={{ left: x, top: y }}
        >
          {label}
        </motion.div>
      ))}

      {}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-10">
        {}
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-10"
        >
          <div
            className="pointer-events-none absolute inset-[-30%] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 65%)',
            }}
          />
          <EthosOwlMascot size={160} floating />
        </motion.div>

        {}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-violet-400/70">
            Plataforma profesional
          </p>
          <h2 className="text-[clamp(1.6rem,2.8vw,2.4rem)] font-black leading-tight tracking-tight text-white">
            Tu identidad
            <br />
            <span className="gradient-text-animated">en código.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xs text-sm leading-7 text-white/38">
            El portafolio que evoluciona contigo. Conectado a tus herramientas, listo para ser descubierto.
          </p>
        </motion.div>

        {}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10 h-px w-24 bg-gradient-to-r from-transparent via-violet-500/30 to-transparent"
        />

        {}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.65 }}
          className="mt-6 max-w-[260px] text-center text-xs leading-6 text-white/22"
        >
          Construido para desarrolladores que quieren que su trabajo hable por sí mismo.
        </motion.p>
      </div>

      {}
      <div className="relative z-10 flex justify-center gap-1.5 pb-10">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`rounded-full transition-all ${i === 0 ? 'h-1.5 w-4 bg-violet-500/60' : 'h-1.5 w-1.5 bg-white/15'}`}
          />
        ))}
      </div>
    </div>
  );
}

export function AuthLayout() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="flex min-h-screen bg-black">
      <VisualPanel />

      {}
      <div className="relative flex flex-1 flex-col overflow-y-auto">
        {}
        <div className="flex shrink-0 items-center justify-center pt-8 lg:hidden">
          <Link to="/">
            <EthosCoreLogo size="md" />
          </Link>
        </div>

        {}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.012]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 60% 20%, rgba(168,85,247,1) 0%, transparent 50%)',
          }}
        />

        <div className="relative z-10 flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-[420px]">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
