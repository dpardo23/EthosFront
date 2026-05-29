import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, GitBranch, Star, MapPin, ExternalLink } from 'lucide-react';
import { SectionDivider, GradientText } from '@/shared/landing';
import { easeOut, fadeUpView, slideUpView, fadeView } from '@/shared/motion';

const TECH_WORDS = [
  'React', 'TypeScript', 'Go', 'Rust', 'Python', 'Node.js', 'Kubernetes',
  'Docker', 'GraphQL', 'PostgreSQL', 'AWS', 'Flutter', 'Swift', 'Terraform',
  'Next.js', 'Prisma', 'Redis', 'MongoDB', 'Supabase', 'Vercel',
  'Elixir', 'Java', 'C++', 'Dart', 'Firebase', 'Linux',
];

function TechMarquee({ reverse = false }: { reverse?: boolean }) {
  const doubled = [...TECH_WORDS, ...TECH_WORDS];
  return (
    <div className="relative overflow-hidden py-1">
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-black to-transparent sm:w-36" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-black to-transparent sm:w-36" />
      <motion.div
        animate={{ x: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
        transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
        className="flex gap-10"
      >
        {doubled.map((word, i) => (
          <span key={i} className="cursor-default whitespace-nowrap font-mono text-sm text-white/[0.11] transition-colors duration-300 hover:text-violet-400/55">
            {word}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

const CONTRIBUTIONS_WEEKS = 14;
const CONTRIBUTIONS_DAYS  = 7;

function ProfileCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.1, delay: 0.25, ease: easeOut }}
      className="relative"
    >
      <div
        className="pointer-events-none absolute -inset-10 rounded-3xl opacity-70"
        style={{ background: 'radial-gradient(ellipse at 60% 50%, rgba(124,58,237,0.13) 0%, transparent 60%)' }}
      />

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#06060E] shadow-2xl shadow-violet-950/30">
        <div className="flex items-center gap-1.5 border-b border-white/[0.05] bg-white/[0.012] px-4 py-2.5">
          <span className="h-2 w-2 rounded-full bg-white/[0.1]" />
          <span className="h-2 w-2 rounded-full bg-white/[0.1]" />
          <span className="h-2 w-2 rounded-full bg-white/[0.1]" />
          <div className="ml-2.5 flex h-5 max-w-44 flex-1 items-center rounded-full bg-white/[0.04] px-3">
            <span className="text-[9px] text-white/20">ethoshub.com/p/alex-r</span>
          </div>
          <ExternalLink className="ml-auto h-3 w-3 text-white/15" />
        </div>

        <div className="border-b border-white/[0.05] p-5">
          <div className="flex items-start gap-3.5">
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/35 to-purple-900/55">
              <div className="absolute inset-0 flex items-center justify-center text-base font-bold text-violet-200/80">AR</div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-white">Alex Rodríguez</span>
                <span className="rounded-full border border-violet-500/18 bg-violet-500/7 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-violet-400">
                  Verificado
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-white/42">Senior Frontend Engineer · 6 años exp.</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-white/22">
                <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />Madrid, España</span>
                <span className="flex items-center gap-1"><Star className="h-2.5 w-2.5 text-violet-400/60" />Open to work</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {['React', 'TypeScript', 'Node.js', 'Go', 'AWS', 'Docker'].map((tech) => (
              <span key={tech} className="rounded-md border border-violet-500/14 bg-violet-500/5 px-2 py-0.5 text-[10px] text-violet-300/65">
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="h-3 w-3 text-white/22" />
              <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/22">Actividad 2024</span>
            </div>
            <span className="rounded-full bg-violet-500/7 px-2 py-0.5 text-[9px] text-violet-400/70">342 contributions</span>
          </div>
          <div className="flex gap-[3px] overflow-hidden">
            {Array.from({ length: CONTRIBUTIONS_WEEKS }, (_, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {Array.from({ length: CONTRIBUTIONS_DAYS }, (_, di) => {
                  const seed = (wi * 7 + di + 3) % 11;
                  const level = seed < 4 ? 0 : seed < 7 ? 1 : seed < 9 ? 2 : 3;
                  const opacity = [0.05, 0.26, 0.55, 0.9][level];
                  return (
                    <motion.div
                      key={di}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.15, delay: 0.6 + (wi * 7 + di) * 0.004 }}
                      className="h-[7px] w-[7px] rounded-[2px] bg-violet-500"
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/[0.05] p-5">
          <p className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.14em] text-white/22">Proyectos</p>
          <div className="space-y-1.5">
            {[
              { name: 'ethos-ui',        desc: 'React component library',     stars: '247', lang: 'TypeScript' },
              { name: 'go-api-starter',  desc: 'Production Go API template',  stars: '89',  lang: 'Go'         },
            ].map((p) => (
              <div key={p.name} className="flex items-center gap-2.5 rounded-lg border border-white/[0.04] bg-white/[0.016] px-3 py-2">
                <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-400/55" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-white/65">{p.name}</p>
                  <p className="text-[9px] text-white/25">{p.lang} · {p.desc}</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-white/22">
                  <Star className="h-2.5 w-2.5" />
                  {p.stars}
                </div>
              </div>
            ))}
          </div>

          <Link to="/explorar">
            <motion.div
              whileHover={{ x: 3 }}
              className="mt-4 flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-violet-400/70 transition-colors hover:text-violet-400"
            >
              Ver portafolio completo
              <ArrowRight className="h-3 w-3" />
            </motion.div>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

const HEADLINE_LINES = [
  { text: 'No eres',      dim: true  },
  { text: 'tu CV.',       dim: false },
  { text: 'Eres lo que', dim: false },
  { text: 'construyes.',  gradient: true },
] as const;

export function ShowcaseSection() {
  return (
    <section className="relative overflow-hidden bg-black py-24 sm:py-40">
      <SectionDivider />

      <div
        className="pointer-events-none absolute right-0 top-1/4 h-[600px] w-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 65%)' }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div>
            <motion.div {...fadeUpView()} className="mb-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-400/70">
                La nueva identidad profesional
              </p>
            </motion.div>

            <div className="space-y-0.5">
              {HEADLINE_LINES.map((line, i) => (
                <div key={i} className="overflow-hidden">
                  <motion.p
                    {...slideUpView(i * 0.1)}
                    className={`text-[clamp(2.8rem,7vw,5.5rem)] font-black leading-[1.0] tracking-tight ${
                      'gradient' in line && line.gradient ? '' : 'dim' in line && line.dim ? 'text-white/38' : 'text-white'
                    }`}
                  >
                    {'gradient' in line && line.gradient ? <GradientText>{line.text}</GradientText> : line.text}
                  </motion.p>
                </div>
              ))}
            </div>

            <motion.p {...fadeUpView(0.52, 0.6)} className="mt-8 max-w-md text-[1rem] leading-[1.85] text-white/36">
              Los CVs cuentan historias. Los portafolios las demuestran.
              Tu historial real, tus proyectos reales — todo en un solo lugar que habla por ti.
            </motion.p>

            <motion.div {...fadeUpView(0.64)} className="mt-8">
              <Link to="/explorar">
                <motion.span
                  whileHover={{ x: 4 }}
                  className="group inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-violet-400 transition-colors hover:text-violet-300"
                >
                  Explorar talento real
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </motion.span>
              </Link>
            </motion.div>
          </div>

          <div className="mx-auto w-full max-w-sm sm:max-w-md lg:max-w-none">
            <ProfileCard />
          </div>
        </div>

        <motion.div {...fadeView(0.2, 1)} className="mt-24 space-y-3 overflow-hidden">
          <TechMarquee />
          <TechMarquee reverse />
        </motion.div>
      </div>
    </section>
  );
}
