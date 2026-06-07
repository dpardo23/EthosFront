import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import type { BeforeMount, OnMount } from '@monaco-editor/react';
import { toast } from 'sonner';
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
  FilePlus,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useUiStore } from '@/store';
import { useAuthStore } from '@/store/authStore';
import { EthosOwlMascot } from '@/components/brand/EthosCoreLogo';
import { useCvStudioStore } from '@/store/cvStudioStore';
import { callAiAssist, compileLatexToPdf, type CvDocument, type ChatMessage } from '@/shared/services/cvStudioService';

// ── Types ──────────────────────────────────────────────────────────────────────

type EditorMode = 'markdown' | 'latex';

type Template = {
  id: string;
  title: string;
  description: string;
  code: string;
};

// ── Templates ──────────────────────────────────────────────────────────────────

const markdownTemplates: Template[] = [
  {
    id: 'md-classic',
    title: 'Ingeniero Senior',
    description: 'Perfil completo orientado a impacto',
    code: `{{FOTO_PERFIL}}

# Tu Nombre
**Ingeniero de Software Senior** | tu@email.com | [LinkedIn](https://linkedin.com/in/tu-perfil) | [GitHub](https://github.com/tu-usuario) | Madrid, España

---

## Perfil Profesional

Ingeniero de software con 6+ años diseñando y construyendo sistemas backend de alta disponibilidad y frontends modernos con React/TypeScript. Especializado en arquitecturas distribuidas, DevOps y entrega continua. Experiencia liderando equipos técnicos y entregando productos a escala en producción.

---

## Experiencia Profesional

### Senior Software Engineer — Tech Corp S.L.
*Enero 2022 – Presente · Madrid, España*

- Arquitecté sistema de microservicios que procesa 2M de transacciones/día, reduciendo latencia P99 de 850ms a 95ms
- Lideré migración de base de datos monolítica a PostgreSQL multi-tenant para 300+ empresas cliente
- Implementé pipelines CI/CD con GitHub Actions + ArgoCD, reduciendo deploys fallidos un 90%
- Mentoring de equipo de 5 ingenieros; establecí estándares de code review y cobertura de tests ≥85%

### Software Engineer — Startup Digital S.L.
*Marzo 2020 – Diciembre 2021 · Barcelona, España*

- Desarrollé API REST con Node.js/TypeScript para plataforma B2B SaaS con 80K usuarios activos
- Integré pasarela de pagos Stripe, aumentando conversión un 28% y reduciendo incidencias un 40%
- Diseñé sistema de notificaciones en tiempo real con WebSockets gestionando 5K conexiones concurrentes

### Desarrollador Full Stack — Freelance
*Enero 2018 – Febrero 2020*

- Entregué 12+ proyectos para clientes en sectores fintech, edtech y e-commerce

---

## Habilidades Técnicas

**Backend:** Java · Spring Boot · Node.js · Python · FastAPI · Go
**Frontend:** React · TypeScript · Next.js · Tailwind CSS
**Bases de datos:** PostgreSQL · Redis · MongoDB · Elasticsearch
**DevOps & Cloud:** Docker · Kubernetes · AWS (ECS/RDS/S3) · Terraform · GitHub Actions
**Testing:** JUnit 5 · Jest · Cypress · k6

---

## Proyectos Destacados

**Sistema de Auditoría Distribuida** · [github.com/tu/audit-system](https://github.com/tu-usuario)
Event-driven con Kafka y Spring Boot para trazabilidad en tiempo real. 50K eventos/segundo.

**DevTools CLI** · [github.com/tu/devtools](https://github.com/tu-usuario)
Herramienta CLI en Go con 1.2K ⭐ para automatizar flujos de desarrollo local.

---

## Educación

**Grado en Ingeniería Informática** · Universidad Politécnica de Madrid · *2014 – 2018*
Nota media: 8.6/10 · Mención en Ingeniería de Software

---

## Certificaciones & Idiomas

**AWS Certified Developer Associate** (2023) · **Kubernetes CKAD** (2022)
**Español:** Nativo · **Inglés:** Profesional (C1)
`,
  },
  {
    id: 'md-tech',
    title: 'Stack & Proyectos',
    description: 'Foco en tecnologías y portfolio',
    code: `{{FOTO_PERFIL}}

# Tu Nombre — Software Engineer
\`tu@email.com\` · \`github.com/tu-usuario\` · \`linkedin.com/in/tu-perfil\` · Madrid, España

---

## Stack Principal

| Capa | Tecnologías |
|------|-------------|
| **Backend** | Java (Spring Boot) · Node.js · Python · Go |
| **Frontend** | React · TypeScript · Next.js · Tailwind CSS |
| **Base de datos** | PostgreSQL · Redis · MongoDB · Supabase |
| **Infraestructura** | Docker · Kubernetes · AWS · GitHub Actions |
| **Observabilidad** | Prometheus · Grafana · OpenTelemetry |

---

## Proyectos Principales

### Platform Core — Autenticación OAuth2 Multi-tenant
**Stack:** Spring Boot · React · Supabase · JWT
Plataforma de autenticación para 50K usuarios. Tiempo de auth < 200ms. Implementé refresh token rotation y detección de sesiones anómalas.

### DataPipeline — ETL en Tiempo Real
**Stack:** Python · Apache Kafka · PostgreSQL · dbt
Pipeline de ingesta procesando 100GB/día con latencia extremo a extremo < 500ms.

### DevMonitor — Dashboard de Observabilidad
**Stack:** React · TypeScript · Prometheus · Grafana
Dashboard unificado para métricas de infraestructura. Redujo MTTR del equipo un 60%.

---

## Experiencia

**Senior Software Engineer · TechCorp** *(2022 – Presente)*
Arquitectura de microservicios, liderazgo técnico, optimización de rendimiento

**Full Stack Engineer · Startup** *(2020 – 2022)*
APIs REST/GraphQL, integración de pagos, testing automatizado

---

## Educación & Certificaciones

**Ing. Informática** · Universidad Politécnica · 2018
**AWS Solutions Architect** · 2023 · **Docker Certified Associate** · 2022

---

**Español** (nativo) · **Inglés** C1 · **Portugués** (básico)
`,
  },
  {
    id: 'md-minimal',
    title: 'Minimalista Senior',
    description: 'Máximo impacto, mínimo ruido',
    code: `{{FOTO_PERFIL}}

# Tu Nombre

\`tu@email.com\` · \`github.com/tu-usuario\` · \`linkedin.com/in/tu-perfil\`

---

**Senior Software Engineer con 7 años construyendo sistemas que escalan.**
Especializado en backend distribuido. Actualmente en Tech Corp liderando el equipo de plataforma (5 personas).

---

### Donde he trabajado

**Tech Corp** — Senior SWE *(2022–Presente)*
Microservicios, -40% latencia P99, CI/CD zero-downtime, mentoring de equipo.

**Startup Digital** — SWE *(2020–2022)*
API REST 80K usuarios, integración Stripe, WebSockets tiempo real.

**Freelance** — Dev *(2018–2020)*
12 proyectos en fintech, edtech y e-commerce.

---

### Tech que uso a diario

Java · Spring Boot · TypeScript · React · PostgreSQL · Docker · AWS · GitHub Actions

---

### Lo que he construido

**audit-system** — Event sourcing con Kafka, 50K eventos/s
**devtools-cli** — Herramienta Go con 1.2K ⭐ en GitHub

---

### Formación

Ing. Informática, Universidad Politécnica (2018) · AWS CDA (2023) · CKAD (2022)

---

Español (nativo) · Inglés (C1)
`,
  },
];

const latexTemplates: Template[] = [
  {
    id: 'tex-modern',
    title: 'Moderno Pro',
    description: 'Header con foto + bloques de color',
    code: `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[top=1.4cm,bottom=1.4cm,left=1.5cm,right=1.5cm]{geometry}
\\usepackage{xcolor}
\\usepackage{tcolorbox}
\\usepackage{fontawesome5}
\\usepackage{hyperref}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage{graphicx}

\\definecolor{primary}{HTML}{6D28D9}
\\definecolor{light}{HTML}{F5F3FF}
\\definecolor{muted}{HTML}{6B7280}

\\tcbuselibrary{skins}
\\newtcolorbox{cvblock}[1]{
  enhanced, arc=5pt,
  colback=light, colframe=primary,
  boxrule=0pt, leftrule=3pt,
  title=#1, fonttitle=\\small\\bfseries\\color{primary},
  top=4pt, bottom=4pt
}

\\hypersetup{colorlinks=true, urlcolor=primary, linkcolor=primary}
\\setlist[itemize]{leftmargin=*, nosep, topsep=2pt, itemsep=1pt}
\\titleformat{\\section}{\\normalsize\\bfseries\\color{primary}}{}{0em}{}[{\\color{primary}\\hrule height 0.8pt}]
\\titlespacing{\\section}{0pt}{10pt}{5pt}

\\begin{document}
\\pagestyle{empty}

%% ── Header ──────────────────────────────────────────────────────────────────
\\begin{minipage}[t]{0.18\\linewidth}
  \\vspace{0pt}
  \\ethoshubFotoPerfil
\\end{minipage}%
\\hfill
\\begin{minipage}[t]{0.79\\linewidth}
  \\vspace{0pt}
  {\\huge\\bfseries Tu Nombre}\\\\[3pt]
  {\\large\\color{primary} Senior Software Engineer}\\\\[5pt]
  {\\small
    {\\color{muted}\\faEnvelope}~\\href{mailto:tu@email.com}{tu@email.com}\\quad
    {\\color{muted}\\faLinkedin}~\\href{https://linkedin.com/in/tu-perfil}{linkedin.com/in/tu-perfil}\\quad
    {\\color{muted}\\faGithub}~\\href{https://github.com/tu-usuario}{github.com/tu-usuario}\\\\[2pt]
    {\\color{muted}\\faMapMarker*}~Madrid, España\\quad
    {\\color{muted}\\faPhone}~+34 600 000 000
  }
\\end{minipage}

\\vspace{6pt}
{\\color{primary}\\hrule height 1.5pt}
\\vspace{8pt}

%% ── Perfil ───────────────────────────────────────────────────────────────────
\\begin{cvblock}{Perfil Profesional}
Ingeniero de software con 6+ años construyendo sistemas backend de alta disponibilidad. Especializado en arquitecturas distribuidas con Java/Spring Boot, frontends modernos con React/TypeScript y pipelines CI/CD. Experiencia liderando equipos técnicos de hasta 6 personas.
\\end{cvblock}

\\vspace{6pt}

%% ── Experiencia ──────────────────────────────────────────────────────────────
\\begin{cvblock}{Experiencia Profesional}
\\textbf{Senior Software Engineer} --- Tech Corp S.L. \\hfill {\\small\\color{muted}2022 -- Presente}
\\begin{itemize}
  \\item Arquitecté sistema de microservicios procesando 2M transacciones/día; latencia P99 de 850ms $\\rightarrow$ 95ms
  \\item Lideré migración a PostgreSQL multi-tenant para 300+ empresas; zero downtime
  \\item Implementé CI/CD con GitHub Actions + ArgoCD; deploys fallidos --90\\%
  \\item Mentoring de equipo de 5 ingenieros; cobertura de tests $\\geq$85\\%
\\end{itemize}
\\vspace{4pt}
\\textbf{Software Engineer} --- Startup Digital S.L. \\hfill {\\small\\color{muted}2020 -- 2022}
\\begin{itemize}
  \\item API REST Node.js/TypeScript para plataforma B2B con 80K usuarios activos
  \\item Integración Stripe: conversión +28\\%, incidencias --40\\%
  \\item Sistema de notificaciones WebSockets gestionando 5K conexiones concurrentes
\\end{itemize}
\\end{cvblock}

\\vspace{6pt}

%% ── Skills + Educación ───────────────────────────────────────────────────────
\\begin{minipage}[t]{0.63\\linewidth}
\\begin{cvblock}{Habilidades Técnicas}
{\\small
\\textbf{Backend:} Java · Spring Boot · Node.js · Python · Go\\\\
\\textbf{Frontend:} React · TypeScript · Next.js · Tailwind CSS\\\\
\\textbf{BD:} PostgreSQL · Redis · MongoDB · Elasticsearch\\\\
\\textbf{DevOps:} Docker · Kubernetes · AWS · Terraform\\\\
\\textbf{Testing:} JUnit 5 · Jest · Cypress · k6
}
\\end{cvblock}
\\end{minipage}%
\\hfill
\\begin{minipage}[t]{0.34\\linewidth}
\\begin{cvblock}{Educación}
{\\small
\\textbf{Ing. Informática}\\\\
Universidad Politécnica\\\\
{\\color{muted}2014 -- 2018 · 8.6/10}\\\\[4pt]
\\textbf{Certificaciones}\\\\
AWS Developer (2023)\\\\
Kubernetes CKAD (2022)
}
\\end{cvblock}
\\end{minipage}

\\end{document}
`,
  },
  {
    id: 'tex-executive',
    title: 'Ejecutivo Clásico',
    description: 'Elegante, líneas y tipografía limpia',
    code: `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[top=2cm,bottom=2cm,left=2cm,right=2cm]{geometry}
\\usepackage{xcolor,titlesec,enumitem,hyperref,graphicx}

\\definecolor{accent}{HTML}{1E3A5F}
\\definecolor{muted}{HTML}{6B7280}
\\definecolor{rule}{HTML}{CBD5E1}

\\titleformat{\\section}{\\large\\bfseries\\color{accent}}{}{0em}{}[{\\color{rule}\\hrule}]
\\titlespacing{\\section}{0pt}{14pt}{6pt}
\\hypersetup{colorlinks=true, urlcolor=accent, linkcolor=accent}
\\setlist[itemize]{leftmargin=1.2em, nosep, topsep=2pt, itemsep=1.5pt}

\\begin{document}
\\thispagestyle{empty}

%% ── Header ───────────────────────────────────────────────────────────────────
\\begin{minipage}[c]{0.20\\linewidth}
  \\ethoshubFotoPerfil
\\end{minipage}%
\\hfill
\\begin{minipage}[c]{0.76\\linewidth}
  {\\Huge\\bfseries\\color{accent} Tu Nombre}\\\\[6pt]
  {\\large\\color{muted} Senior Software Engineer · 6 años de experiencia}\\\\[8pt]
  {\\small
    \\textbf{Email:} tu@email.com\\quad
    \\textbf{Web:} \\href{https://github.com/tu-usuario}{github.com/tu-usuario}\\\\[2pt]
    \\textbf{LinkedIn:} \\href{https://linkedin.com/in/tu-perfil}{linkedin.com/in/tu-perfil}\\quad
    \\textbf{Ubicación:} Madrid, España
  }
\\end{minipage}

\\vspace{8pt}
{\\color{accent}\\hrule height 2pt}

%% ── Perfil ───────────────────────────────────────────────────────────────────
\\section{Perfil Profesional}
Ingeniero de software especializado en arquitecturas backend distribuidas con Java/Spring Boot y sistemas frontend con React. 6+ años diseñando soluciones escalables y liderando equipos en entornos ágiles. Orientado a resultados medibles: reducción de latencia, mejora de conversión y automatización de operaciones.

%% ── Experiencia ──────────────────────────────────────────────────────────────
\\section{Experiencia Profesional}

\\textbf{Senior Software Engineer} \\hfill {\\color{muted} Enero 2022 -- Presente}\\\\
Tech Corp S.L. · Madrid, España
\\begin{itemize}
  \\item Rediseñé arquitectura a microservicios: 2M transacciones/día, latencia P99 de 850ms a 95ms
  \\item Migré 300+ empresas cliente a PostgreSQL multi-tenant sin downtime planificado
  \\item Establecí cultura de CI/CD (GitHub Actions + ArgoCD): --90\\% en deploys fallidos
  \\item Lideré y mentoreé equipo de 5 ingenieros; code reviews, testing y arquitectura
\\end{itemize}

\\vspace{6pt}
\\textbf{Software Engineer} \\hfill {\\color{muted} Marzo 2020 -- Diciembre 2021}\\\\
Startup Digital S.L. · Barcelona, España
\\begin{itemize}
  \\item Construí API REST con Node.js/TypeScript para 80K usuarios activos
  \\item Implementé integración Stripe: +28\\% conversión, --40\\% incidencias
  \\item Diseñé sistema de notificaciones real-time con WebSockets (5K conexiones concurrentes)
\\end{itemize}

%% ── Habilidades ──────────────────────────────────────────────────────────────
\\section{Habilidades Técnicas}
\\begin{tabular}{@{}ll}
  \\textbf{Backend} & Java · Spring Boot · Node.js · Python · FastAPI · Go \\\\
  \\textbf{Frontend} & React · TypeScript · Next.js · Tailwind CSS \\\\
  \\textbf{Bases de datos} & PostgreSQL · Redis · MongoDB · Elasticsearch \\\\
  \\textbf{DevOps / Cloud} & Docker · Kubernetes · AWS · Terraform · GitHub Actions \\\\
  \\textbf{Testing} & JUnit 5 · Jest · Cypress · k6 (load testing) \\\\
\\end{tabular}

%% ── Educación ────────────────────────────────────────────────────────────────
\\section{Educación}
\\textbf{Grado en Ingeniería Informática} \\hfill {\\color{muted} 2014 -- 2018}\\\\
Universidad Politécnica de Madrid · Nota media: 8.6/10 · Mención en Ingeniería de Software

%% ── Certificaciones ──────────────────────────────────────────────────────────
\\section{Certificaciones e Idiomas}
\\textbf{AWS Certified Developer Associate} (2023) ·
\\textbf{Kubernetes CKAD} (2022) ·
\\textbf{Docker Certified Associate} (2022)\\\\[4pt]
\\textbf{Español:} Nativo ·
\\textbf{Inglés:} Profesional avanzado (C1) ·
\\textbf{Portugués:} Básico

\\end{document}
`,
  },
  {
    id: 'tex-compact',
    title: 'Compacto Una Página',
    description: 'Dos columnas, alta densidad de información',
    code: `\\documentclass[10pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[top=1.2cm,bottom=1.2cm,left=1.2cm,right=1.2cm]{geometry}
\\usepackage{xcolor,multicol,titlesec,enumitem,hyperref,graphicx}

\\definecolor{accent}{HTML}{1D4ED8}
\\definecolor{muted}{HTML}{64748B}
\\definecolor{light}{HTML}{EFF6FF}

\\titleformat{\\section}{\\small\\bfseries\\color{accent}\\MakeUppercase}{}{0em}{}[{\\color{accent}\\hrule height 0.5pt}]
\\titlespacing{\\section}{0pt}{6pt}{3pt}
\\setlist[itemize]{leftmargin=1em, nosep, topsep=1pt, itemsep=0.5pt}
\\hypersetup{colorlinks=true, urlcolor=accent}

\\begin{document}
\\pagestyle{empty}

%% ── Header ───────────────────────────────────────────────────────────────────
\\begin{minipage}[c]{0.14\\linewidth}
  \\ethoshubFotoPerfil
\\end{minipage}%
\\hfill
\\begin{minipage}[c]{0.83\\linewidth}
  {\\Large\\bfseries Tu Nombre}\\quad{\\color{muted}|\\quad Senior Software Engineer}\\\\[3pt]
  {\\small
    tu@email.com $\\cdot$
    \\href{https://github.com/tu-usuario}{github.com/tu-usuario} $\\cdot$
    \\href{https://linkedin.com/in/tu-perfil}{linkedin.com/in/tu-perfil} $\\cdot$
    Madrid, España
  }
\\end{minipage}

\\vspace{4pt}
{\\color{accent}\\hrule height 1pt}
\\vspace{6pt}

\\begin{multicols}{2}

%% ── Columna izquierda ────────────────────────────────────────────────────────
\\section{Perfil}
{\\small Ing. de software, 6+ años. Backend distribuido con Java/Spring Boot, frontend con React/TS. Liderazgo técnico y DevOps.}

\\section{Experiencia}
{\\small
\\textbf{Senior SWE · Tech Corp} \\hfill {\\color{muted}\\tiny 2022–hoy}
\\begin{itemize}
  \\item Microservicios 2M tx/día, P99 850ms $\\rightarrow$ 95ms
  \\item Migración multi-tenant 300+ clientes
  \\item CI/CD ArgoCD, --90\\% deploys fallidos
  \\item Mentoring equipo 5 ingenieros
\\end{itemize}

\\textbf{SWE · Startup Digital} \\hfill {\\color{muted}\\tiny 2020–22}
\\begin{itemize}
  \\item API REST Node.js, 80K usuarios
  \\item Stripe +28\\% conversión
  \\item WebSockets 5K conexiones concurrentes
\\end{itemize}

\\textbf{Dev Freelance} \\hfill {\\color{muted}\\tiny 2018–20}
\\begin{itemize}
  \\item 12 proyectos en fintech, edtech, e-commerce
\\end{itemize}
}

\\columnbreak

%% ── Columna derecha ──────────────────────────────────────────────────────────
\\section{Habilidades}
{\\small
\\textbf{Backend:} Java · Spring Boot · Node.js · Python · Go\\\\
\\textbf{Frontend:} React · TypeScript · Next.js\\\\
\\textbf{BD:} PostgreSQL · Redis · MongoDB\\\\
\\textbf{DevOps:} Docker · K8s · AWS · Terraform\\\\
\\textbf{Testing:} JUnit 5 · Jest · Cypress · k6
}

\\section{Proyectos Destacados}
{\\small
\\textbf{Audit System} --- Event sourcing Kafka, 50K eventos/s\\\\
\\textbf{DevTools CLI} --- Go, 1.2K $\\star$ en GitHub
}

\\section{Educación}
{\\small
\\textbf{Ing. Informática} · UPM · 2018 · 8.6/10
}

\\section{Certificaciones}
{\\small AWS CDA (2023) · CKAD (2022)}

\\section{Idiomas}
{\\small Español (nativo) · Inglés (C1)}

\\end{multicols}

\\end{document}
`,
  },
];

// ── Export options ─────────────────────────────────────────────────────────────

const exportOptions = [
  { id: 'pdf',      label: 'Exportar PDF',     icon: FileType,  desc: 'Listo para enviar' },
  { id: 'markdown', label: 'Exportar Markdown', icon: FileText,  desc: 'Formato .md' },
  { id: 'latex',    label: 'Exportar LaTeX',    icon: FileCode2, desc: 'Fuente .tex' },
  { id: 'txt',      label: 'Exportar TXT',      icon: FileText,  desc: 'Texto plano' },
];

const exportFormatLabel: Record<string, string> = {
  pdf: 'PDF', markdown: 'Markdown', latex: 'LaTeX', txt: 'TXT',
};

const ZOOM_LEVELS = [25, 50, 75, 100, 125, 150];

// ── Monaco LaTeX language registration ────────────────────────────────────────

const handleBeforeMount: BeforeMount = (monaco) => {
  if (monaco.languages.getLanguages().some((l: { id: string }) => l.id === 'latex')) return;
  monaco.languages.register({ id: 'latex' });
  monaco.languages.setMonarchTokensProvider('latex', {
    tokenizer: {
      root: [
        [/\\[a-zA-Z@]+\*?/, 'keyword'],
        [/[{}]/, 'delimiter.curly'],
        [/[\[\]]/, 'delimiter.square'],
        [/%.*$/, 'comment'],
        [/\$\$[\s\S]*?\$\$/, 'string'],
        [/\$[^\n$]*\$/, 'string'],
        [/\d+/, 'number'],
      ],
    },
  });
};

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CVStudioPage() {
  const { resolvedTheme } = useUiStore();
  const isDark = resolvedTheme === 'dark';
  const { profile } = useAuthStore();

  // ── Store ──────────────────────────────────────────────────────────────────
  const {
    documents, fetchDocuments, saveDocument, editDocument, removeDocument, isSaving, isDeleting,
    editorContent, setEditorContent,
    editorMode, setEditorMode,
    activeTemplateId, setActiveTemplateId,
    editingDocId, setEditingDocId,
  } = useCvStudioStore();

  // Aliases so the rest of the component keeps its existing names
  const mode = editorMode;
  const setMode = (m: EditorMode) => setEditorMode(m);

  // ── UI toggles ─────────────────────────────────────────────────────────────
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // ── Toolbar state ──────────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(100);

  // ── Export loading modal ───────────────────────────────────────────────────
  const [showExportLoading, setShowExportLoading] = useState(false);
  const [exportLoadingType, setExportLoadingType] = useState('');

  // ── AI state ───────────────────────────────────────────────────────────────
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [copiedMsgIndex, setCopiedMsgIndex] = useState<number | null>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const aiTextareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Save modal state ───────────────────────────────────────────────────────
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');

  // ── Document management ────────────────────────────────────────────────────
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const exportRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const templates = mode === 'markdown' ? markdownTemplates : latexTemplates;
  const lineCount = editorContent.split('\n').length;
  const charCount = editorContent.length;

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchDocuments().catch(() => toast.error('Error al cargar documentos guardados'));
  }, [fetchDocuments]);

  // Initialize editor with default template on first load
  useEffect(() => {
    if (!editorContent) {
      setEditorContent(markdownTemplates[0].code);
      setActiveTemplateId(markdownTemplates[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleModeSwitch = (newMode: EditorMode) => {
    setMode(newMode);
    setShowModeDropdown(false);
    const defaultTemplate = newMode === 'markdown' ? markdownTemplates[0] : latexTemplates[0];
    setEditorContent(defaultTemplate.code);
    setActiveTemplateId(defaultTemplate.id);
    setEditingDocId(null);
  };

  const handleTemplateClick = (template: Template) => {
    setEditorContent(template.code);
    setActiveTemplateId(template.id);
    setEditingDocId(null);
  };

  const handleLoadDoc = useCallback((doc: CvDocument) => {
    if (doc.mode !== mode) setMode(doc.mode as EditorMode);
    setEditorContent(doc.content);
    setActiveTemplateId(doc.id);
    setEditingDocId(doc.id);
  }, [mode]);

  const handleEditDocCard = useCallback((doc: CvDocument) => {
    handleLoadDoc(doc);
    setSaveTitle(doc.title);
    setShowSaveModal(true);
  }, [handleLoadDoc]);

  const handleCopy = useCallback(async () => {
    // Always read from Monaco's live model, never from stale React state
    const content = editorRef.current?.getValue() ?? editorContent;
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      // Fallback for HTTP (non-secure) contexts
      const ta = document.createElement('textarea');
      ta.value = content;
      ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    toast.success('Contenido copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleNewDocument = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.setValue('');
      editorRef.current.setPosition({ lineNumber: 1, column: 1 });
      editorRef.current.revealLine(1);
    }
    setEditorContent('');
    setActiveTemplateId(null);
    setEditingDocId(null);
    setChatHistory([]);
  }, [setEditorContent, setActiveTemplateId, setEditingDocId]);

  const handleSaveToProfile = useCallback(() => {
    const defaultTitle = editingDocId
      ? (documents.find((d) => d.id === editingDocId)?.title ?? '')
      : `CV ${mode === 'markdown' ? 'Markdown' : 'LaTeX'} ${new Date().toLocaleDateString('es-ES')}`;
    setSaveTitle(defaultTitle);
    setShowSaveModal(true);
  }, [editingDocId, documents, mode]);

  const handleSaveConfirm = useCallback(async () => {
    if (!saveTitle.trim()) return;
    const req = {
      title: saveTitle.trim(),
      mode,
      content: editorRef.current?.getValue() ?? editorContent,
      templateId: activeTemplateId,
    };
    try {
      if (editingDocId) {
        const updated = await editDocument(editingDocId, req);
        setEditingDocId(updated.id);
        setActiveTemplateId(updated.id);
        toast.success('Documento actualizado correctamente');
      } else {
        const created = await saveDocument(req);
        setEditingDocId(created.id);
        setActiveTemplateId(created.id);
        toast.success('Documento guardado en tu perfil');
      }
      setShowSaveModal(false);
      setSaveTitle('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })
        ?.response?.data?.message ?? (err as { message?: string })?.message ?? 'Error desconocido';
      console.error('[CVStudio] save error:', err);
      toast.error(`Error al guardar: ${msg}`);
    }
  }, [saveTitle, mode, editorContent, activeTemplateId, editingDocId, editDocument, saveDocument]);

  const handleDeleteConfirmed = useCallback(async (id: string) => {
    try {
      await removeDocument(id);
      toast.success('Documento eliminado');
      setDeleteConfirmId(null);
      if (editingDocId === id) {
        setEditingDocId(null);
        setEditorContent(templates[0].code);
        setActiveTemplateId(templates[0].id);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })
        ?.response?.data?.message ?? (err as { message?: string })?.message ?? 'Error desconocido';
      console.error('[CVStudio] delete error:', err);
      toast.error(`Error al eliminar: ${msg}`);
      setDeleteConfirmId(null);
    }
  }, [editingDocId, removeDocument, templates]);

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

  const handleExportStart = useCallback(async (type: string) => {
    if (type === 'latex' && mode === 'markdown') {
      toast.error('Cambia al modo LaTeX para exportar en ese formato');
      setShowExportMenu(false);
      return;
    }
    if (type === 'markdown' && mode === 'latex') {
      toast.error('Cambia al modo Markdown para exportar en ese formato');
      setShowExportMenu(false);
      return;
    }

    setShowExportMenu(false);
    // Always read from Monaco's live model for freshest content
    const contentSnapshot = editorRef.current?.getValue() ?? editorContent;

    if (type === 'pdf') {
      setExportLoadingType('pdf');
      setShowExportLoading(true);

      if (mode === 'markdown') {
        // Client-side PDF via html2pdf string mode — avoids DOM position/clipping issues
        try {
          const { default: html2pdf } = await import('html2pdf.js');
          // Yield two animation frames so framer-motion can start the spinner
          // before html2pdf blocks the main thread with canvas rendering.
          await new Promise(r => requestAnimationFrame(r));
          await new Promise(r => setTimeout(r, 80));
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const worker = html2pdf() as any;
          await worker
            .set({
              margin: [15, 15, 15, 15],
              filename: 'cv.pdf',
              html2canvas: { scale: 2, backgroundColor: '#ffffff', logging: false, useCORS: true },
              jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            })
            .from(buildMarkdownPdfHtml(contentSnapshot, profile?.avatar ?? undefined), 'string')
            .save();
          setShowExportLoading(false);
          toast.success('PDF exportado correctamente');
        } catch (err) {
          setShowExportLoading(false);
          toast.error('Error generando PDF: ' + (err as Error).message);
        }
      } else {
        // LaTeX → PDF via backend pdflatex
        try {
          const blob = await compileLatexToPdf(contentSnapshot, profile?.avatar ?? undefined);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'cv.pdf';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setShowExportLoading(false);
          toast.success('PDF compilado correctamente');
        } catch (err) {
          setShowExportLoading(false);
          toast.error('Error compilando LaTeX: ' + (err as Error).message);
        }
      }
    } else {
      setExportLoadingType(type);
      setShowExportLoading(true);
      setTimeout(() => {
        triggerDownload(type, contentSnapshot);
        setShowExportLoading(false);
        setExportLoadingType('');
        toast.success(`Archivo ${exportFormatLabel[type] ?? type} descargado`);
      }, 1200);
    }
  }, [mode, editorContent, triggerDownload]);

  const copyAiResponse = useCallback(async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedMsgIndex(idx);
    toast.success('Código copiado al portapapeles');
    setTimeout(() => setCopiedMsgIndex(null), 2000);
  }, []);

  const applyAiResponse = useCallback((text: string) => {
    if (editorRef.current) editorRef.current.setValue(text);
    setEditorContent(text);
    toast.success('Código aplicado al editor');
  }, [setEditorContent]);

  const handleAiSubmit = useCallback(async () => {
    if (!aiPrompt.trim() || isAiLoading) return;

    const userMessage = aiPrompt.trim();
    setIsAiLoading(true);
    setAiPrompt('');

    setChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);
    setTimeout(() => {
      chatMessagesRef.current?.scrollTo({ top: chatMessagesRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);

    const contentForApi = editorRef.current?.getValue() ?? editorContent;

    try {
      const text = await callAiAssist({
        prompt: userMessage,
        content: contentForApi,
        mode,
        history: chatHistory,
      });
      setChatHistory(prev => [...prev, { role: 'model', text }]);
      setTimeout(() => {
        chatMessagesRef.current?.scrollTo({ top: chatMessagesRef.current.scrollHeight, behavior: 'smooth' });
      }, 50);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })
        ?.response?.data?.message ?? (err as { message?: string })?.message ?? 'Error del asistente IA';
      toast.error(msg);
    } finally {
      setIsAiLoading(false);
    }
  }, [aiPrompt, isAiLoading, mode, editorContent, chatHistory]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col -mx-4 -my-6 sm:-mx-6 lg:-mx-8 lg:h-[calc(100vh-3.5rem)] lg:overflow-hidden">

      {/* ── Header Card ────────────────────────────────────────────────────── */}
      <div className={cn(
        'relative rounded-3xl border border-border bg-card',
        'px-6 py-8 sm:px-8 sm:py-10',
        'mx-4 sm:mx-6 lg:mx-8 mt-4 sm:mt-5 mb-3 shrink-0',
      )}>
        <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_80%_50%_at_0%_0%,_hsl(var(--primary)/0.12)_0%,_transparent_100%)]" />
        <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_40%_60%_at_100%_100%,_hsl(var(--primary)/0.06)_0%,_transparent_100%)]" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

          {/* Left: badge + title */}
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

          {/* Right: single-row controls */}
          <div className="flex flex-row flex-wrap items-center gap-2 lg:justify-end">

            {/* Mode combobox */}
            <div className="relative" ref={modeRef}>
              <button
                onClick={() => setShowModeDropdown((v) => !v)}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all',
                  'border-border hover:border-violet-500/40 hover:bg-violet-500/5',
                  showModeDropdown && 'border-violet-500/40 bg-violet-500/5',
                )}
              >
                {mode === 'markdown'
                  ? <><FileText className="h-3.5 w-3.5 text-violet-400" /> Markdown</>
                  : <><FileCode2 className="h-3.5 w-3.5 text-violet-400" /> LaTeX</>
                }
                <ChevronDown className={cn('h-3 w-3 text-muted-foreground transition-transform', showModeDropdown && 'rotate-180')} />
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
                      isDark ? 'bg-zinc-900' : 'bg-white',
                    )}
                  >
                    {(['markdown', 'latex'] as EditorMode[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => handleModeSwitch(m)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                          mode === m
                            ? 'bg-violet-500/10 text-violet-600 dark:text-violet-300'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                        )}
                      >
                        {m === 'markdown' ? <FileText className="h-3.5 w-3.5" /> : <FileCode2 className="h-3.5 w-3.5" />}
                        {m === 'markdown' ? 'Markdown' : 'LaTeX'}
                        {mode === m && <Check className="ml-auto h-3 w-3" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Nuevo CV */}
            <button
              onClick={handleNewDocument}
              disabled={isAiLoading}
              className={cn(
                'flex items-center gap-1.5 h-9 rounded-xl border border-border px-3 text-xs font-medium transition-all',
                'text-muted-foreground hover:text-foreground hover:border-violet-500/30 hover:bg-accent',
                isAiLoading && 'opacity-40 cursor-not-allowed',
              )}
              title="Crear nuevo CV en blanco"
            >
              <FilePlus className="h-3.5 w-3.5" />
              Nuevo CV
            </button>

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
                isAiLoading
                  ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
                  : 'bg-gradient-to-r from-violet-600 to-violet-500 text-white hover:from-violet-500 hover:to-violet-400 shadow-sm hover:shadow-violet-500/25',
              )}
            >
              {isAiLoading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Sparkles className="h-3.5 w-3.5" />}
              {isAiLoading ? 'IA procesando...' : 'Asistente IA'}
            </button>

            {/* Export */}
            <div className="relative" ref={exportRef}>
              <button
                disabled={showExportLoading}
                onClick={() => !showExportLoading && setShowExportMenu((v) => !v)}
                className={cn(
                  'flex items-center gap-1.5 h-9 rounded-xl border px-3.5 text-xs font-medium transition-all',
                  'border-border hover:border-violet-500/30 hover:bg-accent',
                  showExportMenu && 'border-violet-500/30 bg-accent',
                  showExportLoading && 'opacity-50 cursor-not-allowed',
                )}
              >
                <Download className="h-3.5 w-3.5" />
                Exportar
                <ChevronDown className={cn('h-3 w-3 text-muted-foreground transition-transform', showExportMenu && 'rotate-180')} />
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
                      isDark ? 'bg-zinc-900 shadow-black/50' : 'bg-white shadow-black/10',
                    )}
                  >
                    <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Formato</p>
                    {exportOptions.map((opt) => {
                      const disabled =
                        (opt.id === 'latex' && mode === 'markdown') ||
                        (opt.id === 'markdown' && mode === 'latex');
                      return (
                        <button
                          key={opt.id}
                          onClick={() => !disabled && handleExportStart(opt.id)}
                          title={disabled ? `Solo disponible en modo ${opt.id === 'latex' ? 'LaTeX' : 'Markdown'}` : undefined}
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors group',
                            disabled
                              ? 'opacity-35 cursor-not-allowed'
                              : 'hover:bg-accent',
                          )}
                        >
                          <opt.icon className={cn(
                            'h-4 w-4 shrink-0 transition-colors',
                            disabled ? 'text-muted-foreground' : 'text-muted-foreground group-hover:text-violet-500',
                          )} />
                          <div className="text-left min-w-0">
                            <p className="text-xs font-medium text-foreground">{opt.label}</p>
                            <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Divider */}
            <div className="h-5 w-px bg-border" />

            {/* Guardar / Actualizar */}
            <button
              onClick={handleSaveToProfile}
              disabled={isSaving}
              className={cn(
                'flex items-center gap-1.5 h-9 rounded-xl px-3.5 text-xs font-semibold transition-all duration-200',
                'bg-violet-600 text-white hover:bg-violet-500 shadow-sm hover:shadow-violet-500/20',
                isSaving && 'opacity-60 cursor-not-allowed',
              )}
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {editingDocId ? 'Actualizar CV' : 'Guardar en perfil'}
            </button>

          </div>
        </div>
      </div>

      {/* ── Template + Saved Docs Strip ───────────────────────────────────────── */}
      <motion.div layout className="shrink-0 px-4 sm:px-6 lg:px-8 py-2.5 bg-card/50">
        <p className="mb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Plantillas {mode === 'markdown' ? 'Markdown' : 'LaTeX'}
          {documents.length > 0 && <span className="ml-2 text-violet-500">· Mis documentos ({documents.length})</span>}
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <AnimatePresence mode="popLayout">

            {/* Built-in templates */}
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
                    : 'border-border bg-background hover:bg-accent/50',
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <p className={cn(
                    'text-xs font-semibold leading-none',
                    activeTemplateId === tpl.id ? 'text-violet-600 dark:text-violet-300' : 'text-foreground',
                  )}>{tpl.title}</p>
                  {activeTemplateId === tpl.id && (
                    <motion.div layoutId="template-active-dot" className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">{tpl.description}</p>
              </motion.button>
            ))}

            {/* Saved document cards */}
            {documents.map((doc) => (
              <motion.div
                key={doc.id}
                layout
                initial={{ opacity: 0, scale: 0.9, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: -10 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={cn(
                  'flex shrink-0 w-36 flex-col gap-1 rounded-xl border p-2.5 transition-all',
                  'hover:border-violet-500/40 hover:shadow-sm',
                  activeTemplateId === doc.id
                    ? 'border-violet-500/50 bg-violet-500/8 shadow-sm shadow-violet-500/10'
                    : 'border-border bg-background hover:bg-accent/50',
                )}
              >
                {/* Mode badge + active dot */}
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className={cn(
                    'text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded',
                    doc.mode === 'markdown'
                      ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                  )}>
                    {doc.mode === 'markdown' ? 'MD' : 'TEX'}
                  </span>
                  {activeTemplateId === doc.id && (
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                  )}
                </div>

                {/* Title (clickable → load) */}
                <button
                  onClick={() => handleLoadDoc(doc)}
                  className={cn(
                    'text-xs font-semibold leading-tight text-left line-clamp-2',
                    activeTemplateId === doc.id ? 'text-violet-600 dark:text-violet-300' : 'text-foreground',
                  )}
                >
                  {doc.title}
                </button>

                {/* Edit / Delete actions */}
                <div className={cn(
                  'flex items-center gap-0.5 mt-auto pt-1.5 border-t',
                  isDark ? 'border-white/8' : 'border-black/6',
                )}>
                  <button
                    onClick={() => handleEditDocCard(doc)}
                    className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    title="Renombrar"
                  >
                    <Pencil className="h-2.5 w-2.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(doc.id)}
                    className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Editor Panel ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-h-[300px] max-h-[65vh] lg:max-h-none lg:min-h-0 mx-4 sm:mx-6 lg:mx-8 mb-4 lg:mb-6 rounded-xl overflow-hidden border border-border">

        {/* Animated accent line */}
        <div className="relative h-0.5 w-full overflow-hidden shrink-0 pointer-events-none">
          <div className="absolute inset-0 bg-primary/15" />
          <motion.div
            className="absolute top-0 h-full"
            style={{ width: '90px', background: 'linear-gradient(to right, transparent, hsl(var(--primary) / 0.8) 50%, transparent)' }}
            animate={{ left: ['-90px', 'calc(100% + 90px)'] }}
            transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 2.2, ease: 'easeInOut' }}
          />
        </div>

        {/* Editor header */}
        <div className={cn(
          'flex h-9 shrink-0 items-center justify-between px-4 border-b border-border',
          isDark ? 'bg-[#07070B]' : 'bg-muted/20',
        )}>
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Editor</p>
            {editingDocId && (
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400">
                {documents.find((d) => d.id === editingDocId)?.title ?? 'Documento'}
              </span>
            )}
          </div>
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

        {/* Monaco Editor + floating minimap */}
        <div className="relative flex-1 min-h-0">

          {/* Monaco fills space minus minimap width on sm+ */}
          <div className="absolute inset-0 sm:right-[200px]">
            <Editor
              height="100%"
              language={mode === 'markdown' ? 'markdown' : 'latex'}
              value={editorContent}
              onChange={(val) => setEditorContent(val ?? '')}
              theme={isDark ? 'vs-dark' : 'light'}
              beforeMount={handleBeforeMount}
              onMount={(editor) => { editorRef.current = editor; }}
              options={{
                minimap: { enabled: false },
                wordWrap: 'off',
                fontSize: 12,
                lineHeight: 1.6,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
                renderWhitespace: 'none',
                scrollbar: { vertical: 'auto', horizontal: 'auto' },
                overviewRulerLanes: 0,
                hideCursorInOverviewRuler: true,
                overviewRulerBorder: false,
              }}
            />
          </div>

          {/* Floating minimap */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28, delay: 0.1 }}
            className={cn(
              'absolute right-3 top-3 z-10 hidden sm:flex flex-col',
              'w-44 rounded-xl border border-border overflow-hidden',
              isDark ? 'bg-zinc-900/95 shadow-2xl shadow-black/50' : 'bg-white/95 shadow-xl shadow-black/8',
              'backdrop-blur-sm',
            )}
            style={{ bottom: '14px' }}
          >
            {/* Minimap title bar */}
            <div className={cn(
              'flex h-7 shrink-0 items-center justify-between px-2.5 border-b border-border',
              isDark ? 'bg-zinc-900/60' : 'bg-muted/50',
            )}>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider truncate">Vista Previa</span>
                {mode === 'latex' && <span className="text-[8px] font-medium text-amber-500 shrink-0">· LaTeX</span>}
              </div>
              <button
                onClick={() => setShowPreviewModal(true)}
                className="flex h-5 w-5 shrink-0 ml-1 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Ampliar vista previa"
              >
                <ZoomIn className="h-3 w-3" />
              </button>
            </div>

            {/* Scaled preview — click to open modal */}
            <div
              className="relative flex-1 min-h-0 overflow-hidden cursor-pointer group"
              onClick={() => setShowPreviewModal(true)}
            >
              <div style={{ transform: 'scale(0.3)', transformOrigin: 'top left', width: '333%', pointerEvents: 'none', padding: '16px' }}>
                {mode === 'markdown'
                  ? <MarkdownPreview content={editorContent} isDark={isDark} />
                  : <LaTeXPreview content={editorContent} isDark={isDark} />
                }
              </div>

              <div className={cn(
                'absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150',
                isDark ? 'bg-black/40' : 'bg-white/50',
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

      {/* Markdown PDF is generated via buildMarkdownPdfHtml() into a temp DOM node — no ref needed */}

      {/* ── Preview Modal ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPreviewModal && (
          <>
            <motion.div
              className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPreviewModal(false)}
            />
            <motion.div
              className="fixed inset-4 z-[75] flex flex-col rounded-2xl overflow-hidden border border-border shadow-2xl"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: 'hsl(var(--card))' }}
            >
              <div className={cn('flex h-11 shrink-0 items-center justify-between px-4 border-b border-border', isDark ? 'bg-[#07070B]' : 'bg-muted/20')}>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-foreground">Vista Previa</p>
                  {mode === 'latex' && (
                    <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                      LaTeX — render en compilación
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn('flex items-center gap-0.5 rounded-lg border border-border p-0.5', isDark ? 'bg-zinc-900/80' : 'bg-muted/40')}>
                    {ZOOM_LEVELS.map((z) => (
                      <button
                        key={z}
                        onClick={() => setPreviewZoom(z)}
                        className={cn(
                          'rounded px-2 py-0.5 text-[11px] font-medium transition-all',
                          previewZoom === z ? 'bg-violet-500 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-accent',
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

              <div className={cn('flex-1 min-h-0 overflow-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent', isDark ? 'bg-[#08080D]' : 'bg-white')}>
                <div
                  className="p-8 transition-transform duration-150"
                  style={{ transform: `scale(${previewZoom / 100})`, transformOrigin: 'top left', width: `${(10000 / previewZoom).toFixed(2)}%`, minHeight: `${(10000 / previewZoom).toFixed(2)}%` }}
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

      {/* ── Save Modal ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSaveModal && (
          <>
            <motion.div
              className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isSaving && setShowSaveModal(false)}
            />
            <motion.div
              className="fixed inset-0 z-[90] flex items-center justify-center p-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className={cn(
                  'w-full max-w-sm rounded-2xl border border-border shadow-2xl overflow-hidden',
                  isDark ? 'bg-zinc-900/95 backdrop-blur-xl border-white/8' : 'bg-white/95 backdrop-blur-xl',
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal header */}
                <div className={cn('flex items-center justify-between px-5 py-4 border-b border-border', isDark ? 'bg-zinc-900' : 'bg-white')}>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10">
                      <Save className="h-4 w-4 text-violet-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {editingDocId ? 'Actualizar documento' : 'Guardar documento'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Se guardará en tu perfil</p>
                    </div>
                  </div>
                  <button
                    onClick={() => !isSaving && setShowSaveModal(false)}
                    disabled={isSaving}
                    className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Modal body */}
                <div className="p-5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Nombre del documento</label>
                    <input
                      type="text"
                      value={saveTitle}
                      onChange={(e) => setSaveTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !isSaving && handleSaveConfirm()}
                      placeholder="Ej: CV Principal 2025"
                      autoFocus
                      maxLength={200}
                      className={cn(
                        'w-full rounded-xl border border-border px-3 py-2 text-sm outline-none transition-colors',
                        'focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10',
                        isDark ? 'bg-zinc-800 text-zinc-100 placeholder:text-zinc-500' : 'bg-muted/40 text-foreground placeholder:text-muted-foreground',
                      )}
                    />
                    <p className="text-[10px] text-muted-foreground text-right">{saveTitle.length}/200</p>
                  </div>

                  {/* Mode info */}
                  <div className={cn('flex items-center gap-2 rounded-xl border border-border px-3 py-2', isDark ? 'bg-zinc-800/50' : 'bg-muted/30')}>
                    {mode === 'markdown'
                      ? <FileText className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                      : <FileCode2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    }
                    <span className="text-xs text-muted-foreground">
                      Modo {mode === 'markdown' ? 'Markdown' : 'LaTeX'} · {lineCount} líneas · {charCount} chars
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setShowSaveModal(false)}
                      disabled={isSaving}
                      className="flex-1 rounded-xl border border-border py-2 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveConfirm}
                      disabled={!saveTitle.trim() || isSaving}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all',
                        saveTitle.trim() && !isSaving
                          ? 'bg-violet-600 text-white hover:bg-violet-500'
                          : 'bg-muted text-muted-foreground cursor-not-allowed',
                      )}
                    >
                      {isSaving
                        ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando...</>
                        : <><Save className="h-3.5 w-3.5" /> {editingDocId ? 'Actualizar' : 'Guardar'}</>
                      }
                    </button>
                  </div>
                </div>
              </motion.div>
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
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAiModal(false)}
            />
            <motion.div
              className="fixed bottom-6 right-6 z-[90] w-full max-w-sm flex flex-col"
              style={{ maxHeight: 'calc(100vh - 5rem)' }}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <div className={cn(
                'rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col',
                isDark ? 'bg-zinc-900/95 backdrop-blur-xl shadow-black/60 border-white/8' : 'bg-white/95 backdrop-blur-xl shadow-black/15',
              )}>
                {/* AI Modal header */}
                <div className={cn('flex items-center justify-between px-4 py-3 border-b border-border', isDark ? 'bg-zinc-900' : 'bg-white')}>
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-violet-500">
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground leading-none">Asistente IA</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        CV Studio · Modo {mode}{isAiLoading && ' · Procesando...'}
                      </p>
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
                  {/* Quick prompts */}
                  <div className="flex flex-wrap gap-1.5">
                    {['Optimiza para ATS', 'Añade métricas', 'Mejora el tono', 'Traduce al inglés'].map((action) => (
                      <button
                        key={action}
                        onClick={() => setAiPrompt(action)}
                        disabled={isAiLoading}
                        className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-violet-500/40 hover:bg-violet-500/5 transition-all disabled:opacity-40"
                      >
                        {action}
                      </button>
                    ))}
                  </div>

                  {/* Chat history — grows from 0 to max-h, then scrolls */}
                  {(chatHistory.length > 0 || isAiLoading) && (
                    <div
                      ref={chatMessagesRef}
                      className={cn(
                        'flex flex-col gap-2 overflow-y-auto rounded-xl border border-border p-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent',
                        isDark ? 'bg-zinc-800/40' : 'bg-muted/30',
                      )}
                      style={{ maxHeight: 'min(420px, calc(100vh - 320px))' }}
                    >
                      {chatHistory.map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                        >
                          {msg.role === 'user' ? (
                            <div className="rounded-lg px-2.5 py-1.5 text-[11px] leading-relaxed bg-violet-500 text-white max-w-[88%]">
                              {msg.text}
                            </div>
                          ) : (
                            <div className={cn(
                              'w-full rounded-lg border border-border overflow-hidden',
                              isDark ? 'bg-zinc-800/60' : 'bg-white',
                            )}>
                              {/* Code block header */}
                              <div className={cn(
                                'flex items-center justify-between px-2.5 py-1 border-b border-border',
                                isDark ? 'bg-zinc-900/60' : 'bg-muted/50',
                              )}>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Wand2 className="h-2.5 w-2.5 text-violet-400" />
                                  IA · {msg.text.length} chars
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => applyAiResponse(msg.text)}
                                    className="text-[9px] font-semibold text-violet-500 hover:text-violet-400 px-1.5 py-0.5 rounded hover:bg-violet-500/10 transition-colors"
                                  >
                                    Aplicar al editor
                                  </button>
                                  <button
                                    onClick={() => copyAiResponse(msg.text, i)}
                                    className="flex items-center gap-0.5 text-[9px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-accent transition-colors"
                                  >
                                    {copiedMsgIndex === i
                                      ? <><Check className="h-2.5 w-2.5 text-green-500" /> Copiado</>
                                      : <><Copy className="h-2.5 w-2.5" /> Copiar</>}
                                  </button>
                                </div>
                              </div>
                              {/* Code preview */}
                              <pre className={cn(
                                'text-[9px] font-mono px-2.5 py-1.5 max-h-32 overflow-auto whitespace-pre-wrap leading-relaxed',
                                isDark ? 'text-zinc-300' : 'text-zinc-700',
                              )}>
                                {msg.text.slice(0, 500)}{msg.text.length > 500 ? '\n…' : ''}
                              </pre>
                            </div>
                          )}
                        </motion.div>
                      ))}

                      {/* Loading bubble while waiting for AI response */}
                      {isAiLoading && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-1.5 self-start rounded-lg border border-violet-500/20 px-2.5 py-1.5"
                        >
                          <Loader2 className="h-2.5 w-2.5 animate-spin text-violet-400 shrink-0" />
                          <span className="text-[10px] text-muted-foreground">Generando tu CV…</span>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* Prompt input — textarea that expands vertically */}
                  <div className={cn(
                    'flex items-end gap-2 rounded-xl border px-3 py-2 transition-colors',
                    'border-border focus-within:border-violet-500/50',
                    isDark ? 'bg-zinc-800/60' : 'bg-muted/30',
                  )}>
                    <textarea
                      ref={aiTextareaRef}
                      value={aiPrompt}
                      rows={1}
                      onChange={(e) => {
                        setAiPrompt(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAiSubmit();
                        }
                      }}
                      placeholder="Ej: Mejora mi experiencia para roles de liderazgo… (Shift+Enter para nueva línea)"
                      disabled={isAiLoading}
                      style={{ resize: 'none', overflowY: 'auto', minHeight: '20px', maxHeight: '160px' }}
                      className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-50 leading-relaxed scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
                    />
                    <button
                      onClick={handleAiSubmit}
                      disabled={!aiPrompt.trim() || isAiLoading}
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-all mb-0.5',
                        aiPrompt.trim() && !isAiLoading
                          ? 'bg-violet-500 text-white hover:bg-violet-400'
                          : 'bg-muted text-muted-foreground cursor-not-allowed',
                      )}
                    >
                      {isAiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground">
                      Usa <strong>Aplicar al editor</strong> o <strong>Copiar</strong> para usar el CV generado
                    </p>
                    {chatHistory.length > 0 && (
                      <button
                        onClick={() => setChatHistory([])}
                        disabled={isAiLoading}
                        className="text-[10px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                      >
                        Limpiar chat
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Export Loading Modal ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showExportLoading && (
          <>
            <motion.div
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            />
            <motion.div
              className="fixed inset-0 z-[110] flex items-center justify-center p-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                className={cn(
                  'flex flex-col items-center gap-6 rounded-2xl border border-border px-10 py-10 shadow-2xl max-w-xs w-full',
                  isDark ? 'bg-zinc-900/95 backdrop-blur-xl border-white/8 shadow-black/70' : 'bg-white/95 backdrop-blur-xl shadow-black/20',
                )}
              >
                <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
                  <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)' }} />
                  <motion.div
                    className="absolute inset-0"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.6, ease: 'linear', repeat: Infinity }}
                  >
                    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                      <circle cx="60" cy="60" r="54" stroke="rgba(139,92,246,0.15)" strokeWidth="3" />
                      <path d="M60 6 A54 54 0 0 1 113.97 67.5" stroke="url(#arcGrad)" strokeWidth="3" strokeLinecap="round" />
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
                  <p className="text-sm font-bold text-foreground tracking-tight">
                    {exportLoadingType === 'pdf' && mode === 'latex' ? 'Compilando con pdflatex...' : 'Generando archivo...'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {exportFormatLabel[exportLoadingType] ?? 'Archivo'} · por favor espera
                  </p>
                  <div className="flex items-center justify-center gap-1 pt-1">
                    {[0, 1, 2].map((i) => (
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

      {/* Click-outside overlay — below all dropdowns */}
      {(showExportMenu || showModeDropdown) && (
        <div
          className="fixed inset-0 z-[50]"
          onClick={() => { setShowExportMenu(false); setShowModeDropdown(false); }}
        />
      )}

      {/* ── Delete CV confirmation popup ───────────────────────────────────────── */}
      <AnimatePresence>
        {deleteConfirmId && (
          <DeleteCvConfirmModal
            onClose={() => setDeleteConfirmId(null)}
            onConfirm={() => handleDeleteConfirmed(deleteConfirmId)}
            loading={isDeleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── DeleteCvConfirmModal ──────────────────────────────────────────────────────

function DeleteCvConfirmModal({
  onClose,
  onConfirm,
  loading,
}: {
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const portalRoot = document.getElementById('portal-root') ?? document.body;
  return createPortal(
    <>
      <motion.div
        key="del-cv-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="absolute inset-0 z-[90] bg-background/75 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="absolute inset-0 z-[91] flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          key="del-cv-panel"
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          className="pointer-events-auto w-full max-w-sm rounded-2xl border border-border bg-card/95 backdrop-blur-sm p-6 shadow-2xl shadow-black/20"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-500/10">
              <Trash2 className="h-5 w-5 text-red-500" />
            </div>
            <div className="flex-1 pt-0.5">
              <h2 className="text-[15px] font-semibold text-foreground">Eliminar documento</h2>
              <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">
                ¿Estás seguro de eliminar este CV? Desaparecerá de tu lista pero podrá recuperarse si lo necesitas.
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-border py-2 text-[13px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 rounded-xl bg-red-500 py-2 text-[13px] font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-60"
            >
              {loading ? 'Eliminando…' : 'Sí, eliminar'}
            </button>
          </div>
        </motion.div>
      </div>
    </>,
    portalRoot,
  );
}

// ── Markdown Preview ───────────────────────────────────────────────────────────

function MarkdownPreview({ content, isDark }: { content: string; isDark: boolean }) {
  const lines = content.split('\n');
  return (
    <div className={cn('prose prose-sm max-w-none font-sans', isDark ? 'prose-invert' : '')}>
      {lines.map((line, i) => {
        if (line.startsWith('# '))
          return <h1 key={i} className="text-xl font-bold text-foreground mb-1 mt-0">{line.slice(2)}</h1>;
        if (line.startsWith('## '))
          return <h2 key={i} className="text-sm font-bold text-foreground uppercase tracking-wide mt-4 mb-1 pb-0.5 border-b border-border">{line.slice(3)}</h2>;
        if (line.startsWith('### '))
          return <h3 key={i} className="text-sm font-semibold text-foreground mt-3 mb-0.5">{line.slice(4)}</h3>;
        if (line.startsWith('---'))
          return <hr key={i} className="border-border my-2" />;
        if (line.startsWith('- '))
          return <li key={i} className="text-xs text-muted-foreground ml-4 mb-0.5">{renderInline(line.slice(2))}</li>;
        if (line.startsWith('```'))
          return <div key={i} className={cn('rounded-md px-3 py-1.5 my-1 font-mono text-xs', isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-muted text-zinc-700')}>{line.slice(3)}</div>;
        if (line.trim() === '')
          return <div key={i} className="h-1" />;
        return <p key={i} className="text-xs text-muted-foreground mb-0.5 leading-relaxed">{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono text-violet-600 dark:text-violet-300">{part.slice(1, -1)}</code>;
    return part;
  });
}

// ── Markdown → PDF HTML builder ───────────────────────────────────────────────
// Generates inline-styled HTML (no Tailwind/CSS-var dependencies) for html2pdf.js.

function buildMarkdownPdfHtml(content: string, profileImageUrl?: string): string {
  const WB = 'word-break:break-word;overflow-wrap:break-word;';
  const lines = content.split('\n');
  let html =
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:11pt;line-height:1.55;color:#111;max-width:100%;${WB}">`;

  let inCodeBlock = false;
  let inTable = false;
  let tableHtml = '';

  const flushTable = () => {
    if (!inTable) return;
    html += tableHtml + '</tbody></table>';
    tableHtml = '';
    inTable = false;
  };

  for (const line of lines) {
    // Code block toggle
    if (line.startsWith('```')) {
      flushTable();
      inCodeBlock = !inCodeBlock;
      if (inCodeBlock) {
        html += `<pre style="font-family:monospace;font-size:9pt;background:#f4f4f4;border:1px solid #ddd;padding:8px 10px;border-radius:4px;margin:6px 0;white-space:pre-wrap;${WB}">`;
      } else {
        html += '</pre>';
      }
      continue;
    }
    if (inCodeBlock) {
      html += esc(line) + '\n';
      continue;
    }

    // Markdown table rows (start with |)
    if (line.trim().startsWith('|')) {
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      // Separator row (---|---) → skip, already handled by thead/tbody split
      if (cells.every(c => /^[-:]+$/.test(c))) {
        // Convert first row already in tableHtml from tbody to thead
        if (inTable) {
          tableHtml = tableHtml.replace('<tbody>', '<thead>').replace(/<\/tr>$/, '</tr></thead><tbody>');
        }
        continue;
      }
      if (!inTable) {
        inTable = true;
        tableHtml = `<table style="width:100%;border-collapse:collapse;margin:6px 0;font-size:10pt;${WB}"><tbody>`;
      }
      const isHeader = !tableHtml.includes('<thead>');
      const tag = isHeader ? 'td' : 'td';
      tableHtml += '<tr>' + cells.map(c =>
        `<${tag} style="border:1px solid #ddd;padding:4px 8px;text-align:left">${inlineHtml(c)}</${tag}>`
      ).join('') + '</tr>';
      continue;
    }

    flushTable();

    if (line.trim() === '{{FOTO_PERFIL}}') {
      if (profileImageUrl) {
        html += `<div style="margin:8px 0"><img src="${profileImageUrl}" style="width:90px;height:90px;border-radius:50%;object-fit:cover;border:2px solid #ddd" crossorigin="anonymous"/></div>`;
      }
    } else if (line.startsWith('# ')) {
      html += `<h1 style="font-size:20pt;font-weight:700;margin:0 0 4px;padding:0;color:#111;border:0;${WB}">${inlineHtml(line.slice(2))}</h1>`;
    } else if (line.startsWith('## ')) {
      html += `<h2 style="font-size:13pt;font-weight:700;border-bottom:1.5px solid #6D28D9;padding-bottom:3px;margin:14px 0 6px;color:#1a1a1a;${WB}">${inlineHtml(line.slice(3))}</h2>`;
    } else if (line.startsWith('### ')) {
      html += `<h3 style="font-size:11pt;font-weight:700;margin:10px 0 3px;color:#222;${WB}">${inlineHtml(line.slice(4))}</h3>`;
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      html += `<div style="padding-left:18px;margin:2px 0;color:#333;${WB}">• ${inlineHtml(line.slice(2))}</div>`;
    } else if (/^\d+\. /.test(line)) {
      const num = line.match(/^(\d+)\. /)?.[1] ?? '';
      html += `<div style="padding-left:18px;margin:2px 0;color:#333;${WB}">${num}. ${inlineHtml(line.replace(/^\d+\. /, ''))}</div>`;
    } else if (line === '---' || line === '***' || line === '___') {
      html += `<hr style="border:0;border-top:1px solid #ccc;margin:10px 0"/>`;
    } else if (line.trim() === '') {
      html += `<div style="height:5px"></div>`;
    } else {
      html += `<p style="margin:2px 0;color:#333;${WB}">${inlineHtml(line)}</p>`;
    }
  }

  flushTable();
  if (inCodeBlock) html += '</pre>';
  html += '</div>';
  return html;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inlineHtml(text: string): string {
  // Links first (before esc so we can add href)
  const withLinks = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) =>
    `\x00LINK\x00${label}\x00${url}\x00`
  );
  const escaped = esc(withLinks);
  return escaped
    .replace(/\x00LINK\x00([^\x00]+)\x00([^\x00]+)\x00/g,
      (_, label, url) => `<a href="${url}" style="color:#6D28D9;text-decoration:none">${esc(label)}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g,
      '<code style="font-family:monospace;font-size:9pt;background:#f0f0f0;padding:1px 4px;border-radius:3px">$1</code>');
}

// ── LaTeX Preview ──────────────────────────────────────────────────────────────

function LaTeXPreview({ content, isDark }: { content: string; isDark: boolean }) {
  const commandCount = (content.match(/\\/g) || []).length;
  const packageMatches = content.match(/\\usepackage(?:\[[^\]]*\])?\{([^}]+)\}/g) || [];
  const packages = packageMatches
    .map((p) => { const m = p.match(/\{([^}]+)\}/); return m ? m[1] : ''; })
    .filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
        <div className="flex items-center gap-2 mb-1">
          <FileCode2 className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Documento LaTeX</p>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Usa el botón Exportar PDF para compilar con pdflatex, o descarga el .tex para editar en Overleaf.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Comandos', value: commandCount },
          { label: 'Paquetes', value: packages.length },
          { label: 'Líneas', value: content.split('\n').length },
          { label: 'Chars', value: content.length },
        ].map((stat) => (
          <div key={stat.label} className={cn('rounded-xl border border-border p-3 text-center', isDark ? 'bg-zinc-800/40' : 'bg-muted/30')}>
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {packages.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Paquetes detectados</p>
          <div className="flex flex-wrap gap-1.5">
            {packages.map((pkg) => (
              <span key={pkg} className={cn('rounded-md border border-border px-2 py-0.5 text-[11px] font-mono', isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-muted text-zinc-700')}>
                {pkg}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Código fuente</p>
        <pre className={cn('rounded-xl border border-border p-3 text-[11px] font-mono leading-relaxed overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent', isDark ? 'bg-zinc-900 text-zinc-300' : 'bg-muted text-zinc-700')}>
          {content.slice(0, 600)}{content.length > 600 ? '\n...' : ''}
        </pre>
      </div>
    </div>
  );
}
