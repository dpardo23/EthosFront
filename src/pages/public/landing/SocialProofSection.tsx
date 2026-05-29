import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

const STATS = [
  { value: 2400, suffix: '+', label: 'Developers activos' },
  { value: 180,  suffix: '+', label: 'Empresas reclutadoras' },
  { value: 5200, suffix: '+', label: 'Portafolios creados' },
  { value: 120,  suffix: '+', label: 'Tecnologías indexadas' },
];

function AnimatedNumber({
  target,
  suffix,
  inView,
}: {
  target: number;
  suffix: string;
  inView: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf: number;
    const start = performance.now();
    const duration = 1600;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target]);

  return (
    <>
      {count.toLocaleString()}
      {suffix}
    </>
  );
}

export function SocialProofSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section ref={ref} className="relative overflow-hidden bg-[#020205] py-12 sm:py-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-y-10 sm:grid-cols-4 sm:gap-y-0">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col items-center gap-2 text-center"
            >
              {i > 0 && (
                <div className="pointer-events-none absolute left-0 top-1/2 hidden h-8 w-px -translate-y-1/2 bg-white/[0.07] sm:block" />
              )}
              <p className="tabular-nums text-[clamp(1.8rem,3vw,2.6rem)] font-black leading-none tracking-tight text-white">
                <AnimatedNumber target={stat.value} suffix={stat.suffix} inView={inView} />
              </p>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/28">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
