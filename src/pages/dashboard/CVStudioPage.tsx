import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  Sparkles,
  ChevronDown,
  X,
  Copy,
  Check,
  Send,
  Loader2,
  FileCode2,
  FileType,
  Wand2,
  ZoomIn,
  Save,
  Pencil,
  Trash2,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useUiStore } from '@/store';
import { EthosOwlMascot } from '@/components/brand/EthosCoreLogo';

// ── Types ─────────────────────────────────────────────────────────────────────

type EditorMode = 'markdown' | 'latex';

type Template = {
  id: string;
  title: string;
  description: string;

  code: string;
};

// ── Templates ─────────────────────────────────────────────────────────────────

const markdownTemplates: Template[] = [
  {
    id: 'md-classic',
    title: 'Clásico',
    description: 'Estructura limpia y directa',

    code: `# Tu Nombre
**Email:** tu@email.com · **LinkedIn:** linkedin.com/in/tu-perfil · **GitHub:** github.com/tu-usuario

---

## Resumen
Profesional apasionado por el desarrollo de software con X años de experiencia construyendo productos escalables.

## Experiencia

### Senior Software Engineer — Empresa Inc.
*Enero 2022 – Presente*
- Lideré la migración de arquitectura monolítica a microservicios reduciendo latencia un 40%
- Diseñé e implementé pipelines de CI/CD que redujeron el tiempo de deploy en un 60%

### Software Engineer — Startup SL
*Marzo 2020 – Diciembre 2021*
- Desarrollé APIs REST con Node.js y TypeScript para un sistema con 50K usuarios activos

## Habilidades
**Lenguajes:** TypeScript, Python, Go
**Frameworks:** React, Node.js, FastAPI
**Infra:** Docker, Kubernetes, AWS

## Educación
**Grado en Ingeniería Informática** — Universidad Politécnica, 2019
`,
  },
  {
    id: 'md-tech',
    title: 'Tech Focus',
    description: 'Orientado a stacks y proyectos',

    code: `# Tu Nombre
\`tu@email.com\` · \`github.com/tu-usuario\` · \`linkedin.com/in/tu-perfil\`

---

## Stack Principal
\`\`\`
Frontend  → React · Next.js · TypeScript · Tailwind CSS
Backend   → Node.js · FastAPI · PostgreSQL · Redis
DevOps    → Docker · GitHub Actions · Vercel · AWS EC2
\`\`\`

## Proyectos Destacados

### 🚀 Proyecto Alpha
**Tech:** React + FastAPI + PostgreSQL
Plataforma SaaS con 1.2K usuarios activos. Integré pagos con Stripe y autenticación OAuth2.

### 🛠 Proyecto Beta
**Tech:** Next.js + Prisma + Supabase
Dashboard analítico en tiempo real con WebSockets y visualizaciones D3.js.

## Experiencia
**Senior Dev @ Empresa** · 2022–Presente
**Full Stack Dev @ Startup** · 2020–2022

## Educación
**Ingeniería Informática** · Universidad · 2019
`,
  },
  {
    id: 'md-minimal',
    title: 'Minimalista',
    description: 'Máximo impacto, mínimo ruido',

    code: `# Tu Nombre

tu@email.com · github.com/tu-usuario

---

Engineer con foco en productos que escalan. 5 años construyendo sistemas distribuidos.

**Ahora mismo:** Senior SWE en Empresa Inc., liderando el equipo de plataforma.

---

**Experiencia**

Empresa Inc. — Senior SWE (2022–)
Startup SL — Full Stack (2020–2022)
Freelance — Dev (2018–2020)

---

**Tech que domino**

React · TypeScript · Node.js · PostgreSQL · Docker · AWS

---

**Educación**

Ingeniería Informática, Universidad Politécnica (2019)
`,
  },
];

const latexTemplates: Template[] = [
  {
    id: 'tex-modern',
    title: 'Moderno',
    description: 'tcolorbox + columnas',

    code: `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=1.5cm]{geometry}
\\usepackage{xcolor}
\\usepackage{tcolorbox}
\\usepackage{fontawesome5}
\\usepackage{hyperref}
\\usepackage{titlesec}
\\usepackage{multicol}

\\definecolor{primary}{HTML}{6D28D9}
\\definecolor{light}{HTML}{F5F3FF}

\\tcbuselibrary{skins}
\\newtcolorbox{cvblock}[1]{
  enhanced, arc=6pt,
  colback=light, colframe=primary,
  boxrule=1pt, leftrule=4pt,
  title=#1, fonttitle=\\bfseries\\color{primary},
  attach boxed title to top left={yshift=-2mm,xshift=4mm},
  boxed title style={colback=white,colframe=primary}
}

\\begin{document}
\\pagestyle{empty}

% Header
{\\huge\\bfseries Tu Nombre}\\hfill
{\\color{primary}\\faEnvelope}~tu@email.com ·
{\\color{primary}\\faLinkedin}~linkedin.com/in/tu-perfil

\\vspace{4pt}
\\hrule height 2pt
\\vspace{10pt}

\\begin{cvblock}{Experiencia Profesional}
\\textbf{Senior Software Engineer} — Empresa Inc. \\hfill \\textit{2022–Presente}\\\\
Lideré migración a microservicios. Reduje latencia 40\\%.\\\\[4pt]
\\textbf{Software Engineer} — Startup SL \\hfill \\textit{2020–2022}\\\\
Desarrollé APIs REST para sistema con 50K usuarios activos.
\\end{cvblock}

\\vspace{6pt}

\\begin{multicols}{2}
\\begin{cvblock}{Habilidades}
TypeScript · Python · Go\\\\
React · Node.js · FastAPI\\\\
Docker · Kubernetes · AWS
\\end{cvblock}

\\columnbreak

\\begin{cvblock}{Educación}
\\textbf{Ingeniería Informática}\\\\
Universidad Politécnica\\\\
\\textit{2015–2019}
\\end{cvblock}
\\end{multicols}

\\end{document}
`,
  },
  {
    id: 'tex-academic',
    title: 'Académico',
    description: 'Estilo APA / investigación',

    code: `\\documentclass[12pt,a4paper]{article}
\\usepackage[margin=2cm]{geometry}
\\usepackage{xcolor,titlesec,enumitem,hyperref,parskip}

\\definecolor{accent}{HTML}{1D4ED8}

\\titleformat{\\section}{\\large\\bfseries\\color{accent}}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{12pt}{6pt}

\\hypersetup{colorlinks=true, urlcolor=accent, linkcolor=accent}

\\begin{document}
\\thispagestyle{empty}

\\begin{center}
  {\\LARGE\\bfseries Tu Nombre}\\\\[4pt]
  {\\small tu@email.com $\\cdot$ +34 600 000 000 $\\cdot$ Madrid, España}\\\\
  {\\small \\href{https://github.com/tu-usuario}{github.com/tu-usuario} $\\cdot$
   \\href{https://linkedin.com/in/tu-perfil}{LinkedIn}}
\\end{center}

\\section{Resumen}
Investigador y desarrollador con experiencia en aprendizaje automático y sistemas distribuidos.
Publicaciones en conferencias internacionales (NeurIPS, ICML).

\\section{Experiencia}
\\textbf{Investigador Asociado} --- Universidad Politécnica \\hfill 2022--Presente
\\begin{itemize}[leftmargin=*,nosep]
  \\item Diseño de modelos de deep learning para NLP con PyTorch
  \\item Co-autor de 3 papers publicados en Q1
\\end{itemize}

\\section{Publicaciones}
\\begin{enumerate}[leftmargin=*]
  \\item Apellido, N. et al. (2024). \\textit{Título del Paper}. NeurIPS 2024.
\\end{enumerate}

\\section{Educación}
\\textbf{Doctorado en Ciencias de la Computación} --- Universidad, 2019--2023\\\\
\\textbf{Máster en IA} --- Universidad, 2017--2019

\\section{Habilidades}
Python · PyTorch · TensorFlow · SQL · R · \\LaTeX

\\end{document}
`,
  },
  {
    id: 'tex-compact',
    title: 'Compacto',
    description: 'Una página, alta densidad',

    code: `\\documentclass[9pt,a4paper]{extarticle}
\\usepackage[margin=1cm]{geometry}
\\usepackage{xcolor,multicol,titlesec,enumitem}

\\definecolor{accent}{HTML}{0F172A}
\\definecolor{muted}{HTML}{64748B}

\\titleformat{\\section}{\\normalsize\\bfseries\\color{accent}}{}{0em}{}[{\\color{muted}\\hrule}]
\\titlespacing{\\section}{0pt}{8pt}{3pt}
\\setlist[itemize]{leftmargin=*,nosep,topsep=2pt}

\\begin{document}
\\pagestyle{empty}

{\\Large\\bfseries Tu Nombre} \\hfill
{\\small\\color{muted} tu@email.com · github.com/tu · linkedin.com/in/tu}

\\vspace{4pt}

\\begin{multicols}{2}

\\section{Experiencia}
\\textbf{Senior Dev} — Empresa Inc. \\hfill {\\tiny 2022–}
\\begin{itemize}
  \\item Microservicios, -40\\% latencia
  \\item CI/CD, -60\\% deploy time
\\end{itemize}

\\textbf{Full Stack} — Startup SL \\hfill {\\tiny 2020–22}
\\begin{itemize}
  \\item APIs Node.js, 50K usuarios
\\end{itemize}

\\section{Educación}
\\textbf{Ing. Informática}\\\\
Universidad Politécnica, 2019

\\columnbreak

\\section{Habilidades}
TypeScript · Python · Go\\\\
React · Node.js · FastAPI\\\\
Docker · K8s · AWS · GCP

\\section{Proyectos}
\\textbf{Proyecto Alpha} — SaaS, 1.2K usuarios\\\\
\\textbf{Proyecto Beta} — Dashboard tiempo real

\\section{Idiomas}
Español (nativo) · Inglés (C1)

\\end{multicols}

\\end{document}
`,
  },
];

// ── Export options ─────────────────────────────────────────────────────────────

const exportOptions = [
  { id: 'pdf',      label: 'Exportar PDF',      icon: FileType,  desc: 'Listo para enviar' },
  { id: 'markdown', label: 'Exportar Markdown',  icon: FileText,  desc: 'Formato .md' },
  { id: 'latex',    label: 'Exportar LaTeX',     icon: FileCode2, desc: 'Fuente .tex' },
  { id: 'txt',      label: 'Exportar TXT',       icon: FileText,  desc: 'Texto plano' },
];

const exportFormatLabel: Record<string, string> = {
  pdf: 'PDF', markdown: 'Markdown', latex: 'LaTeX', txt: 'TXT',
};

// ── Mock AI responses ─────────────────────────────────────────────────────────

const mockAiResponses: Record<string, string> = {
  default: `He mejorado tu CV con los siguientes cambios:

• **Métricas cuantificables** añadidas en cada punto de experiencia
• **Keywords ATS** optimizadas para tu sector
• **Resumen ejecutivo** reescrito con foco en impacto
• Eliminé redundancias y fortalecí verbos de acción

El código ha sido inyectado en el editor. Revisa y ajusta según tu criterio.`,
};

// ── Zoom levels ───────────────────────────────────────────────────────────────

const ZOOM_LEVELS = [25, 50, 75, 100, 125, 150];

// ── Main component ────────────────────────────────────────────────────────────

export default function CVStudioPage() {
  const { resolvedTheme } = useUiStore();
  const isDark = resolvedTheme === 'dark';

  // Editor state
  const [mode, setMode] = useState<EditorMode>('markdown');
  const [editorContent, setEditorContent] = useState(markdownTemplates[0].code);
  const [activeTemplateId, setActiveTemplateId] = useState(markdownTemplates[0].id);

  // UI toggles
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Toolbar state
  const [copied, setCopied] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(100);

  // Export loading modal
  const [showExportLoading, setShowExportLoading] = useState(false);
  const [exportLoadingType, setExportLoadingType] = useState('');

  // AI assistant state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  const exportRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<HTMLDivElement>(null);

  const templates = mode === 'markdown' ? markdownTemplates : latexTemplates;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleModeSwitch = (newMode: EditorMode) => {
    setMode(newMode);
    setShowModeDropdown(false);
    const defaultTemplate = newMode === 'markdown' ? markdownTemplates[0] : latexTemplates[0];
    setEditorContent(defaultTemplate.code);
    setActiveTemplateId(defaultTemplate.id);
  };

  const handleTemplateClick = (template: Template) => {
    setEditorContent(template.code);
    setActiveTemplateId(template.id);
  };

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(editorContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [editorContent]);

  const handleSaveToProfile = useCallback(() => {
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2200);
  }, []);

  const triggerDownload = useCallback((type: string, content: string) => {
    const ext = type === 'markdown' ? 'md' : type === 'latex' ? 'tex' : type;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cv.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleExportStart = (type: string) => {
    const contentSnapshot = editorContent;
    setShowExportMenu(false);
    setExportLoadingType(type);
    setShowExportLoading(true);
    setTimeout(() => {
      triggerDownload(type, contentSnapshot);
      setShowExportLoading(false);
      setExportLoadingType('');
    }, 3000);
  };

  const handleAiSubmit = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiResponse('');
    await new Promise(r => setTimeout(r, 1800));
    setAiResponse(mockAiResponses.default);
    setAiLoading(false);
    const aiNote = mode === 'markdown'
      ? `\n\n<!-- ✨ Optimizado por Asistente IA -->\n`
      : `\n% ✨ Optimizado por Asistente IA\n`;
    setEditorContent(prev => prev + aiNote);
  };

  const lineCount = editorContent.split('\n').length;
  const charCount = editorContent.length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    // Root: on lg+ fixed height locks the split pane; content scrolls inside panels.
    <div className="flex flex-col -mx-4 -my-6 sm:-mx-6 lg:-mx-8 lg:h-[calc(100vh-3.5rem)] lg:overflow-hidden">

      {/* ── Header Card — Experience-style premium card ─────────────────────── */}
      <div className={cn(
        'relative rounded-3xl border border-border bg-card',
        'px-6 py-8 sm:px-8 sm:py-10',
        'mx-4 sm:mx-6 lg:mx-8 mt-4 sm:mt-5 mb-3 shrink-0',
      )}>
        {/* Dual radial gradients — identical to ExperiencePage */}
        <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_80%_50%_at_0%_0%,_hsl(var(--primary)/0.12)_0%,_transparent_100%)]" />
        <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_40%_60%_at_100%_100%,_hsl(var(--primary)/0.06)_0%,_transparent_100%)]" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

          {/* Left: badge + title + subtitle */}
          <div className="space-y-3 max-w-lg">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              Herramienta de Perfil
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Currículum Vitae Estudio.
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Crea y exporta tu currículum en Markdown o LaTeX con asistencia IA.
            </p>
          </div>

          {/* Right: two logical control groups */}
          <div className="flex flex-col gap-3 lg:items-end">

            {/* Group 1 — Editor tools */}
            <div className="flex flex-row flex-wrap items-center gap-2">

              {/* Mode combobox */}
              <div className="relative" ref={modeRef}>
                <button
                  onClick={() => setShowModeDropdown(v => !v)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all',
                    'border-border hover:border-violet-500/40 hover:bg-violet-500/5',
                    showModeDropdown && 'border-violet-500/40 bg-violet-500/5'
                  )}
                >
                  {mode === 'markdown'
                    ? <><FileText className="h-3.5 w-3.5 text-violet-400" /> Markdown</>
                    : <><FileCode2 className="h-3.5 w-3.5 text-violet-400" /> LaTeX</>
                  }
                  <ChevronDown className={cn(
                    'h-3 w-3 text-muted-foreground transition-transform',
                    showModeDropdown && 'rotate-180'
                  )} />
                </button>

                <AnimatePresence>
                  {showModeDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className={cn(
                        'absolute left-0 top-[calc(100%+6px)] z-[60] w-44 rounded-xl border border-border p-1 shadow-xl',
                        isDark ? 'bg-zinc-900' : 'bg-white'
                      )}
                    >
                      {(['markdown', 'latex'] as EditorMode[]).map(m => (
                        <button
                          key={m}
                          onClick={() => handleModeSwitch(m)}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                            mode === m
                              ? 'bg-violet-500/10 text-violet-600 dark:text-violet-300'
                              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                          )}
                        >
                          {m === 'markdown'
                            ? <FileText className="h-3.5 w-3.5" />
                            : <FileCode2 className="h-3.5 w-3.5" />
                          }
                          {m === 'markdown' ? 'Markdown' : 'LaTeX'}
                          {mode === m && <Check className="ml-auto h-3 w-3" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Copy */}
              <button
                onClick={handleCopy}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Copiar código"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {copied ? (
                    <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    </motion.span>
                  ) : (
                    <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Copy className="h-3.5 w-3.5" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* AI Assistant */}
              <button
                onClick={() => setShowAiModal(true)}
                className={cn(
                  'flex items-center gap-1.5 h-9 rounded-xl px-3.5 text-xs font-medium transition-all',
                  'bg-gradient-to-r from-violet-600 to-violet-500 text-white',
                  'hover:from-violet-500 hover:to-violet-400 shadow-sm hover:shadow-violet-500/25'
                )}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Asistente IA
              </button>

              {/* Export */}
              <div className="relative" ref={exportRef}>
                <button
                  disabled={showExportLoading}
                  onClick={() => !showExportLoading && setShowExportMenu(v => !v)}
                  className={cn(
                    'flex items-center gap-1.5 h-9 rounded-xl border px-3.5 text-xs font-medium transition-all',
                    'border-border hover:border-violet-500/30 hover:bg-accent',
                    showExportMenu && 'border-violet-500/30 bg-accent',
                    showExportLoading && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <Download className="h-3.5 w-3.5" />
                  Exportar
                  <ChevronDown className={cn(
                    'h-3 w-3 text-muted-foreground transition-transform',
                    showExportMenu && 'rotate-180'
                  )} />
                </button>

                <AnimatePresence>
                  {showExportMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className={cn(
                        'absolute right-0 top-[calc(100%+6px)] z-[60] w-52 rounded-xl border border-border p-1.5 shadow-2xl',
                        isDark ? 'bg-zinc-900 shadow-black/50' : 'bg-white shadow-black/10'
                      )}
                    >
                      <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Formato</p>
                      {exportOptions.map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => handleExportStart(opt.id)}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm hover:bg-accent transition-colors group"
                        >
                          <opt.icon className="h-4 w-4 text-muted-foreground group-hover:text-violet-500 transition-colors shrink-0" />
                          <div className="text-left min-w-0">
                            <p className="text-xs font-medium text-foreground">{opt.label}</p>
                            <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Visual separator between groups */}
            <div className="h-px bg-border/60 w-full" />

            {/* Group 2 — Profile management */}
            <div className="flex flex-row flex-wrap items-center gap-2">

              {/* Guardar en el perfil */}
              <button
                onClick={handleSaveToProfile}
                className={cn(
                  'flex items-center gap-1.5 h-9 rounded-xl px-3.5 text-xs font-semibold transition-all duration-200',
                  profileSaved
                    ? 'border border-green-500/30 bg-green-500/8 text-green-600 dark:text-green-400'
                    : 'bg-violet-600 text-white hover:bg-violet-500 shadow-sm hover:shadow-violet-500/20'
                )}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {profileSaved ? (
                    <motion.span key="saved-check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Check className="h-3.5 w-3.5" />
                    </motion.span>
                  ) : (
                    <motion.span key="save-icon" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Save className="h-3.5 w-3.5" />
                    </motion.span>
                  )}
                </AnimatePresence>
                {profileSaved ? 'Guardado' : 'Guardar en el perfil'}
              </button>

              {/* Editar */}
              <button
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-accent hover:border-violet-500/30 transition-all"
                title="Editar"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>

              {/* Eliminar */}
              <button
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/5 hover:border-destructive/30 transition-all"
                title="Eliminar"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Template strip ─────────────────────────────────────────────────────── */}
      <motion.div
        layout
        className="shrink-0 px-4 sm:px-6 lg:px-8 py-2.5 bg-card/50"
      >
        <p className="mb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Plantillas {mode === 'markdown' ? 'Markdown' : 'LaTeX'}
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <AnimatePresence mode="popLayout">
            {templates.map((tpl, i) => (
              <motion.button
                key={tpl.id}
                layout
                initial={{ opacity: 0, scale: 0.9, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: -10 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30, delay: i * 0.04 }}
                onClick={() => handleTemplateClick(tpl)}
                className={cn(
                  'flex shrink-0 w-32 flex-col gap-1 rounded-xl border p-2.5 text-left transition-all',
                  'hover:border-violet-500/40 hover:shadow-sm',
                  activeTemplateId === tpl.id
                    ? 'border-violet-500/50 bg-violet-500/8 shadow-sm shadow-violet-500/10'
                    : 'border-border bg-background hover:bg-accent/50'
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <p className={cn(
                    'text-xs font-semibold leading-none',
                    activeTemplateId === tpl.id ? 'text-violet-600 dark:text-violet-300' : 'text-foreground'
                  )}>{tpl.title}</p>
                  {activeTemplateId === tpl.id && (
                    <motion.div
                      layoutId="template-active-dot"
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500"
                    />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">{tpl.description}</p>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Editor — full width with floating minimap ────────────────────────── */}
      <div className="flex flex-col flex-1 min-h-[300px] max-h-[65vh] lg:max-h-none lg:min-h-0 mx-4 sm:mx-6 lg:mx-8 mb-4 lg:mb-6 rounded-xl overflow-hidden border border-border">

        {/* Animated violet accent line — horizontal shimmer, mirrors ExperiencePage TimelineLine */}
        <div className="relative h-0.5 w-full overflow-hidden shrink-0 pointer-events-none">
          <div className="absolute inset-0 bg-primary/15" />
          <motion.div
            className="absolute top-0 h-full"
            style={{
              width: '90px',
              background: 'linear-gradient(to right, transparent, hsl(var(--primary) / 0.8) 50%, transparent)',
            }}
            animate={{ left: ['-90px', 'calc(100% + 90px)'] }}
            transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 2.2, ease: 'easeInOut' }}
          />
        </div>

        {/* Editor header */}
        <div className={cn(
          'flex h-9 shrink-0 items-center justify-between px-4 border-b border-border',
          isDark ? 'bg-[#07070B]' : 'bg-muted/20'
        )}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Editor</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreviewModal(true)}
              className="sm:hidden flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:border-violet-500/40 transition-all"
            >
              <ZoomIn className="h-3 w-3" />
              Vista Previa
            </button>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>{lineCount} líneas</span>
              <span>·</span>
              <span>{charCount} chars</span>
            </div>
          </div>
        </div>

        {/* Editor body: textarea + floating minimap */}
        <div className="relative flex-1 min-h-0">
          <textarea
            value={editorContent}
            onChange={e => setEditorContent(e.target.value)}
            wrap="off"
            className={cn(
              'absolute inset-0 resize-none p-4 sm:pr-[196px] font-mono text-xs leading-relaxed outline-none',
              'whitespace-pre overflow-y-auto overflow-x-auto',
              'scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent scrollbar-x-thin',
              isDark
                ? 'bg-[#06060A] text-zinc-200 placeholder:text-zinc-600'
                : 'bg-white text-zinc-800 placeholder:text-zinc-400'
            )}
            spellCheck={false}
            placeholder="Empieza a escribir tu CV o selecciona una plantilla..."
          />

          {/* Minimap — floating panel, sm+ only */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28, delay: 0.1 }}
            className={cn(
              'absolute right-3 top-3 z-10 hidden sm:flex flex-col',
              'w-44 rounded-xl border border-border overflow-hidden',
              isDark
                ? 'bg-zinc-900/95 shadow-2xl shadow-black/50'
                : 'bg-white/95 shadow-xl shadow-black/8',
              'backdrop-blur-sm',
            )}
            style={{ bottom: '14px' }}
          >
            {/* Minimap title bar */}
            <div className={cn(
              'flex h-7 shrink-0 items-center justify-between px-2.5 border-b border-border',
              isDark ? 'bg-zinc-900/60' : 'bg-muted/50'
            )}>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                  Vista Previa
                </span>
                {mode === 'latex' && (
                  <span className="text-[8px] font-medium text-amber-500 shrink-0">· LaTeX</span>
                )}
              </div>
              <button
                onClick={() => setShowPreviewModal(true)}
                className="flex h-5 w-5 shrink-0 ml-1 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Ampliar vista previa"
              >
                <ZoomIn className="h-3 w-3" />
              </button>
            </div>

            {/* Minimap preview — scaled-down, click opens modal */}
            <div
              className="relative flex-1 min-h-0 overflow-hidden cursor-pointer group"
              onClick={() => setShowPreviewModal(true)}
            >
              <div
                style={{
                  transform: 'scale(0.3)',
                  transformOrigin: 'top left',
                  width: '333%',
                  pointerEvents: 'none',
                  padding: '16px',
                }}
              >
                {mode === 'markdown'
                  ? <MarkdownPreview content={editorContent} isDark={isDark} />
                  : <LaTeXPreview content={editorContent} isDark={isDark} />
                }
              </div>

              {/* Hover reveal overlay */}
              <div className={cn(
                'absolute inset-0 flex items-center justify-center',
                'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
                isDark ? 'bg-black/40' : 'bg-white/50'
              )}>
                <div className="flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 backdrop-blur-sm">
                  <ZoomIn className="h-3 w-3 text-white" />
                  <span className="text-[10px] font-medium text-white">Ampliar</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Preview Modal ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPreviewModal && (
          <>
            <motion.div
              className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPreviewModal(false)}
            />
            <motion.div
              className="fixed inset-4 z-[75] flex flex-col rounded-2xl overflow-hidden border border-border shadow-2xl"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              onClick={e => e.stopPropagation()}
              style={{ background: isDark ? 'hsl(var(--card))' : 'hsl(var(--card))' }}
            >
              {/* Modal header */}
              <div className={cn(
                'flex h-11 shrink-0 items-center justify-between px-4 border-b border-border',
                isDark ? 'bg-[#07070B]' : 'bg-muted/20'
              )}>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-foreground">Vista Previa</p>
                  {mode === 'latex' && (
                    <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                      LaTeX — render en compilación
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Zoom segmented control */}
                  <div className={cn(
                    'flex items-center gap-0.5 rounded-lg border border-border p-0.5',
                    isDark ? 'bg-zinc-900/80' : 'bg-muted/40'
                  )}>
                    {ZOOM_LEVELS.map(z => (
                      <button
                        key={z}
                        onClick={() => setPreviewZoom(z)}
                        className={cn(
                          'rounded px-2 py-0.5 text-[11px] font-medium transition-all',
                          previewZoom === z
                            ? 'bg-violet-500 text-white shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        )}
                      >
                        {z}%
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Modal body — full preview at zoom level */}
              <div className={cn(
                'flex-1 min-h-0 overflow-auto',
                'scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent',
                isDark ? 'bg-[#08080D]' : 'bg-white'
              )}>
                <div
                  className="p-8 transition-transform duration-150"
                  style={{
                    transform: `scale(${previewZoom / 100})`,
                    transformOrigin: 'top left',
                    width: `${(10000 / previewZoom).toFixed(2)}%`,
                    minHeight: `${(10000 / previewZoom).toFixed(2)}%`,
                  }}
                >
                  {mode === 'markdown'
                    ? <MarkdownPreview content={editorContent} isDark={isDark} />
                    : <LaTeXPreview content={editorContent} isDark={isDark} />
                  }
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── AI Modal ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAiModal && (
          <>
            <motion.div
              className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAiModal(false)}
            />
            <motion.div
              className="fixed bottom-6 right-6 z-[90] w-full max-w-sm"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <div className={cn(
                'rounded-2xl border border-border shadow-2xl overflow-hidden',
                isDark
                  ? 'bg-zinc-900/95 backdrop-blur-xl shadow-black/60 border-white/8'
                  : 'bg-white/95 backdrop-blur-xl shadow-black/15'
              )}>
                <div className={cn(
                  'flex items-center justify-between px-4 py-3 border-b border-border',
                  isDark ? 'bg-zinc-900' : 'bg-white'
                )}>
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-violet-500">
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground leading-none">Asistente IA</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">CV Studio · Modo {mode}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAiModal(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {['Optimiza para ATS', 'Añade métricas', 'Mejora el tono', 'Traduce al inglés'].map(action => (
                      <button
                        key={action}
                        onClick={() => setAiPrompt(action)}
                        className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-violet-500/40 hover:bg-violet-500/5 transition-all"
                      >
                        {action}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence>
                    {(aiLoading || aiResponse) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={cn(
                          'rounded-xl border border-border p-3',
                          isDark ? 'bg-zinc-800/50' : 'bg-muted/40'
                        )}
                      >
                        {aiLoading ? (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Analizando tu CV...
                          </div>
                        ) : (
                          <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                            <div className="flex items-center gap-1.5 mb-2">
                              <Wand2 className="h-3 w-3 text-violet-500 shrink-0" />
                              <span className="font-semibold text-violet-600 dark:text-violet-300">Resultado</span>
                            </div>
                            {aiResponse}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className={cn(
                    'flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors',
                    'border-border focus-within:border-violet-500/50',
                    isDark ? 'bg-zinc-800/60' : 'bg-muted/30'
                  )}>
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAiSubmit()}
                      placeholder="Ej: Mejora mi experiencia para roles de liderazgo..."
                      className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
                    />
                    <button
                      onClick={handleAiSubmit}
                      disabled={!aiPrompt.trim() || aiLoading}
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-lg transition-all shrink-0',
                        aiPrompt.trim() && !aiLoading
                          ? 'bg-violet-500 text-white hover:bg-violet-400'
                          : 'bg-muted text-muted-foreground cursor-not-allowed'
                      )}
                    >
                      {aiLoading
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <Send className="h-3 w-3" />
                      }
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center">
                    El asistente editará el código directamente en el editor
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Export loading modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showExportLoading && (
          <>
            <motion.div
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="fixed inset-0 z-[110] flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                className={cn(
                  'flex flex-col items-center gap-6 rounded-2xl border border-border px-10 py-10 shadow-2xl max-w-xs w-full',
                  isDark
                    ? 'bg-zinc-900/95 backdrop-blur-xl border-white/8 shadow-black/70'
                    : 'bg-white/95 backdrop-blur-xl shadow-black/20'
                )}
              >
                {/* Owl mascot with spinning ring */}
                <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)' }}
                  />
                  <motion.div
                    className="absolute inset-0"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.6, ease: 'linear', repeat: Infinity }}
                  >
                    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                      <circle cx="60" cy="60" r="54" stroke="rgba(139,92,246,0.15)" strokeWidth="3" />
                      <path
                        d="M60 6 A54 54 0 0 1 113.97 67.5"
                        stroke="url(#arcGrad)"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="arcGrad" x1="60" y1="6" x2="113.97" y2="67.5" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#C084FC" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </motion.div>
                  <motion.div
                    className="relative z-10"
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity }}
                  >
                    <EthosOwlMascot size={76} floating={false} />
                  </motion.div>
                </div>

                <div className="text-center space-y-1.5">
                  <p className="text-sm font-bold text-foreground tracking-tight">Compilando CV...</p>
                  <p className="text-xs text-muted-foreground">
                    Generando {exportFormatLabel[exportLoadingType] ?? 'archivo'} · por favor espera
                  </p>
                  <div className="flex items-center justify-center gap-1 pt-1">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-violet-500"
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                        transition={{ duration: 1.2, ease: 'easeInOut', repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Click-outside overlay — below all dropdowns in z-stack */}
      {(showExportMenu || showModeDropdown) && (
        <div
          className="fixed inset-0 z-[50]"
          onClick={() => {
            setShowExportMenu(false);
            setShowModeDropdown(false);
          }}
        />
      )}
    </div>
  );
}

// ── Markdown Preview ──────────────────────────────────────────────────────────

function MarkdownPreview({ content, isDark }: { content: string; isDark: boolean }) {
  const lines = content.split('\n');

  return (
    <div className={cn(
      'prose prose-sm max-w-none font-sans',
      isDark ? 'prose-invert' : ''
    )}>
      {lines.map((line, i) => {
        if (line.startsWith('# ')) return (
          <h1 key={i} className="text-xl font-bold text-foreground mb-1 mt-0">{line.slice(2)}</h1>
        );
        if (line.startsWith('## ')) return (
          <h2 key={i} className="text-sm font-bold text-foreground uppercase tracking-wide mt-4 mb-1 pb-0.5 border-b border-border">{line.slice(3)}</h2>
        );
        if (line.startsWith('### ')) return (
          <h3 key={i} className="text-sm font-semibold text-foreground mt-3 mb-0.5">{line.slice(4)}</h3>
        );
        if (line.startsWith('---')) return (
          <hr key={i} className="border-border my-2" />
        );
        if (line.startsWith('- ')) return (
          <li key={i} className="text-xs text-muted-foreground ml-4 mb-0.5">{renderInline(line.slice(2))}</li>
        );
        if (line.startsWith('```')) return (
          <div key={i} className={cn('rounded-md px-3 py-1.5 my-1 font-mono text-xs', isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-muted text-zinc-700')}>
            {line.slice(3)}
          </div>
        );
        if (line.trim() === '') return <div key={i} className="h-1" />;
        return (
          <p key={i} className="text-xs text-muted-foreground mb-0.5 leading-relaxed">{renderInline(line)}</p>
        );
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return (
      <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
    );
    if (part.startsWith('`') && part.endsWith('`')) return (
      <code key={i} className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono text-violet-600 dark:text-violet-300">{part.slice(1, -1)}</code>
    );
    return part;
  });
}

// ── LaTeX Preview ─────────────────────────────────────────────────────────────

function LaTeXPreview({ content, isDark }: { content: string; isDark: boolean }) {
  const commandCount = (content.match(/\\/g) || []).length;
  const packageMatches = content.match(/\\usepackage(?:\[[^\]]*\])?\{([^}]+)\}/g) || [];
  const packages = packageMatches.map(p => {
    const m = p.match(/\{([^}]+)\}/);
    return m ? m[1] : '';
  }).filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
        <div className="flex items-center gap-2 mb-1">
          <FileCode2 className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Documento LaTeX</p>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Usa Overleaf u otro compilador LaTeX para renderizar el PDF final. La exportación .tex descarga el código fuente.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Comandos', value: commandCount },
          { label: 'Paquetes',  value: packages.length },
          { label: 'Líneas',    value: content.split('\n').length },
          { label: 'Chars',     value: content.length },
        ].map(stat => (
          <div key={stat.label} className={cn(
            'rounded-xl border border-border p-3 text-center',
            isDark ? 'bg-zinc-800/40' : 'bg-muted/30'
          )}>
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {packages.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Paquetes detectados</p>
          <div className="flex flex-wrap gap-1.5">
            {packages.map(pkg => (
              <span key={pkg} className={cn(
                'rounded-md border border-border px-2 py-0.5 text-[11px] font-mono',
                isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-muted text-zinc-700'
              )}>
                {pkg}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Código fuente</p>
        <pre className={cn(
          'rounded-xl border border-border p-3 text-[11px] font-mono leading-relaxed overflow-x-auto',
          'scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent',
          isDark ? 'bg-zinc-900 text-zinc-300' : 'bg-muted text-zinc-700'
        )}>
          {content.slice(0, 600)}{content.length > 600 ? '\n...' : ''}
        </pre>
      </div>
    </div>
  );
}
