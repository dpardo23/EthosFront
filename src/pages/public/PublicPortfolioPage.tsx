import { useMemo, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EthosLogoIcon } from '@/components/brand/EthosCoreLogo';
import {
  PortfolioBentoView,
  PORTFOLIO_MOCK_DASHBOARD,
  PORTFOLIO_MOCK_PROJECTS,
} from '@/pages/dashboard/PortfolioPage';
import {
  ArrowUpRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Eye,
  FolderKanban,
  Globe,
  GraduationCap,
  Link2,
  Mail,
  MapPin,
  MessageSquare,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { Badge, Button, Card, EmptyState, Progress } from '@/shared/ui';
import { useAuthStore } from '@/store/authStore';
import {
  mockConnections,
  mockHardSkills,
  mockLinkedinEducations,
  mockLinkedinExperiences,
  mockProjects,
  mockRecommendations,
  mockUsers,
} from '@/shared/mocks/data';
import {
  recruiterTalentHardSkills,
  recruiterTalentProjects,
  recruiterTalentUsers,
} from '@/shared/mocks/recruiterTalent';

type PublicProfile = {
  id: string;
  slug: string;
  name: string;
  profession: string;
  bio: string;
  location: string;
  website: string;
  email: string;
  avatar: string;
  headline: string;
  company: string;
  about: string;
  skills: Array<{
    id: string;
    name: string;
    category: string;
    levelLabel: string;
    levelValue: number;
    endorsements: number;
    featured: boolean;
  }>;
  projects: Array<{
    id: string;
    title: string;
    description: string;
    image?: string;
    technologies: string[];
    role: string;
    result: string;
    liveUrl?: string;
  }>;
  experiences: Array<{
    id: string;
    title: string;
    company: string;
    location: string;
    period: string;
    description: string;
  }>;
  education: Array<{
    id: string;
    title: string;
    school: string;
    period: string;
    description: string;
  }>;
  highlights: string[];
  recommendations: Array<{
    id: string;
    author: string;
    role: string;
    text: string;
  }>;
  stats: {
    profileViews: number;
    projectCount: number;
    recommendations: number;
    connections: number;
  };
};

function buildPublicProfile(slug: string): PublicProfile | null {
  const allUsers = [...mockUsers, ...recruiterTalentUsers];
  const allHardSkills = [...mockHardSkills, ...recruiterTalentHardSkills];
  const allProjects = [...mockProjects, ...recruiterTalentProjects];
  const user = allUsers.find((item) => item.slug === slug);
  if (!user) {
    return null;
  }

  const hardSkills = allHardSkills.filter((item) => item.userId === user.id);
  const projects = allProjects.filter((item) => item.userId === user.id && item.isPublic);
  const experiences = mockLinkedinExperiences.slice(0, 3);
  const education = mockLinkedinEducations.slice(0, 2);
  const recommendations = mockRecommendations.filter((item) => item.isPublic).slice(0, 3);
  const connections = mockConnections.filter((item) => item.userId === user.id);

  const headlineBySlug: Record<string, string> = {
    'carlos-mendoza': 'Senior Full Stack Developer | React, Node.js y Cloud Architecture',
    'maria-lopez': 'UX/UI Designer | Product thinking, systems y experiencias digitales',
    'pedro-ramirez': 'Backend Engineer | APIs, sistemas distribuidos y microservicios',
  };

  const companyBySlug: Record<string, string> = {
    'carlos-mendoza': 'TechCorp Solutions',
    'maria-lopez': 'Independent Product Designer',
    'pedro-ramirez': 'ScaleStack Labs',
  };

  const aboutBySlug: Record<string, string> = {
    'carlos-mendoza':
      'Ingeniero enfocado en producto con experiencia construyendo aplicaciones web escalables, dashboards internos y experiencias publicas cuidadas de punta a punta. Combino criterio tecnico con una mirada fuerte en claridad, performance y comunicacion.',
    'maria-lopez':
      'Disenadora de producto centrada en interfaces claras, accesibles y expresivas. Trabajo entre investigacion, definicion visual y sistemas de diseno para llevar ideas complejas a experiencias simples.',
    'pedro-ramirez':
      'Backend engineer especializado en arquitectura de servicios, integraciones y observabilidad. Me interesa que la base tecnica sea robusta, sostenible y facil de evolucionar con el tiempo.',
  };

  const highlightsBySlug: Record<string, string[]> = {
    'carlos-mendoza': [
      '8+ anos construyendo productos digitales con impacto real.',
      'Experiencia liderando migraciones frontend y decisiones de arquitectura.',
      'Fuerte enfoque en performance, DX y coherencia visual entre equipos.',
    ],
    'maria-lopez': [
      'Sistemas de diseno adaptados a producto y marca.',
      'Experiencia en UX para portfolios, dashboards y herramientas B2B.',
      'Trabajo cercano con producto, contenido y desarrollo.',
    ],
    'pedro-ramirez': [
      'Diseno de servicios backend confiables y observables.',
      'Automatizacion de flujos, integraciones y procesos de despliegue.',
      'Capacidad para convertir requisitos difusos en soluciones mantenibles.',
    ],
  };

  const userSlug = user.slug || '';

  return {
    id: user.id,
    slug: user?.slug || '',
    name: user.name || '',
    profession: user.profession || '',
    bio: user?.bio || '',
    location: user.location || '',
    website: user.website || '',
    email: user.email || '',
    avatar: user.avatar || '',
    headline: headlineBySlug[userSlug] ?? user.profession ?? '',
    company: companyBySlug[userSlug] ?? user.company ?? 'Professional Profile',
    about: aboutBySlug[userSlug] ?? user.bio ?? '',
    skills: hardSkills.slice(0, 6).map((skill) => ({
      id: skill.id,
      name: skill.skillTag.name,
      category: skill.skillTag.category,
      levelLabel: skill.level,
      levelValue: skill.level === 'Senior' ? 92 : skill.level === 'Mid' ? 76 : 58,
      endorsements: skill.endorsements.length,
      featured: skill.isTop,
    })),
    projects: projects.slice(0, 3).map((project) => ({
      id: project.id,
      title: project.title,
      description: project.description,
      image: project.thumbnail,
      technologies: project.technicalInfo.technologies.slice(0, 5),
      role: project.technicalInfo.role,
      result: project.technicalInfo.results,
      liveUrl: project.media[0]?.url,
    })),
    experiences: experiences.map((item) => ({
      id: item.id,
      title: item.position,
      company: item.company,
      location: item.location,
      period: item.isCurrent ? `${item.startDate} - Actualidad` : `${item.startDate} - ${item.endDate}`,
      description: item.description,
    })),
    education: education.map((item) => ({
      id: item.id,
      title: `${item.degree} en ${item.field}`,
      school: item.institution,
      period: `${item.startDate} - ${item.endDate}`,
      description: 'Formacion orientada a fundamentos, criterio tecnico y crecimiento profesional.',
    })),
    highlights: (user.slug && highlightsBySlug[user.slug]) ? highlightsBySlug[user.slug] : ['Perfil profesional en construcción.'],
    recommendations: recommendations.map((item) => ({
      id: item.id,
      author: item.authorName,
      role: item.authorPosition,
      text: item.content,
    })),
    stats: {
      profileViews:
        user.slug === 'carlos-mendoza' ? 18420 : user.slug === 'maria-lopez' ? 9630 : 7240,
      projectCount: projects.length,
      recommendations: recommendations.length,
      connections: connections.length * 78,
    },
  };
}

export default function PublicPortfolioPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuthStore();

  const profile = useMemo(() => {
    if (!slug) {
      return null;
    }
    return buildPublicProfile(slug);
  }, [slug]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
          <div className="mb-5 flex items-center gap-2.5">
            <EthosLogoIcon size={18} animate={false} />
            <span className="text-[11px] font-semibold tracking-wide text-muted-foreground/70">EthosHub</span>
            <span className="text-[11px] text-muted-foreground/35">·</span>
            <span className="text-[11px] text-muted-foreground/50">Portafolio Profesional</span>
            <div className="flex-1" />
            <Link to="/login">
              <Button size="sm" variant="outline" className="h-7 text-xs px-3">Entrar</Button>
            </Link>
          </div>
          <PortfolioBentoView
            data={PORTFOLIO_MOCK_DASHBOARD}
            projects={PORTFOLIO_MOCK_PROJECTS}
            isPublicView={true}
            profileGithub="@alex-ramirez"
          />
        </div>
      </div>
    );
  }

  const isGuestPreview = !isAuthenticated;

  return (
    <div className="min-h-screen pt-20 bg-[linear-gradient(180deg,rgba(59,130,246,0.08),transparent_22%),linear-gradient(135deg,rgba(15,23,42,0.02),transparent_30%)]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
          <div className="h-36 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.35),transparent_34%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_24%),linear-gradient(120deg,#eff6ff_0%,#ffffff_50%,#f8fafc_100%)] sm:h-40" />
          <div className="px-5 pb-5 sm:px-8 sm:pb-8">
            <div className="-mt-12 flex flex-col gap-5 sm:-mt-16 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-5">
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="h-24 w-24 rounded-3xl border-4 border-background object-cover shadow-lg sm:h-28 sm:w-28"
                />
                <div className="min-w-0 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                      {profile.name}
                    </h1>
                    <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                      <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                      Profesional
                    </Badge>
                  </div>
                  <p className="mt-2 max-w-xl text-base leading-7 text-foreground/90 sm:text-lg">
                    {profile.headline}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {profile.company}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {isGuestPreview ? 'correo oculto para invitados' : profile.email}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Link to="/login">
                  <Button>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    {isGuestPreview ? 'Crear cuenta para contactar' : 'Contactar'}
                  </Button>
                </Link>
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noreferrer">
                    <Button variant="outline">
                      <Globe className="mr-2 h-4 w-4" />
                      Sitio web
                    </Button>
                  </a>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Visualizaciones"
                value={profile.stats.profileViews.toLocaleString()}
                icon={Eye}
              />
              <StatCard
                label="Proyectos publicos"
                value={String(profile.stats.projectCount)}
                icon={FolderKanban}
              />
              <StatCard
                label="Recomendaciones"
                value={String(profile.stats.recommendations)}
                icon={Star}
              />
              <StatCard
                label="Red profesional"
                value={profile.stats.connections.toLocaleString()}
                icon={Users}
              />
            </div>
          </div>
        </section>

        {isGuestPreview && (
          <div className="mt-5 rounded-[1.75rem] border border-primary/20 bg-primary/5 px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-foreground">Vista previa para invitados</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Puedes ver la estructura del perfil, pero la informacion detallada esta protegida.
                  Crea una cuenta o inicia sesion para desbloquear el perfil completo y contactar a
                  este profesional.
                </p>
              </div>
              <Link to="/login" className="shrink-0">
                <Button>Crear cuenta o iniciar sesion</Button>
              </Link>
            </div>
          </div>
        )}

        {isGuestPreview && (
          <div className="mt-4 rounded-[1.5rem] border border-amber-200 bg-amber-50/80 px-5 py-4">
            <p className="text-sm font-semibold text-amber-900">Modo invitado</p>
            <p className="mt-1 text-sm leading-6 text-amber-800">
              Estas viendo una version restringida del perfil. La informacion detallada aparece
              difuminada para demostrar que un invitado no puede consultar experiencia, proyectos,
              skills ni contacto completo hasta iniciar sesion o crear cuenta.
            </p>
          </div>
        )}

        <div className="mt-8 grid gap-6 xl:gap-8 lg:grid-cols-[1.35fr_0.65fr]">
          <main className="space-y-6 xl:space-y-8">
            <ProtectedPreview
              isLocked={isGuestPreview}
              title="Desbloquea el resumen completo"
              description="Crea tu cuenta para ver el detalle profesional, logros y contexto completo de este perfil."
            >
              <Card className="rounded-[1.75rem] p-5 sm:p-7">
                <SectionTitle title="Acerca de" icon={Sparkles} />
                <p className="mt-4 text-[15px] leading-7 text-muted-foreground">{profile.about}</p>
                <div className="mt-6 grid gap-3">
                  {profile.highlights.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </Card>
            </ProtectedPreview>

            <ProtectedPreview
              isLocked={isGuestPreview}
              title="Experiencia reservada"
              description="Inicia sesion para revisar roles, empresas y trayectoria profesional en detalle."
            >
              <Card className="rounded-[1.75rem] p-5 sm:p-7">
                <SectionTitle title="Experiencia" icon={Briefcase} />
                <div className="mt-6 space-y-5">
                  {profile.experiences.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-border bg-background/70 p-4 sm:p-5"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                          <p className="text-sm font-medium text-primary">{item.company}</p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>{item.period}</p>
                          <p>{item.location}</p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    </article>
                  ))}
                </div>
              </Card>
            </ProtectedPreview>

            <ProtectedPreview
              isLocked={isGuestPreview}
              title="Proyectos visibles al registrarte"
              description="Crea una cuenta para entrar al detalle de proyectos, stack y resultados obtenidos."
            >
              <Card className="rounded-[1.75rem] p-5 sm:p-7">
                <SectionTitle title="Proyectos destacados" icon={FolderKanban} />
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {profile.projects.map((project) => (
                    <article
                      key={project.id}
                      className="overflow-hidden rounded-[1.5rem] border border-border bg-background/75"
                    >
                      {project.image && (
                        <img
                          src={project.image}
                          alt={project.title}
                          className="h-44 w-full object-cover"
                        />
                      )}
                      <div className="p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-lg font-semibold text-foreground">{project.title}</h3>
                          {project.liveUrl && (
                            <a href={project.liveUrl} target="_blank" rel="noreferrer">
                              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                            </a>
                          )}
                        </div>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                          {project.description}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {project.technologies.map((tech) => (
                            <Badge key={tech} variant="outline">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                        <div className="mt-4 rounded-2xl bg-muted/60 p-3 text-sm">
                          <p className="font-medium text-foreground">Rol: {project.role}</p>
                          <p className="mt-1 text-muted-foreground">{project.result}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </Card>
            </ProtectedPreview>
          </main>

          <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            <ProtectedPreview
              isLocked={isGuestPreview}
              title="Skills protegidas"
              description="Registrate para explorar habilidades, nivel y validaciones del perfil."
            >
              <Card className="rounded-[1.75rem] p-5 sm:p-6">
                <SectionTitle title="Skills principales" icon={Sparkles} />
                <div className="mt-5 space-y-4">
                  {profile.skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="rounded-2xl border border-border bg-background/70 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{skill.name}</p>
                            {skill.featured && (
                              <Badge variant="secondary" className="bg-primary/10 text-primary">
                                Top
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            {skill.category}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">
                          {skill.levelLabel}
                        </span>
                      </div>
                      <div className="mt-3">
                        <Progress value={skill.levelValue} size="sm" />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {skill.endorsements} validaciones visibles
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </ProtectedPreview>

            <ProtectedPreview
              isLocked={isGuestPreview}
              title="Educacion privada"
              description="Inicia sesion para consultar formacion, instituciones y recorrido academico."
            >
              <Card className="rounded-[1.75rem] p-5 sm:p-6">
                <SectionTitle title="Educacion" icon={GraduationCap} />
                <div className="mt-5 space-y-4">
                  {profile.education.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-border bg-background/70 p-4"
                    >
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="mt-1 text-sm text-primary">{item.school}</p>
                      <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                        {item.period}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </ProtectedPreview>

            <ProtectedPreview
              isLocked={isGuestPreview}
              title="Recomendaciones bloqueadas"
              description="Crea tu cuenta para ver referencias completas y contexto profesional."
            >
              <Card className="rounded-[1.75rem] p-5 sm:p-6">
                <SectionTitle title="Recomendaciones" icon={Users} />
                <div className="mt-5 space-y-4">
                  {profile.recommendations.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-border bg-background/70 p-4"
                    >
                      <p className="text-sm leading-6 text-foreground">&ldquo;{item.text}&rdquo;</p>
                      <div className="mt-3">
                        <p className="text-sm font-medium text-foreground">{item.author}</p>
                        <p className="text-xs text-muted-foreground">{item.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </ProtectedPreview>

            <ProtectedPreview
              isLocked={isGuestPreview}
              title="Contacto disponible al iniciar sesion"
              description="Entra o crea tu cuenta para ver y usar los enlaces de contacto completos."
            >
              <Card className="rounded-[1.75rem] p-5 sm:p-6">
                <SectionTitle title="Links" icon={Link2} />
                <div className="mt-5 space-y-3">
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/70"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" />
                        Sitio personal
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                  <a
                    href={`mailto:${profile.email}`}
                    className="flex items-center justify-between rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/70"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      Correo profesional
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  </a>
                </div>
              </Card>
            </ProtectedPreview>
          </aside>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  icon: Icon,
}: {
  title: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/80 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function ProtectedPreview({
  isLocked,
  title,
  description,
  children,
}: {
  isLocked: boolean;
  title: string;
  description: string;
  children: ReactNode;
}) {
  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-hidden rounded-[1.75rem]">
      <div className="pointer-events-none select-none blur-[10px] saturate-[0.75] opacity-70 scale-[1.01]">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/58 p-4">
        <div className="w-full max-w-sm rounded-[1.5rem] border border-border bg-card/95 p-5 text-center shadow-xl backdrop-blur">
          <p className="text-base font-semibold text-foreground">{title}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          <Link to="/login" className="mt-4 inline-flex">
            <Button>Crear cuenta para ver mas</Button>
          </Link>
          <p className="mt-3 text-xs text-muted-foreground">
            Si ya tienes cuenta, tambien puedes iniciar sesion desde aqui.
          </p>
        </div>
      </div>
    </div>
  );
}
