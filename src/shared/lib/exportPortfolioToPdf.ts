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

// ── Inline SVG icons (sin stroke para que no sean gigantes) ───────────────────

const IC = {
  pin:     `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  mail:    `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  globe:   `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  build:   `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="9" width="18" height="13" rx="2"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/></svg>`,
  grad:    `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  code:    `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  folder:  `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  star:    `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  extlink: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
  check:   `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  award:   `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`,
};

// ── CSS optimizado para impresión A4 ──────────────────────────────────────────

function buildPrintStyles(accent: string): string {
  return `
    @page {
      size: A4 portrait;
      margin: 15mm 15mm 15mm 15mm;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    html, body {
      width: 100%;
      background: #ffffff;
      color: #1e293b;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.55;
      word-break: break-word;
      overflow-wrap: anywhere;
    }

    a { color: ${accent}; text-decoration: none; word-break: break-all; }
    img { display: block; max-width: 100%; }

    /* ── HERO ── */
    .hero {
      display: flex;
      gap: 14px;
      align-items: flex-start;
      padding: 16px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      margin-bottom: 14px;
      page-break-inside: avoid;
    }
    .avatar {
      width: 64px; height: 64px;
      border-radius: 50%;
      border: 2px solid ${accent}55;
      object-fit: cover;
      flex-shrink: 0;
    }
    .avatar-ph {
      width: 64px; height: 64px;
      border-radius: 50%;
      border: 2px solid ${accent}55;
      background: ${accent}18;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; font-weight: 700; color: ${accent};
      flex-shrink: 0;
    }
    .hero-body { flex: 1; min-width: 0; }
    .hero-name { font-size: 1.4rem; font-weight: 700; color: #0f172a; letter-spacing: -.02em; line-height: 1.2; }
    .hero-title { font-size: .85rem; color: ${accent}; font-weight: 600; margin-top: 3px; }
    .hero-bio { font-size: .78rem; color: #475569; margin-top: 7px; line-height: 1.65; }
    .hero-meta { display: flex; flex-wrap: wrap; gap: 8px 16px; margin-top: 9px; }
    .meta-item { display: inline-flex; align-items: center; gap: 4px; font-size: .72rem; color: #64748b; }

    /* ── SECTION ── */
    .section { margin-bottom: 14px; page-break-inside: avoid; }
    .sec-title {
      display: flex; align-items: center; gap: 6px;
      font-size: .78rem; font-weight: 700; color: #0f172a;
      text-transform: uppercase; letter-spacing: .07em;
      margin-bottom: 9px; padding-bottom: 6px;
      border-bottom: 2px solid ${accent}30;
    }
    .sec-icon {
      width: 18px; height: 18px;
      display: flex; align-items: center; justify-content: center;
      color: ${accent};
    }
    .sec-count { margin-left: auto; font-size: .65rem; font-weight: 400; color: #94a3b8; text-transform: none; letter-spacing: 0; }

    /* ── PROYECTOS ── */
    .proj-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .proj-card {
      background: #f8fafc; border: 1px solid #e2e8f0;
      border-radius: 8px; overflow: hidden;
      display: flex; flex-direction: column;
      page-break-inside: avoid;
    }
    .proj-thumb { width: 100%; height: 80px; object-fit: cover; display: block; }
    .proj-thumb-ph {
      width: 100%; height: 50px;
      background: ${accent}0f;
      display: flex; align-items: center; justify-content: center;
      color: ${accent}60;
    }
    .proj-body { padding: 8px; flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .proj-hdr { display: flex; align-items: flex-start; justify-content: space-between; gap: 5px; }
    .proj-title { font-size: .78rem; font-weight: 600; color: #0f172a; line-height: 1.3; word-break: break-word; }
    .feat-badge {
      flex-shrink: 0;
      background: #fef3c7; border: 1px solid #fcd34d;
      border-radius: 3px; padding: 1px 5px;
      font-size: .58rem; font-weight: 700; color: #92400e;
      display: inline-flex; align-items: center; gap: 2px;
      white-space: nowrap;
    }
    .proj-meta { font-size: .65rem; color: #94a3b8; display: flex; align-items: center; gap: 4px; }
    .status-dot { width: 5px; height: 5px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
    .dot-z { background: #71717a; } .dot-a { background: #f59e0b; }
    .dot-g { background: #10b981; } .dot-arc { background: #52525b; }
    .proj-desc { font-size: .7rem; color: #475569; line-height: 1.55; word-break: break-word; }
    .proj-tech { display: flex; flex-wrap: wrap; gap: 3px; }
    .t-pill { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 3px; padding: 1px 5px; font-size: .6rem; color: #64748b; }
    .proj-footer { padding-top: 5px; border-top: 1px solid #e2e8f0; margin-top: auto; }
    .proj-link { display: inline-flex; align-items: center; gap: 3px; font-size: .65rem; color: ${accent}; }
    .results-box {
      margin-top: 4px; background: #f0fdf4; border: 1px solid #bbf7d0;
      border-radius: 5px; padding: 4px 7px;
    }
    .results-lbl { font-size: .58rem; font-weight: 700; color: #15803d; text-transform: uppercase; letter-spacing: .06em; }
    .results-txt { font-size: .67rem; color: #166534; word-break: break-word; }

    /* ── EXPERIENCIA ── */
    .exp-list { display: flex; flex-direction: column; gap: 7px; }
    .exp-card {
      background: #f8fafc; border: 1px solid #e2e8f0;
      border-radius: 8px; padding: 9px;
      display: flex; gap: 9px; align-items: flex-start;
      page-break-inside: avoid;
    }
    .exp-logo {
      width: 32px; height: 32px; border-radius: 6px;
      border: 1px solid #e2e8f0; object-fit: contain; flex-shrink: 0; padding: 2px;
    }
    .exp-logo-ph {
      width: 32px; height: 32px; border-radius: 6px;
      border: 1px solid #e2e8f0; background: #f1f5f9;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; color: #94a3b8;
    }
    .exp-body { flex: 1; min-width: 0; overflow: hidden; }
    .exp-job { font-size: .8rem; font-weight: 600; color: #0f172a; word-break: break-word; }
    .exp-company { font-size: .72rem; color: ${accent}; font-weight: 500; word-break: break-word; }
    .exp-period { font-size: .65rem; color: #64748b; margin-top: 2px; }
    .exp-desc { font-size: .7rem; color: #475569; margin-top: 4px; line-height: 1.6; word-break: break-word; }
    .badge-current {
      display: inline-flex; align-items: center; gap: 3px;
      font-size: .6rem; background: #d1fae5; border: 1px solid #6ee7b7;
      border-radius: 3px; padding: 1px 5px; color: #059669; margin-top: 3px;
    }

    /* ── EDUCACIÓN ── */
    .edu-list { display: flex; flex-direction: column; gap: 7px; }
    .edu-card {
      background: #f8fafc; border: 1px solid #e2e8f0;
      border-radius: 8px; padding: 9px;
      page-break-inside: avoid;
    }
    .edu-row { display: flex; align-items: flex-start; gap: 9px; }
    .edu-logo {
      width: 30px; height: 30px; border-radius: 5px;
      border: 1px solid #e2e8f0; object-fit: contain; flex-shrink: 0; padding: 2px;
    }
    .edu-logo-ph {
      width: 30px; height: 30px; border-radius: 5px;
      border: 1px solid #e2e8f0; background: #f1f5f9;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; color: #94a3b8;
    }
    .edu-body { flex: 1; min-width: 0; overflow: hidden; }
    .edu-degree { font-size: .8rem; font-weight: 600; color: #0f172a; word-break: break-word; }
    .edu-inst { font-size: .72rem; color: ${accent}; font-weight: 500; word-break: break-word; }
    .edu-period { font-size: .65rem; color: #64748b; margin-top: 2px; }
    .badge-progress {
      display: inline-flex; align-items: center; gap: 3px;
      font-size: .6rem; background: ${accent}12; border: 1px solid ${accent}30;
      border-radius: 3px; padding: 1px 5px; color: ${accent}; margin-top: 3px;
    }
    .cred-link { display: inline-flex; align-items: center; gap: 3px; font-size: .65rem; color: ${accent}; margin-top: 4px; }

    /* ── HABILIDADES ── */
    .skills-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .skill-group-lbl { font-size: .62rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #94a3b8; margin-bottom: 6px; }
    .pills { display: flex; flex-wrap: wrap; gap: 4px; }
    .pill {
      display: inline-flex; align-items: center; gap: 3px;
      border-radius: 99px; padding: 2px 8px;
      font-size: .68rem; font-weight: 500;
      border: 1px solid #e2e8f0; background: #f8fafc; color: #475569;
    }
    .pill-lvl { opacity: .55; font-size: .58rem; }
    .p-j { background: #d1fae5; border-color: #6ee7b7; color: #065f46; }
    .p-m { background: #dbeafe; border-color: #93c5fd; color: #1d4ed8; }
    .p-s { background: ${accent}15; border-color: ${accent}40; color: ${accent}; }
    .p-soft { background: #ffe4e6; border-color: #fda4af; color: #be123c; }

    /* ── FOOTER ── */
    .footer {
      text-align: center; padding: 12px 0 0;
      color: #94a3b8; font-size: .65rem;
      border-top: 1px solid #e2e8f0; margin-top: 6px;
    }
    .footer strong { color: #64748b; }

    /* ── Print-only tweaks ── */
    @media print {
      html, body { font-size: 10.5px; }
      .section { page-break-inside: avoid; }
      .proj-card, .exp-card, .edu-card { page-break-inside: avoid; }
    }
  `;
}

// ── Status helpers ─────────────────────────────────────────────────────────────

function statusDot(status: string): string {
  const cls: Record<string, string> = { draft: 'dot-z', in_progress: 'dot-a', completed: 'dot-g', archived: 'dot-arc' };
  const lbl: Record<string, string> = { draft: 'Borrador', in_progress: 'En progreso', completed: 'Completado', archived: 'Archivado' };
  return `<span class="status-dot ${cls[status] ?? 'dot-z'}"></span>${lbl[status] ?? esc(status)}`;
}

// ── Section builders ───────────────────────────────────────────────────────────

function buildHero(p: PublicPortfolio): string {
  const initials = p.name.split(' ').map(w => w[0] ?? '').slice(0, 2).join('').toUpperCase();
  const avatar = p.photoUrl
    ? `<img class="avatar" src="${esc(p.photoUrl)}" alt="${esc(p.name)}" crossorigin="anonymous" />`
    : `<div class="avatar-ph">${esc(initials || '?')}</div>`;

  const meta: string[] = [];
  if (p.location) meta.push(`<span class="meta-item">${IC.pin} ${esc(p.location)}</span>`);
  if (p.email)    meta.push(`<span class="meta-item">${IC.mail} ${esc(p.email)}</span>`);
  if (p.website)  meta.push(`<span class="meta-item">${IC.globe} ${esc(p.website)}</span>`);

  return `
<div class="hero">
  ${avatar}
  <div class="hero-body">
    <div class="hero-name">${esc(p.name)}</div>
    ${p.professionalTitle ? `<div class="hero-title">${esc(p.professionalTitle)}</div>` : ''}
    ${p.bio ? `<div class="hero-bio">${esc(p.bio)}</div>` : ''}
    ${meta.length ? `<div class="hero-meta">${meta.join('')}</div>` : ''}
  </div>
</div>`;
}

function buildProjects(items: PublicProject[]): string {
  if (!items?.length) return '';
  const cards = items.map(p => {
    const thumb = p.thumbnail
      ? `<img class="proj-thumb" src="${esc(p.thumbnail)}" alt="${esc(p.title)}" crossorigin="anonymous" />`
      : `<div class="proj-thumb-ph">${IC.folder}</div>`;
    const techs = p.technologies?.length
      ? `<div class="proj-tech">${p.technologies.map(t => `<span class="t-pill">${esc(t)}</span>`).join('')}</div>` : '';
    const repo = p.repositoryUrl
      ? `<div class="proj-footer"><a class="proj-link" href="${esc(p.repositoryUrl)}">${IC.extlink} ${esc(p.repositoryUrl)}</a></div>` : '';
    const feat = p.isFeatured ? `<span class="feat-badge">${IC.star} Destacado</span>` : '';
    const results = p.results
      ? `<div class="results-box"><div class="results-lbl">Resultado</div><div class="results-txt">${esc(p.results)}</div></div>` : '';
    return `
<div class="proj-card">
  ${thumb}
  <div class="proj-body">
    <div class="proj-hdr"><div class="proj-title">${esc(p.title)}</div>${feat}</div>
    <div class="proj-meta">${statusDot(p.status)}&nbsp;&middot;&nbsp;${esc(p.category)}</div>
    ${p.description ? `<div class="proj-desc">${esc(p.description)}</div>` : ''}
    ${techs}${results}${repo}
  </div>
</div>`;
  });
  return `
<div class="section">
  <div class="sec-title">
    <span class="sec-icon">${IC.folder}</span> Proyectos
    <span class="sec-count">${items.length} proyecto${items.length !== 1 ? 's' : ''}</span>
  </div>
  <div class="proj-grid">${cards.join('')}</div>
</div>`;
}

function buildExperience(items: PublicExperience[]): string {
  if (!items?.length) return '';
  const cards = items.map(e => {
    const logo = e.logoUrl
      ? `<img class="exp-logo" src="${esc(e.logoUrl)}" alt="${esc(e.companyName)}" crossorigin="anonymous" />`
      : `<div class="exp-logo-ph">${IC.build}</div>`;
    return `
<div class="exp-card">
  ${logo}
  <div class="exp-body">
    <div class="exp-job">${esc(e.jobTitle)}</div>
    <div class="exp-company">${esc(e.companyName)}</div>
    <div class="exp-period">${period(e.startDate, e.endDate, e.isCurrent)}</div>
    ${e.description ? `<div class="exp-desc">${esc(e.description)}</div>` : ''}
    ${e.isCurrent ? `<div class="badge-current">${IC.check} Actualmente aquí</div>` : ''}
  </div>
</div>`;
  });
  return `
<div class="section">
  <div class="sec-title">
    <span class="sec-icon">${IC.build}</span> Experiencia Laboral
    <span class="sec-count">${items.length} posición${items.length !== 1 ? 'es' : ''}</span>
  </div>
  <div class="exp-list">${cards.join('')}</div>
</div>`;
}

function buildEducation(items: PublicEducation[]): string {
  if (!items?.length) return '';
  const cards = items.map(e => {
    const logo = e.logoUrl
      ? `<img class="edu-logo" src="${esc(e.logoUrl)}" alt="${esc(e.institution)}" crossorigin="anonymous" />`
      : `<div class="edu-logo-ph">${IC.grad}</div>`;
    const degree = [e.degree, e.fieldOfStudy].filter(Boolean).join(' en ');
    const cred = e.credentialUrl
      ? `<a class="cred-link" href="${esc(e.credentialUrl)}">${IC.award} Ver credencial</a>` : '';
    return `
<div class="edu-card">
  <div class="edu-row">
    ${logo}
    <div class="edu-body">
      <div class="edu-degree">${esc(degree)}</div>
      <div class="edu-inst">${esc(e.institution)}</div>
      <div class="edu-period">${period(e.startDate, e.endDate, e.inProgress)}</div>
      ${e.inProgress ? `<div class="badge-progress">${IC.check} En curso</div>` : ''}
      ${cred}
    </div>
  </div>
</div>`;
  });
  return `
<div class="section">
  <div class="sec-title">
    <span class="sec-icon">${IC.grad}</span> Educación
    <span class="sec-count">${items.length} registro${items.length !== 1 ? 's' : ''}</span>
  </div>
  <div class="edu-list">${cards.join('')}</div>
</div>`;
}

function buildSkills(hard: PublicHardSkill[], soft: PublicSoftSkill[]): string {
  if (!hard?.length && !soft?.length) return '';
  const lvlCls: Record<string, string> = { Junior: 'p-j', Mid: 'p-m', Senior: 'p-s' };
  const hardHtml = hard?.length
    ? `<div>
        <div class="skill-group-lbl">Habilidades Técnicas</div>
        <div class="pills">${hard.map(s => {
          const cls = lvlCls[s.level ?? ''] ?? '';
          return `<span class="pill ${cls}">${esc(s.name)}${s.level ? `<span class="pill-lvl"> · ${esc(s.level)}</span>` : ''}</span>`;
        }).join('')}</div>
      </div>` : '';
  const softHtml = soft?.length
    ? `<div>
        <div class="skill-group-lbl">Habilidades Blandas</div>
        <div class="pills">${soft.map(s => `<span class="pill p-soft">${esc(s.name)}</span>`).join('')}</div>
      </div>` : '';
  return `
<div class="section">
  <div class="sec-title"><span class="sec-icon">${IC.code}</span> Habilidades</div>
  <div class="skills-grid">${hardHtml}${softHtml}</div>
</div>`;
}

function buildFooter(name: string): string {
  const date = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  return `<div class="footer">Portafolio de <strong>${esc(name)}</strong> &mdash; Generado con <strong>EthosHub</strong> el ${date}</div>`;
}

// ── HTML completo ──────────────────────────────────────────────────────────────

function buildPrintHtml(p: PublicPortfolio): string {
  const accent = p.accentColor || '#8b5cf6';
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${esc(p.name)} — Portafolio</title>
  <style>${buildPrintStyles(accent)}</style>
</head>
<body>
  ${buildHero(p)}
  ${buildProjects(p.projects ?? [])}
  ${buildExperience(p.experiences ?? [])}
  ${buildEducation(p.education ?? [])}
  ${buildSkills(p.hardSkills ?? [], p.softSkills ?? [])}
  ${buildFooter(p.name)}
</body>
</html>`;
}

// ── Exportador principal — usa window.print() vía iframe oculto ───────────────

export async function exportPortfolioToPdf(profile: PublicPortfolio): Promise<void> {
  const html = buildPrintHtml(profile);

  // Iframe oculto fuera del viewport
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;';
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc) throw new Error('No se pudo acceder al iframe');

    doc.open();
    doc.write(html);
    doc.close();

    // Esperar imágenes
    await new Promise<void>((resolve) => {
      const imgs = Array.from(doc.querySelectorAll<HTMLImageElement>('img'));
      if (!imgs.length) { resolve(); return; }
      let pending = imgs.length;
      const done = () => { if (--pending === 0) resolve(); };
      imgs.forEach(img => { if (img.complete) done(); else { img.onload = done; img.onerror = done; } });
      setTimeout(resolve, 4000);
    });

    // Pequeña pausa para que el navegador termine de renderizar
    await new Promise(r => setTimeout(r, 120));

    iframe.contentWindow?.print();

    // Limpiar tras el diálogo de impresión
    await new Promise(r => setTimeout(r, 1500));
  } finally {
    document.body.removeChild(iframe);
  }
}
