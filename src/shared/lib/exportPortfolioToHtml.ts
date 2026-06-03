import type {
  PublicPortfolio,
  PublicProject,
  PublicExperience,
  PublicEducation,
  PublicHardSkill,
  PublicSoftSkill,
} from '@/shared/services/portfolioService';

// ── Helpers ────────────────────────────────────────────────────────────────────

function esc(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmt(d: string): string {
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'short' });
  } catch {
    return d;
  }
}

function period(start: string, end: string | null, isCurrent: boolean): string {
  return `${fmt(start)} &ndash; ${isCurrent || !end ? 'Actualidad' : fmt(end)}`;
}

// ── Inline SVG icons ──────────────────────────────────────────────────────────

const IC = {
  pin:     `<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  mail:    `<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  globe:   `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  eye:     `<svg viewBox="0 0 24 24"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>`,
  build:   `<svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="13" rx="2"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/></svg>`,
  grad:    `<svg viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  code:    `<svg viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  folder:  `<svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  star:    `<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  extlink: `<svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
  award:   `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`,
  check:   `<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
};

// Apply consistent SVG stroke styles (no fill, stroked paths)
const svgWrap = (inner: string) =>
  inner.replace(/<svg /, `<svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" `);

Object.keys(IC).forEach((k) => {
  (IC as Record<string, string>)[k] = svgWrap((IC as Record<string, string>)[k]);
});

// ── CSS ────────────────────────────────────────────────────────────────────────

function buildStyles(accent: string): string {
  return `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:#07070f;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif;line-height:1.6;min-height:100vh}
a{color:${accent};text-decoration:none}
a:hover{opacity:.8;text-decoration:underline}
img{display:block;max-width:100%}

/* ─── MOBILE HEADER (oculto en escritorio) ─────────────────────── */
.mob-hdr{display:none;position:sticky;top:0;z-index:30;background:#07070f;border-bottom:1px solid rgba(255,255,255,.06);padding:.75rem 1.25rem;align-items:center;justify-content:space-between;gap:1rem}
.mob-name{font-size:.9rem;font-weight:600;color:#f1f5f9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
.ham{background:none;border:none;cursor:pointer;padding:6px;display:flex;flex-direction:column;gap:5px;border-radius:.5rem}
.ham:hover{background:rgba(255,255,255,.06)}
.ham span{display:block;width:20px;height:2px;background:#94a3b8;border-radius:2px;transition:.2s}

/* ─── OVERLAY (solo móvil) ──────────────────────────────────────── */
.overlay{display:none;position:fixed;inset:0;z-index:40;background:rgba(0,0,0,0);transition:background .25s}
.overlay.open{background:rgba(0,0,0,.65)}

/* ─── SIDEBAR (oculto en escritorio; slide-in en móvil) ─────────── */
.sidebar{position:fixed;top:0;left:0;bottom:0;width:250px;background:#0b0b1b;border-right:1px solid rgba(255,255,255,.07);z-index:50;padding:1.5rem 1rem 2rem;display:none;flex-direction:column;gap:.5rem;transform:translateX(-100%);transition:transform .28s cubic-bezier(.4,0,.2,1)}
.sidebar.open{transform:translateX(0)}
.sb-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem}
.sb-label{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#475569}
.sb-close{background:none;border:none;color:#64748b;cursor:pointer;font-size:1.25rem;line-height:1;padding:2px 6px;border-radius:.375rem;transition:color .15s}
.sb-close:hover{color:#e2e8f0}
.sb-nav{list-style:none;display:flex;flex-direction:column;gap:2px}
.sb-nav a{display:flex;align-items:center;gap:.625rem;padding:.6rem .75rem;border-radius:.625rem;color:#94a3b8;font-size:.875rem;font-weight:500;transition:all .15s}
.sb-nav a:hover{background:rgba(255,255,255,.05);color:#e2e8f0;text-decoration:none}
.sb-dot{width:6px;height:6px;border-radius:50%;background:${accent};flex-shrink:0}

/* ─── CONTENEDOR ────────────────────────────────────────────────── */
.wrap{max-width:880px;margin:0 auto;padding:2.5rem 1.25rem 5rem}

/* ─── HERO ──────────────────────────────────────────────────────── */
.hero{position:relative;overflow:hidden;background:linear-gradient(140deg,#0c0c1e 0%,#0e0e20 100%);border:1px solid rgba(255,255,255,.07);border-radius:1.25rem;padding:2rem;margin-bottom:1.75rem}
.hero::before{content:'';position:absolute;top:-100px;right:-100px;width:320px;height:320px;background:radial-gradient(circle,${accent}1a 0%,transparent 68%);pointer-events:none}
.hero::after{content:'';position:absolute;bottom:-60px;left:-60px;width:200px;height:200px;background:radial-gradient(circle,${accent}0d 0%,transparent 70%);pointer-events:none}
.hero-inner{display:flex;gap:1.5rem;align-items:flex-start;position:relative;z-index:1}
.hero-avatar{width:90px;height:90px;border-radius:50%;border:2.5px solid ${accent}50;object-fit:cover;flex-shrink:0;box-shadow:0 0 0 4px ${accent}15}
.hero-ph{width:90px;height:90px;border-radius:50%;border:2.5px solid ${accent}50;background:linear-gradient(135deg,${accent}22,${accent}0a);display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:700;color:${accent};flex-shrink:0;box-shadow:0 0 0 4px ${accent}15}
.hero-body{flex:1;min-width:0}
.hero-name{font-size:1.65rem;font-weight:700;color:#f1f5f9;letter-spacing:-.025em;line-height:1.2}
.hero-title{font-size:.95rem;color:${accent};font-weight:500;margin-top:.35rem;letter-spacing:-.01em}
.hero-bio{font-size:.875rem;color:#94a3b8;margin-top:.75rem;line-height:1.75;max-width:580px}
.hero-meta{display:flex;flex-wrap:wrap;gap:.65rem;margin-top:1rem}
.meta-item{display:inline-flex;align-items:center;gap:.4rem;font-size:.8rem;color:#64748b}
.meta-item svg{width:14px;height:14px;flex-shrink:0;opacity:.7}
.meta-item a{color:#64748b;transition:color .15s}
.meta-item a:hover{color:${accent};text-decoration:none}
.views-badge{position:absolute;top:1.25rem;right:1.25rem;z-index:2;display:inline-flex;align-items:center;gap:.35rem;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:.625rem;padding:.3rem .65rem;font-size:.75rem;color:#475569}
.views-badge svg{width:13px;height:13px;flex-shrink:0}

/* ─── SECTION ───────────────────────────────────────────────────── */
.section{margin-bottom:1.75rem}
.sec-title{display:flex;align-items:center;gap:.65rem;font-size:1rem;font-weight:700;color:#e2e8f0;margin-bottom:1.25rem;padding-bottom:.75rem;border-bottom:1px solid rgba(255,255,255,.06)}
.sec-icon{width:30px;height:30px;border-radius:.5rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid ${accent}28;background:${accent}12}
.sec-icon svg{width:14px;height:14px;color:${accent}}

/* ─── PROYECTOS ─────────────────────────────────────────────────── */
.proj-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:.875rem}
.proj-card{background:#0d0d1e;border:1px solid rgba(255,255,255,.07);border-radius:1rem;overflow:hidden;display:flex;flex-direction:column;transition:border-color .2s,transform .2s,box-shadow .2s}
.proj-card:hover{border-color:${accent}35;transform:translateY(-2px);box-shadow:0 8px 30px rgba(0,0,0,.35)}
.proj-thumb{width:100%;height:130px;object-fit:cover}
.proj-thumb-ph{width:100%;height:130px;background:linear-gradient(135deg,${accent}12,${accent}06);display:flex;align-items:center;justify-content:center}
.proj-thumb-ph svg{width:36px;height:36px;color:${accent}50}
.proj-body{padding:.875rem;flex:1;display:flex;flex-direction:column;gap:.45rem}
.proj-hdr{display:flex;align-items:flex-start;justify-content:space-between;gap:.5rem}
.proj-title{font-size:.875rem;font-weight:600;color:#f1f5f9;line-height:1.35}
.feat-badge{flex-shrink:0;background:${accent}18;border:1px solid ${accent}32;border-radius:.375rem;padding:.15rem .5rem;font-size:.6rem;font-weight:700;color:${accent};text-transform:uppercase;letter-spacing:.07em;display:flex;align-items:center;gap:.25rem}
.feat-badge svg{width:9px;height:9px}
.proj-meta{display:flex;align-items:center;gap:.45rem;font-size:.72rem;color:#64748b}
.status-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.dot-z{background:#52525b}.dot-a{background:#f59e0b}.dot-g{background:#10b981}.dot-arc{background:#3f3f46}
.proj-desc{font-size:.78rem;color:#94a3b8;line-height:1.7;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.proj-tech{display:flex;flex-wrap:wrap;gap:.3rem}
.t-pill{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:.375rem;padding:.2rem .5rem;font-size:.68rem;color:#94a3b8}
.proj-footer{display:flex;gap:.45rem;padding-top:.5rem;border-top:1px solid rgba(255,255,255,.05);margin-top:auto}
.proj-link{display:inline-flex;align-items:center;gap:.3rem;font-size:.72rem;color:${accent};padding:.3rem .6rem;border:1px solid ${accent}28;border-radius:.5rem;background:${accent}0a;transition:background .15s;text-decoration:none!important}
.proj-link:hover{background:${accent}1c;opacity:1}
.proj-link svg{width:11px;height:11px}

/* ─── EXPERIENCIA ────────────────────────────────────────────────── */
.exp-list{display:flex;flex-direction:column;gap:.75rem}
.exp-card{background:#0d0d1e;border:1px solid rgba(255,255,255,.07);border-radius:1rem;padding:1rem;display:flex;gap:.875rem;align-items:flex-start}
.exp-logo{width:42px;height:42px;border-radius:.625rem;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.04);object-fit:contain;flex-shrink:0;padding:4px}
.exp-logo-ph{width:42px;height:42px;border-radius:.625rem;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.04);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.exp-logo-ph svg{width:18px;height:18px;color:#475569}
.exp-body{flex:1;min-width:0}
.exp-job{font-size:.9rem;font-weight:600;color:#f1f5f9}
.exp-company{font-size:.8rem;color:${accent};font-weight:500}
.exp-period{font-size:.73rem;color:#64748b;margin-top:.15rem}
.exp-desc{font-size:.78rem;color:#94a3b8;margin-top:.45rem;line-height:1.7}
.badge-current{display:inline-flex;align-items:center;gap:.3rem;font-size:.68rem;background:#10b98112;border:1px solid #10b98128;border-radius:.375rem;padding:.15rem .5rem;color:#10b981;margin-top:.4rem}
.badge-current svg{width:10px;height:10px}

/* ─── EDUCACIÓN ──────────────────────────────────────────────────── */
.edu-list{display:flex;flex-direction:column;gap:.75rem}
.edu-card{background:#0d0d1e;border:1px solid rgba(255,255,255,.07);border-radius:1rem;padding:1rem}
.edu-row{display:flex;align-items:flex-start;gap:.75rem}
.edu-logo{width:38px;height:38px;border-radius:.5rem;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.04);object-fit:contain;flex-shrink:0;padding:3px}
.edu-logo-ph{width:38px;height:38px;border-radius:.5rem;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.04);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.edu-logo-ph svg{width:16px;height:16px;color:#475569}
.edu-body{flex:1;min-width:0}
.edu-degree{font-size:.875rem;font-weight:600;color:#f1f5f9}
.edu-inst{font-size:.8rem;color:${accent};font-weight:500}
.edu-period{font-size:.73rem;color:#64748b;margin-top:.15rem}
.badge-progress{display:inline-flex;align-items:center;gap:.3rem;font-size:.68rem;background:${accent}10;border:1px solid ${accent}28;border-radius:.375rem;padding:.15rem .5rem;color:${accent};margin-top:.4rem}
.badge-progress svg{width:10px;height:10px}
.cred-link{display:inline-flex;align-items:center;gap:.35rem;font-size:.73rem;color:${accent};margin-top:.45rem;padding:.3rem .65rem;border:1px solid ${accent}25;border-radius:.5rem;background:${accent}08;text-decoration:none!important}
.cred-link:hover{background:${accent}18;opacity:1}
.cred-link svg{width:11px;height:11px}

/* ─── HABILIDADES ────────────────────────────────────────────────── */
.skills-block{display:flex;flex-direction:column;gap:1.25rem}
.skill-group{}
.skill-group-lbl{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#475569;margin-bottom:.65rem}
.pills{display:flex;flex-wrap:wrap;gap:.45rem}
.pill{display:inline-flex;align-items:center;gap:.4rem;border-radius:99px;padding:.35rem .85rem;font-size:.78rem;font-weight:500;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.04);color:#94a3b8}
.pill-lvl{opacity:.6;font-size:.68rem}
.p-j{background:#10b98110;border-color:#10b98128;color:#10b981}
.p-m{background:#3b82f610;border-color:#3b82f628;color:#60a5fa}
.p-s{background:${accent}12;border-color:${accent}28;color:${accent}}
.p-soft{background:rgba(251,113,133,.08);border-color:rgba(251,113,133,.22);color:#fb7185}

/* ─── FOOTER ─────────────────────────────────────────────────────── */
.footer{text-align:center;padding:2.5rem 1rem 3rem;color:#334155;font-size:.72rem;border-top:1px solid rgba(255,255,255,.04);margin-top:1rem}
.footer strong{color:#475569}
.footer a{color:#475569}

/* ══════════════ RESPONSIVE ══════════════ */
@media(max-width:767px){
  .mob-hdr{display:flex}
  .sidebar{display:flex}
  .wrap{padding:1.25rem 1rem 3rem}
  .hero{padding:1.25rem}
  .hero-inner{flex-direction:column;align-items:center;text-align:center}
  .hero-meta{justify-content:center}
  .hero-name{font-size:1.35rem}
  .views-badge{top:.875rem;right:.875rem;font-size:.68rem}
  .proj-grid{grid-template-columns:1fr}
}
@media(min-width:768px){
  .mob-hdr{display:none!important}
  .sidebar{display:none!important}
  .overlay{display:none!important}
}
`;
}

// ── JS ─────────────────────────────────────────────────────────────────────────

function buildScripts(): string {
  return `
(function(){
  function open(){
    var s=document.getElementById('sb'),o=document.getElementById('ov');
    if(!s||!o)return;
    s.classList.add('open');o.classList.add('open');
    document.body.style.overflow='hidden';
  }
  function close(){
    var s=document.getElementById('sb'),o=document.getElementById('ov');
    if(!s||!o)return;
    s.classList.remove('open');o.classList.remove('open');
    document.body.style.overflow='';
  }
  window.openSidebar=open;
  window.closeSidebar=close;
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});
})();
`;
}

// ── Section builders ──────────────────────────────────────────────────────────

function buildMobileHeader(name: string): string {
  return `
<header class="mob-hdr">
  <span class="mob-name">${esc(name)}</span>
  <button class="ham" onclick="openSidebar()" aria-label="Abrir navegación">
    <span></span><span></span><span></span>
  </button>
</header>`;
}

function buildSidebar(p: PublicPortfolio): string {
  const links: string[] = [
    `<li><a href="#hero" onclick="closeSidebar()"><span class="sb-dot"></span>Perfil</a></li>`,
  ];
  if (p.projects?.length)    links.push(`<li><a href="#projects" onclick="closeSidebar()"><span class="sb-dot"></span>Proyectos</a></li>`);
  if (p.experiences?.length) links.push(`<li><a href="#experience" onclick="closeSidebar()"><span class="sb-dot"></span>Experiencia</a></li>`);
  if (p.education?.length)   links.push(`<li><a href="#education" onclick="closeSidebar()"><span class="sb-dot"></span>Educación</a></li>`);
  if (p.hardSkills?.length || p.softSkills?.length)
    links.push(`<li><a href="#skills" onclick="closeSidebar()"><span class="sb-dot"></span>Habilidades</a></li>`);

  return `
<div class="overlay" id="ov" onclick="closeSidebar()"></div>
<nav class="sidebar" id="sb" aria-label="Navegación de secciones">
  <div class="sb-top">
    <span class="sb-label">Secciones</span>
    <button class="sb-close" onclick="closeSidebar()" aria-label="Cerrar">&#x2715;</button>
  </div>
  <ul class="sb-nav">
    ${links.join('\n    ')}
  </ul>
</nav>`;
}

function buildHero(p: PublicPortfolio): string {
  const initials = p.name
    .split(' ')
    .map((w) => w[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const avatar = p.photoUrl
    ? `<img class="hero-avatar" src="${esc(p.photoUrl)}" alt="${esc(p.name)}" />`
    : `<div class="hero-ph">${esc(initials || '?')}</div>`;

  const metaItems: string[] = [];
  if (p.location) metaItems.push(`<span class="meta-item">${IC.pin}&nbsp;${esc(p.location)}</span>`);
  if (p.email)    metaItems.push(`<span class="meta-item">${IC.mail}&nbsp;<a href="mailto:${esc(p.email)}">${esc(p.email)}</a></span>`);
  if (p.website)  metaItems.push(`<span class="meta-item">${IC.globe}&nbsp;<a href="${esc(p.website)}" target="_blank" rel="noopener">${esc(p.website)}</a></span>`);

  return `
<section id="hero" class="hero">
  <div class="views-badge">${IC.eye}&nbsp;${p.viewsCount ?? 0} visitas</div>
  <div class="hero-inner">
    ${avatar}
    <div class="hero-body">
      <div class="hero-name">${esc(p.name)}</div>
      ${p.professionalTitle ? `<div class="hero-title">${esc(p.professionalTitle)}</div>` : ''}
      ${p.bio ? `<div class="hero-bio">${esc(p.bio)}</div>` : ''}
      ${metaItems.length ? `<div class="hero-meta">${metaItems.join('')}</div>` : ''}
    </div>
  </div>
</section>`;
}

function statusDot(status: string): string {
  const map: Record<string, string> = {
    draft: 'dot-z', in_progress: 'dot-a', completed: 'dot-g', archived: 'dot-arc',
  };
  const label: Record<string, string> = {
    draft: 'Borrador', in_progress: 'En progreso', completed: 'Completado', archived: 'Archivado',
  };
  return `<span class="status-dot ${map[status] ?? 'dot-z'}"></span>${label[status] ?? esc(status)}`;
}

function buildProjects(items: PublicProject[]): string {
  if (!items?.length) return '';

  const cards = items.map((p) => {
    const thumb = p.thumbnail
      ? `<img class="proj-thumb" src="${esc(p.thumbnail)}" alt="${esc(p.title)}" />`
      : `<div class="proj-thumb-ph">${IC.folder}</div>`;

    const techs = p.technologies?.length
      ? `<div class="proj-tech">${p.technologies.map((t) => `<span class="t-pill">${esc(t)}</span>`).join('')}</div>`
      : '';

    const repoLink = p.repositoryUrl
      ? `<a class="proj-link" href="${esc(p.repositoryUrl)}" target="_blank" rel="noopener">${IC.extlink}&nbsp;Repositorio</a>`
      : '';

    const footer = repoLink ? `<div class="proj-footer">${repoLink}</div>` : '';

    const featured = p.isFeatured
      ? `<span class="feat-badge">${IC.star}&nbsp;Destacado</span>`
      : '';

    return `
<div class="proj-card">
  ${thumb}
  <div class="proj-body">
    <div class="proj-hdr">
      <div class="proj-title">${esc(p.title)}</div>
      ${featured}
    </div>
    <div class="proj-meta">${statusDot(p.status)}&nbsp;&middot;&nbsp;${esc(p.category)}</div>
    ${p.description ? `<div class="proj-desc">${esc(p.description)}</div>` : ''}
    ${techs}
    ${footer}
  </div>
</div>`;
  });

  return `
<section id="projects" class="section">
  <h2 class="sec-title">
    <div class="sec-icon">${IC.folder}</div>Proyectos
    <span style="margin-left:auto;font-size:.75rem;font-weight:400;color:#475569">${items.length} proyecto${items.length !== 1 ? 's' : ''}</span>
  </h2>
  <div class="proj-grid">${cards.join('')}</div>
</section>`;
}

function buildExperience(items: PublicExperience[]): string {
  if (!items?.length) return '';

  const cards = items.map((e) => {
    const logo = e.logoUrl
      ? `<img class="exp-logo" src="${esc(e.logoUrl)}" alt="${esc(e.companyName)}" />`
      : `<div class="exp-logo-ph">${IC.build}</div>`;

    const current = e.isCurrent
      ? `<div class="badge-current">${IC.check}&nbsp;Actualmente aquí</div>`
      : '';

    return `
<div class="exp-card">
  ${logo}
  <div class="exp-body">
    <div class="exp-job">${esc(e.jobTitle)}</div>
    <div class="exp-company">${esc(e.companyName)}</div>
    <div class="exp-period">${period(e.startDate, e.endDate, e.isCurrent)}</div>
    ${e.description ? `<div class="exp-desc">${esc(e.description)}</div>` : ''}
    ${current}
  </div>
</div>`;
  });

  return `
<section id="experience" class="section">
  <h2 class="sec-title">
    <div class="sec-icon">${IC.build}</div>Experiencia Laboral
    <span style="margin-left:auto;font-size:.75rem;font-weight:400;color:#475569">${items.length} posición${items.length !== 1 ? 'es' : ''}</span>
  </h2>
  <div class="exp-list">${cards.join('')}</div>
</section>`;
}

function buildEducation(items: PublicEducation[]): string {
  if (!items?.length) return '';

  const cards = items.map((e) => {
    const logo = e.logoUrl
      ? `<img class="edu-logo" src="${esc(e.logoUrl)}" alt="${esc(e.institution)}" />`
      : `<div class="edu-logo-ph">${IC.grad}</div>`;

    const degree = [e.degree, e.fieldOfStudy].filter(Boolean).join(' en ');

    const progress = e.inProgress
      ? `<div class="badge-progress">${IC.check}&nbsp;En curso</div>`
      : '';

    const cred = e.credentialUrl
      ? `<a class="cred-link" href="${esc(e.credentialUrl)}" target="_blank" rel="noopener">${IC.award}&nbsp;Ver credencial</a>`
      : '';

    return `
<div class="edu-card">
  <div class="edu-row">
    ${logo}
    <div class="edu-body">
      <div class="edu-degree">${esc(degree)}</div>
      <div class="edu-inst">${esc(e.institution)}</div>
      <div class="edu-period">${period(e.startDate, e.endDate, e.inProgress)}</div>
      ${progress}
      ${cred}
    </div>
  </div>
</div>`;
  });

  return `
<section id="education" class="section">
  <h2 class="sec-title">
    <div class="sec-icon">${IC.grad}</div>Educación
    <span style="margin-left:auto;font-size:.75rem;font-weight:400;color:#475569">${items.length} registro${items.length !== 1 ? 's' : ''}</span>
  </h2>
  <div class="edu-list">${cards.join('')}</div>
</section>`;
}

function buildSkills(hard: PublicHardSkill[], soft: PublicSoftSkill[]): string {
  if (!hard?.length && !soft?.length) return '';

  const levelClass: Record<string, string> = { Junior: 'p-j', Mid: 'p-m', Senior: 'p-s' };

  const hardGroup = hard?.length
    ? `<div class="skill-group">
        <div class="skill-group-lbl">Habilidades Técnicas</div>
        <div class="pills">
          ${hard.map((s) => {
            const cls = levelClass[s.level ?? ''] ?? '';
            return `<span class="pill ${cls}">${esc(s.name)}${s.level ? `<span class="pill-lvl">&middot; ${esc(s.level)}</span>` : ''}</span>`;
          }).join('')}
        </div>
      </div>`
    : '';

  const softGroup = soft?.length
    ? `<div class="skill-group">
        <div class="skill-group-lbl">Habilidades Blandas</div>
        <div class="pills">
          ${soft.map((s) => `<span class="pill p-soft">${esc(s.name)}</span>`).join('')}
        </div>
      </div>`
    : '';

  return `
<section id="skills" class="section">
  <h2 class="sec-title">
    <div class="sec-icon">${IC.code}</div>Habilidades
  </h2>
  <div class="skills-block">
    ${hardGroup}
    ${softGroup}
  </div>
</section>`;
}

function buildFooter(name: string): string {
  const date = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  return `
<footer class="footer">
  Portafolio de <strong>${esc(name)}</strong> &mdash; Generado con <strong>EthosHub</strong> el ${date}
</footer>`;
}

// ── Entry point ───────────────────────────────────────────────────────────────

function buildHtml(p: PublicPortfolio): string {
  const accent = p.accentColor || '#8b5cf6';
  const title = `${esc(p.name)} — Portfolio`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="Portafolio profesional de ${esc(p.name)}${p.professionalTitle ? ' — ' + esc(p.professionalTitle) : ''}" />
  <title>${title}</title>
  <style>${buildStyles(accent)}</style>
</head>
<body>
${buildMobileHeader(p.name)}
${buildSidebar(p)}
<div class="wrap">
  ${buildHero(p)}
  ${buildProjects(p.projects ?? [])}
  ${buildExperience(p.experiences ?? [])}
  ${buildEducation(p.education ?? [])}
  ${buildSkills(p.hardSkills ?? [], p.softSkills ?? [])}
  ${buildFooter(p.name)}
</div>
<script>${buildScripts()}</script>
</body>
</html>`;
}

export function exportPortfolioToHtml(profile: PublicPortfolio): void {
  const html = buildHtml(profile);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `portfolio-${profile.slug || 'ethoshub'}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
