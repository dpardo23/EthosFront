import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Globe } from 'lucide-react';
import { useAuthStore } from '@/store';
import { EthosCoreLogo, EthosLogoIcon } from '@/components/brand/EthosCoreLogo';
import i18n from '@/i18n';

// ─── Language Switcher ───────────────────────────────────────────────
function LangSwitcher() {
  const [lang, setLang] = useState<'es' | 'en'>(
    (localStorage.getItem('ethoshub_language') as 'es' | 'en') ?? 'es'
  );
  const [open, setOpen] = useState(false);

  const toggle = (next: 'es' | 'en') => {
    setLang(next);
    i18n.changeLanguage(next);
    localStorage.setItem('ethoshub_language', next);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition-all hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-white"
        aria-label="Cambiar idioma"
      >
        <Globe className="h-3.5 w-3.5" />
        {lang.toUpperCase()}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full z-50 mt-2 w-28 overflow-hidden rounded-xl border border-white/10 bg-[#0A0A14]/95 shadow-2xl backdrop-blur-xl"
            >
              {(['es', 'en'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => toggle(l)}
                  className={`flex w-full items-center gap-2 px-3 py-2.5 text-sm transition-colors ${
                    lang === l
                      ? 'bg-violet-500/15 text-violet-300'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-base">{l === 'es' ? '🇪🇸' : '🇺🇸'}</span>
                  {l === 'es' ? 'Español' : 'English'}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Mobile Menu ─────────────────────────────────────────────────────
function MobileMenu({
  open,
  isAuthenticated,
  onClose,
}: {
  open: boolean;
  isAuthenticated: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-x-4 top-20 z-50 overflow-hidden rounded-2xl border border-white/10 bg-[#07070F]/98 shadow-2xl backdrop-blur-2xl"
          >
            <div className="p-4 flex flex-col gap-3">
              {isAuthenticated ? (
                <Link to="/dashboard" onClick={onClose}>
                  <button className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white transition-all hover:bg-violet-500">
                    Dashboard
                  </button>
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={onClose}>
                    <button className="w-full rounded-xl border border-white/12 bg-white/5 py-3 text-sm font-medium text-white/80 transition-all hover:border-white/20 hover:bg-white/8 hover:text-white">
                      Iniciar Sesión
                    </button>
                  </Link>
                  <Link to="/register" onClick={onClose}>
                    <button className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:from-violet-500 hover:to-purple-500">
                      Crear Cuenta
                    </button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Navbar ──────────────────────────────────────────────────────────
function Navbar() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-0 top-4 z-50 mx-auto max-w-6xl px-4 sm:px-6"
      >
        <div
          className={`relative flex h-14 items-center justify-between rounded-2xl px-4 sm:px-5 transition-all duration-500 ${
            scrolled
              ? 'border border-white/10 bg-black/80 shadow-2xl shadow-black/40 backdrop-blur-2xl'
              : 'border border-white/6 bg-black/40 backdrop-blur-xl'
          }`}
        >
          {/* Logo */}
          <Link to="/" className="shrink-0">
            <div className="sm:hidden">
              <EthosLogoIcon size={28} />
            </div>
            <div className="hidden sm:block">
              <EthosCoreLogo size="sm" />
            </div>
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <LangSwitcher />
            </div>

            {isAuthenticated ? (
              <Link to="/dashboard">
                <button className="hidden rounded-xl bg-violet-600 px-4 py-1.5 text-sm font-semibold text-white transition-all hover:bg-violet-500 sm:block">
                  Dashboard
                </button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block">
                  <button className="rounded-xl border border-white/12 bg-transparent px-4 py-1.5 text-sm font-medium text-white/75 transition-all hover:border-white/22 hover:bg-white/6 hover:text-white">
                    Iniciar Sesión
                  </button>
                </Link>
                <Link to="/register" className="hidden sm:block">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-purple-500"
                  >
                    Crear Cuenta
                  </motion.button>
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((p) => !p)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/8 hover:text-white md:hidden"
              aria-label="Menú"
            >
              <AnimatePresence mode="wait">
                {mobileOpen ? (
                  <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <X className="h-4 w-4" />
                  </motion.span>
                ) : (
                  <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Menu className="h-4 w-4" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.header>

      <MobileMenu
        open={mobileOpen}
        isAuthenticated={isAuthenticated}
        onClose={() => setMobileOpen(false)}
      />
    </>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────
const SOCIAL_LINKS = [
  { label: '@EthosDevHub',    handle: 'TikTok',    href: '#' },
  { label: '@BuildWithEthos', handle: 'Instagram', href: '#' },
  { label: '@EthosVerse',     handle: 'Facebook',  href: '#' },
  { label: 'EthosHub',        handle: 'Discord',   href: '#' },
];

function Footer() {
  return (
    <footer className="relative border-t border-white/6 bg-[#020205] py-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.5fr_0.75fr_0.75fr_0.75fr_0.75fr]">

          {/* Brand */}
          <div>
            <EthosCoreLogo size="md" />
            <p className="mt-4 max-w-xs text-sm leading-7 text-white/38">
              La plataforma para profesionales tech que quieren construir una identidad digital memorable.
            </p>
            <div className="mt-6 space-y-2">
              {SOCIAL_LINKS.map(({ label, handle, href }) => (
                <a
                  key={handle}
                  href={href}
                  className="flex items-center gap-2.5 text-xs text-white/35 transition-colors hover:text-white/65"
                >
                  <span className="w-[60px] shrink-0 text-[10px] font-semibold uppercase tracking-wide text-white/20">
                    {handle}
                  </span>
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Producto */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/22">Producto</p>
            <div className="mt-4 flex flex-col gap-3 text-sm">
              <Link to="/#caracteristicas" className="text-white/42 transition-colors hover:text-white/78">Características</Link>
              <Link to="/explorar" className="text-white/42 transition-colors hover:text-white/78">Explorar Talento</Link>
              <Link to="/register" className="text-white/42 transition-colors hover:text-white/78">Crear perfil</Link>
              <Link to="/login" className="text-white/42 transition-colors hover:text-white/78">Iniciar sesión</Link>
            </div>
          </div>

          {/* Empresa */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/22">Empresa</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-white/42">
              <span className="cursor-default transition-colors hover:text-white/78">Sobre Nosotros</span>
              <span className="cursor-default transition-colors hover:text-white/78">Blog</span>
              <a href="mailto:contacto.bytebusters@gmail.com" className="transition-colors hover:text-white/78">
                Contacto
              </a>
            </div>
          </div>

          {/* Legal */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/22">Legal</p>
            <div className="mt-4 flex flex-col gap-3 text-sm">
              <Link to="/privacidad" className="text-white/42 transition-colors hover:text-white/78">Privacidad</Link>
              <Link to="/terminos" className="text-white/42 transition-colors hover:text-white/78">Términos de Uso</Link>
              <span className="cursor-default text-white/42 transition-colors hover:text-white/78">Cookies</span>
              <span className="cursor-default text-white/42 transition-colors hover:text-white/78">Seguridad</span>
            </div>
          </div>

          {/* Contacto */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/22">Contacto</p>
            <div className="mt-4 flex flex-col gap-3">
              <a
                href="mailto:contacto.bytebusters@gmail.com"
                className="break-all text-xs text-white/42 transition-colors hover:text-violet-400"
              >
                contacto.bytebusters@gmail.com
              </a>
              <span className="text-xs text-white/22">Respuesta en 24–48 h</span>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-white/6 pt-8 text-xs text-white/22 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 EthosHub · Bytebusters. Todos los derechos reservados.</p>
          <p>Hecho con dedicación para la comunidad tech.</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Layout ──────────────────────────────────────────────────────────
export function PublicPortfolioLayout() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
