import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Code2, Briefcase } from 'lucide-react';
import { SectionLabel, SectionDivider, GlowCard, PulseDot } from '@/shared/landing';
import { easeOut, fadeUpView, slideUpView } from '@/shared/motion';

/**
 * Landing section showcasing the recruiter talent discovery feature.
 */
const DEV_POINTS = [
  { title: 'Un link, toda tu carrera',  desc: 'Tu stack real, proyectos y actividad en un solo lugar profesional.' },
  { title: 'Credibilidad verificada',   desc: 'GitHub conectado. Commits reales. No keywords vacíos.' },
  { title: 'Visible 24/7',              desc: 'Tu perfil trabaja incluso cuando no estás buscando activamente.' },
];

const RECRUITER_POINTS = [
  { title: 'Búsqueda por stack real',   desc: 'Filtra por tecnologías, experiencia y proyectos verificados.' },
  { title: 'Perfiles verificados',       desc: 'Accede a portafolios con actividad GitHub real, no solo CVs.' },
  { title: 'Descubrimiento inteligente', desc: 'Encuentra el talento ideal sin filtros vacíos ni spam.' },
];

function DevVisual() {
  return (
    <div className="space-y-2">
      {[
        { label: 'github.com/alex-r',        value: '342 commits este año' },
        { label: 'TypeScript · Go · React',  value: 'Stack verificado'     },
        { label: 'ethoshub.com/p/alex-r',    value: '1.2k visitas / mes'   },
      ].map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 + i * 0.12 }}
          className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3"
        >
          <span className="font-mono text-[11px] text-white/38">{item.label}</span>
          <span className="text-[11px] font-medium text-violet-400/70">{item.value}</span>
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.72 }}
        className="mt-3 rounded-xl border border-violet-500/18 bg-gradient-to-r from-violet-500/8 to-transparent p-4"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500/15">
            <Code2 className="h-4 w-4 text-violet-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-white/75">Nuevo mensaje de reclutador</p>
            <p className="text-[11px] text-white/35">Acme Corp · Frontend Lead · Senior</p>
          </div>
          <PulseDot />
        </div>
      </motion.div>
    </div>
  );
}

function RecruiterVisual() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#06060E]">
      <div className="border-b border-white/[0.05] p-4">
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
          <span className="text-[11px] text-white/28">React · 5+ años · Remote</span>
          <span className="ml-auto rounded-md bg-violet-500/10 px-2 py-0.5 text-[9px] text-violet-400">47 resultados</span>
        </div>
      </div>

      <div className="divide-y divide-white/[0.03]">
        {[
          { init: 'AR', name: 'Alex R.',   title: 'Senior Frontend Eng.', match: '98%', open: true  },
          { init: 'SM', name: 'Sara M.',   title: 'Fullstack Developer',   match: '94%', open: false },
          { init: 'ML', name: 'Marcos L.', title: 'React Engineer',        match: '91%', open: true  },
        ].map((profile, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
            className="flex items-center gap-3 px-4 py-3"
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/25 to-purple-900/40 text-[10px] font-bold text-violet-300/70">
              {profile.init}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-white/62">{profile.name}</p>
              <p className="text-[9px] text-white/25">{profile.title}</p>
            </div>
            {profile.open && (
              <span className="rounded-full border border-green-500/20 bg-green-500/8 px-2 py-0.5 text-[9px] text-green-400/80">Open</span>
            )}
            <span className="text-[11px] font-semibold text-violet-400/75">{profile.match}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function DiscoveryPanel({
  icon: Icon,
  label,
  heading,
  subtext,
  points,
  visual,
  cta,
  glowOrigin,
}: {
  icon: React.ElementType;
  label: string;
  heading: string;
  subtext: string;
  points: { title: string; desc: string }[];
  visual: React.ReactNode;
  cta: { label: string; to: string };
  glowOrigin: 'top-left' | 'top-right';
}) {
  return (
    <GlowCard glowOrigin={glowOrigin} className="flex h-full flex-col p-7 sm:p-8 lg:p-10">
      <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/8">
        <Icon className="h-5 w-5 text-violet-400" />
      </div>

      <SectionLabel className="mb-2 tracking-[0.22em] text-violet-400/70">{label}</SectionLabel>

      <div className="overflow-hidden">
        <motion.h3 {...slideUpView(0.15, 0.7)} className="text-[clamp(2rem,4vw,3rem)] font-black leading-[1.08] tracking-tight text-white">
          {heading}
        </motion.h3>
      </div>

      <p className="mt-4 max-w-sm text-[0.9375rem] leading-[1.85] text-white/38">{subtext}</p>

      <div className="mt-8 space-y-4">
        {points.map((pt, i) => (
          <motion.div
            key={pt.title}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
            className="flex gap-3"
          >
            <div className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(168,85,247,0.7)]" />
            <div>
              <p className="text-sm font-medium text-white/70">{pt.title}</p>
              <p className="text-xs leading-6 text-white/32">{pt.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-auto pt-8">{visual}</div>

      <motion.div {...fadeUpView(0.75)} className="mt-8">
        <Link to={cta.to}>
          <motion.span
            whileHover={{ x: 4 }}
            className="group inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-violet-400 transition-colors hover:text-violet-300"
          >
            {cta.label}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </motion.span>
        </Link>
      </motion.div>
    </GlowCard>
  );
}

export function DiscoverySection() {
  return (
    <section className="relative overflow-hidden bg-[#020205] py-28 sm:py-44">
      <SectionDivider />

      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.04) 0%, transparent 60%)' }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 sm:mb-20 text-center">
          <motion.div {...fadeUpView()}>
            <SectionLabel className="mb-5">Diseñado para todos</SectionLabel>
          </motion.div>
          <div className="overflow-hidden">
            <motion.p
              {...slideUpView(0, 0.78)}
              className="text-[clamp(2.4rem,5.5vw,4.2rem)] font-black leading-[1.05] tracking-tight text-white"
            >
              Dos lados. Una plataforma.
            </motion.p>
          </div>
        </div>

        <div className="grid items-stretch gap-8 lg:grid-cols-2 lg:gap-10">
          <motion.div
            className="h-full"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease: easeOut }}
          >
            <DiscoveryPanel
              icon={Code2}
              label="Para developers"
              heading="Muéstrate."
              subtext="Tu código real. Tu stack real. Tu trayectoria real. Sin templates vacíos."
              points={DEV_POINTS}
              visual={<DevVisual />}
              cta={{ label: 'Crear mi portafolio', to: '/register' }}
              glowOrigin="top-left"
            />
          </motion.div>

          <motion.div
            className="h-full"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2, ease: easeOut }}
          >
            <DiscoveryPanel
              icon={Briefcase}
              label="Para reclutadores"
              heading="Descúbrelos."
              subtext="Talento verificado. No keywords. Proyectos reales. Experiencia comprobada."
              points={RECRUITER_POINTS}
              visual={<RecruiterVisual />}
              cta={{ label: 'Explorar talento', to: '/explorar' }}
              glowOrigin="top-right"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
