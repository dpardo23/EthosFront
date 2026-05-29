import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { EthosCoreLogo } from '@/components/brand/EthosCoreLogo';
import { Github, Twitter, Linkedin } from 'lucide-react';

const PLATFORM_LINKS = [
  { label: 'Inicio',         href: '/' },
  { label: 'Explorar',       href: '/explorar' },
  { label: 'Iniciar sesión', href: '/login' },
  { label: 'Registrarse',    href: '/register' },
];

const LEGAL_LINKS = [
  { label: 'Privacidad', href: '/privacidad' },
  { label: 'Términos',   href: '/terminos' },
];

const SOCIAL_LINKS = [
  { label: 'GitHub',   href: '#', Icon: Github },
  { label: 'Twitter',  href: '#', Icon: Twitter },
  { label: 'LinkedIn', href: '#', Icon: Linkedin },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

export function FooterSection() {
  return (
    <footer className="relative overflow-hidden bg-black pb-10 pt-20 sm:pb-12 sm:pt-24">
      {/* Top separator */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      {/* Ambient glow bottom-center */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 h-[400px] w-[700px] -translate-x-1/2 rounded-full"
        style={{
          background: 'radial-gradient(ellipse at 50% 100%, rgba(124,58,237,0.07) 0%, transparent 65%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Main grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid gap-12 sm:grid-cols-[1.4fr_1fr_1fr] sm:gap-8 lg:gap-16"
        >
          {/* Brand column */}
          <motion.div variants={item}>
            <EthosCoreLogo size="sm" animate showText />
            <p className="mt-5 max-w-xs text-sm leading-7 text-white/28">
              La plataforma para developers que quieren ser descubiertos por lo que realmente construyen.
            </p>

            {/* Social links */}
            <div className="mt-6 flex items-center gap-3">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <motion.a
                  key={label}
                  href={href}
                  aria-label={label}
                  whileHover={{ scale: 1.1, color: 'rgba(168,85,247,0.9)' }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.02] text-white/30 transition-colors hover:border-violet-500/25 hover:text-violet-400/80"
                >
                  <Icon className="h-3.5 w-3.5" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Platform links */}
          <motion.div variants={item}>
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/20">
              Plataforma
            </p>
            <ul className="space-y-3">
              {PLATFORM_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    to={href}
                    className="text-sm text-white/38 transition-colors duration-200 hover:text-white/75"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Legal links */}
          <motion.div variants={item}>
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/20">
              Legal
            </p>
            <ul className="space-y-3">
              {LEGAL_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    to={href}
                    className="text-sm text-white/38 transition-colors duration-200 hover:text-white/75"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* EthosHub pill */}
            <div className="mt-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/18 bg-violet-500/6 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-400/70">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
                Gratuito para siempre
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/[0.05] pt-8 sm:flex-row"
        >
          <p className="text-xs text-white/18">
            © {new Date().getFullYear()} EthosHub. Todos los derechos reservados.
          </p>
          <p className="text-xs text-white/14">
            Construido para developers serios.
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
