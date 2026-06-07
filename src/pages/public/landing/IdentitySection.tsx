import { motion } from 'framer-motion';
import { GitBranch, Globe, Search, Clock, CheckCircle2 } from 'lucide-react';
import { SectionLabel, SectionDivider, GradientText } from '@/shared/landing';
import { easeOut, fadeUpView, slideUpView } from '@/shared/motion';

/**
 * Landing section explaining the professional identity and portfolio features of the platform.
 */
function ActivityFeed() {
  const activities = [
    { msg: 'feat: add auth flow with JWT refresh tokens',       repo: 'api-core',     lang: 'Go',         time: '2h' },
    { msg: 'refactor: migrate state to React Query v5',         repo: 'dashboard-ui', lang: 'TypeScript', time: '5h' },
    { msg: 'fix: resolve N+1 query in projects endpoint',       repo: 'api-core',     lang: 'Go',         time: '1d' },
    { msg: 'chore: update deps, remove deprecated APIs',        repo: 'ethos-ui',     lang: 'TypeScript', time: '2d' },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#06060E]">
      <div className="flex items-center gap-2 border-b border-white/[0.05] px-5 py-3.5">
        <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400 shadow-[0_0_8px_rgba(168,85,247,0.9)]" />
        <span className="text-[11px] font-medium text-white/38">Actividad sincronizada · GitHub</span>
        <span className="ml-auto rounded-full border border-violet-500/18 bg-violet-500/7 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-violet-400">
          En vivo
        </span>
      </div>

      <div className="divide-y divide-white/[0.03]">
        {activities.map((act, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.12, ease: easeOut }}
            className="flex items-start gap-3 px-5 py-3.5"
          >
            <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-violet-500/8">
              <GitBranch className="h-3 w-3 text-violet-400/70" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium text-white/65">{act.msg}</p>
              <div className="mt-0.5 flex items-center gap-2 text-[10px] text-white/25">
                <span className="rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-[9px] text-white/35">{act.repo}</span>
                <span>{act.lang}</span>
                <span className="ml-auto flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {act.time}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-6 border-t border-white/[0.04] px-5 py-4">
        {[['342', 'commits este año'], ['4', 'repos activos'], ['87%', 'TypeScript / Go']].map(([val, label]) => (
          <div key={label} className="flex flex-col">
            <span className="text-sm font-bold text-white/80">{val}</span>
            <span className="text-[9px] text-white/22">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PortfolioMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#06060E] shadow-2xl">
      <div className="flex items-center gap-1.5 border-b border-white/[0.05] bg-white/[0.01] px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-white/[0.09]" />
        <span className="h-2 w-2 rounded-full bg-white/[0.09]" />
        <span className="h-2 w-2 rounded-full bg-white/[0.09]" />
        <div className="ml-3 flex h-5 max-w-52 flex-1 items-center rounded-full bg-white/[0.04] px-3">
          <span className="text-[9px] text-white/20">ethoshub.com/p/tu-perfil</span>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3.5">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-purple-900/50 text-lg font-bold text-violet-200/70">
            TU
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 h-3 w-28 rounded-full bg-white/[0.12]" />
            <div className="h-2.5 w-20 rounded-full bg-white/[0.07]" />
          </div>
          <div className="flex h-8 w-24 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/8">
            <span className="text-[10px] text-violet-400">Contactar</span>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-1.5">
          {['React', 'TypeScript', 'Go', 'Docker', 'AWS'].map((tech) => (
            <span key={tech} className="rounded-lg border border-violet-500/14 bg-violet-500/5 px-2 py-1 text-[10px] text-violet-300/60">
              {tech}
            </span>
          ))}
        </div>

        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/22">Proyectos</span>
            <span className="text-[10px] text-violet-400/60">Ver todos →</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: 'Dashboard UI', desc: 'React + TypeScript' },
              { name: 'API Core',     desc: 'Go + PostgreSQL'   },
              { name: 'CLI Tools',    desc: 'Rust + WASM'       },
              { name: 'Mobile App',  desc: 'Flutter'            },
            ].map((project, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
                className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-3"
              >
                <div className="mb-1.5 h-1.5 w-1.5 rounded-full bg-violet-400/50" />
                <p className="text-[11px] font-medium text-white/62">{project.name}</p>
                <p className="mt-0.5 text-[9px] text-white/22">{project.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecruiterSearch() {
  const results = [
    { init: 'AR', name: 'Alex R.',   title: 'Frontend Engineer', stack: ['React', 'TS', 'Go'],    match: '98%' },
    { init: 'SM', name: 'Sara M.',   title: 'Fullstack Dev',     stack: ['Vue', 'Node', 'AWS'],   match: '94%' },
    { init: 'ML', name: 'Marcos L.', title: 'Backend Eng.',      stack: ['Go', 'Rust', 'k8s'],    match: '91%' },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#06060E]">
      <div className="border-b border-white/[0.05] p-5">
        <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-2.5">
          <Search className="h-3.5 w-3.5 flex-shrink-0 text-white/28" />
          <span className="text-[11px] text-white/28">React · TypeScript · +5 años</span>
          <span className="ml-auto rounded-lg bg-violet-500/12 px-2.5 py-1 text-[10px] font-medium text-violet-400">Buscar</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['Senior', 'Remote', 'Full-time', 'Open to work'].map((tag) => (
            <span key={tag} className="rounded-full border border-violet-500/15 bg-violet-500/5 px-2.5 py-0.5 text-[9px] text-violet-300/60">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="divide-y divide-white/[0.03]">
        {results.map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.12 }}
            className="flex items-center gap-3 px-5 py-3.5"
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/25 to-purple-900/40 text-[10px] font-bold text-violet-300/70">
              {r.init}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-white/65">{r.name}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-1">
                <span className="text-[9px] text-white/28">{r.title}</span>
                <span className="text-[9px] text-white/18">·</span>
                {r.stack.map((s) => <span key={s} className="text-[9px] text-white/22">{s}</span>)}
              </div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-violet-400/70" />
              <span className="text-[11px] font-semibold text-violet-400/80">{r.match}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="border-t border-white/[0.04] px-5 py-3">
        <p className="text-[10px] text-white/22">
          Mostrando <span className="text-violet-400/60">3 de 47</span> perfiles que coinciden
        </p>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    num: '01', icon: GitBranch,
    subtitle: 'GitHub · Credibilidad real',
    title: ['Tu historial', 'habla.'],
    description: 'Conecta tus herramientas de desarrollo. Tu actividad real, commits y experiencia se convierten en credibilidad verificable automáticamente.',
    Visual: ActivityFeed,
  },
  {
    num: '02', icon: Globe,
    subtitle: 'Portafolio digital',
    title: ['Siempre listo,', 'siempre visible.'],
    description: 'Un link profesional que muestra tu stack, proyectos y trayectoria. Diseñado para reclutadores, optimizado para dejar huella.',
    Visual: PortfolioMockup,
  },
  {
    num: '03', icon: Search,
    subtitle: 'Descubrimiento inteligente',
    title: ['Las oportunidades', 'te encuentran.'],
    description: 'Tu perfil trabaja para ti. Reclutadores buscan por stack real, experiencia y proyectos — no por palabras clave vacías.',
    Visual: RecruiterSearch,
  },
];

export function IdentitySection() {
  return (
    <section id="caracteristicas" className="relative overflow-hidden bg-black py-28 sm:py-44">
      <SectionDivider />

      <div
        className="pointer-events-none absolute -left-40 top-1/3 h-[600px] w-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)' }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 sm:mb-24 max-w-xl">
          <motion.div {...fadeUpView()}>
            <SectionLabel className="mb-5">Características</SectionLabel>
          </motion.div>

          <div className="space-y-0.5">
            {['Todo en un', 'solo lugar.'].map((line, i) => (
              <div key={i} className="overflow-hidden">
                <motion.p
                  {...slideUpView(i * 0.12)}
                  className="text-[clamp(2.6rem,6.5vw,5rem)] font-black leading-[1.05] tracking-tight text-white"
                >
                  {line}
                </motion.p>
              </div>
            ))}
          </div>

          <motion.p {...fadeUpView(0.3, 0.6)} className="mt-6 text-base leading-8 text-white/36">
            Construido para developers serios.
          </motion.p>
        </div>

        <div className="space-y-20 sm:space-y-36 lg:space-y-48">
          {FEATURES.map((feature, i) => {
            const isEven = i % 2 === 0;
            const slideText = isEven
              ? { initial: { opacity: 0, x: -28 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true as const }, transition: { duration: 0.75, delay: 0.1, ease: easeOut } }
              : { initial: { opacity: 0, x: 28 },  whileInView: { opacity: 1, x: 0 }, viewport: { once: true as const }, transition: { duration: 0.75, delay: 0.1, ease: easeOut } };

            return (
              <div key={feature.num} className="relative">
                <span
                  className={`pointer-events-none absolute -top-6 select-none font-black leading-none tracking-tighter text-white ${isEven ? 'left-0' : 'right-0'}`}
                  style={{ fontSize: 'clamp(5rem, 12vw, 10rem)', opacity: 0.025 }}
                  aria-hidden
                >
                  {feature.num}
                </span>

                <div className={`grid items-center gap-10 sm:gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-24 ${!isEven ? 'lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1' : ''}`}>
                  <motion.div {...slideText}>
                    <div className="mb-7 flex items-center gap-3">
                      <span className="font-mono text-4xl font-black text-white/[0.06]">{feature.num}</span>
                      <div className="h-px w-8 bg-violet-500/35" />
                      <SectionLabel className="tracking-[0.22em] text-violet-400/65">{feature.subtitle}</SectionLabel>
                    </div>

                    <div className="space-y-0">
                      {feature.title.map((line, li) => (
                        <div key={li} className="overflow-hidden">
                          <motion.h3
                            {...slideUpView(0.15 + li * 0.1, 0.72)}
                            className="text-[clamp(2.2rem,5vw,4rem)] font-black leading-[1.08] tracking-tight text-white"
                          >
                            {li === feature.title.length - 1 ? <GradientText>{line}</GradientText> : line}
                          </motion.h3>
                        </div>
                      ))}
                    </div>

                    <motion.p {...fadeUpView(0.38, 0.6)} className="mt-6 max-w-md text-base leading-8 text-white/40">
                      {feature.description}
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.7 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                      className="mt-9 flex h-12 w-12 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/7 shadow-[0_0_24px_rgba(124,58,237,0.12)]"
                    >
                      <feature.icon className="h-5 w-5 text-violet-400" />
                    </motion.div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2, ease: easeOut }}
                    className="relative"
                  >
                    <div
                      className="pointer-events-none absolute -inset-4 rounded-3xl blur-2xl"
                      style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)' }}
                    />
                    <feature.Visual />
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
