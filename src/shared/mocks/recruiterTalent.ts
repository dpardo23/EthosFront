import type {
  HardSkill,
  Project,
  ProjectCategory,
  SkillCategory,
  SkillLevel,
  SoftSkill,
  User,
} from '../types';

export type TalentAvailability = 'Disponible' | 'Entrevistas' | 'Explorando';
export type TalentWorkMode = 'Remoto' | 'Hibrido' | 'Presencial';

type TalentHardSkill = {
  name: string;
  category: SkillCategory;
  level: SkillLevel;
  isTop?: boolean;
  endorsements: number;
  topOrder?: number;
};

export interface RecruiterTalentProfile {
  user: User;
  experienceYears: number;
  expectedRole: string;
  availability: TalentAvailability;
  workMode: TalentWorkMode;
  summary: string;
  hardSkills: TalentHardSkill[];
  softSkills: string[];
  portfolioHighlights: string[];
}

export const recruiterTalentProfiles: RecruiterTalentProfile[] = [
  {
    user: {
      id: '6',
      email: 'laura.martinez@ethoshub.dev',
      name: 'Laura Martinez',
      avatar:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face',
      username: 'lauramartinez',
      role: 'professional',
      slug: 'laura-martinez',
      profession: 'Senior Frontend Engineer',
      bio: 'Frontend engineer enfocada en experiencias de producto cuidadas y escalables para plataformas B2B.',
      headline: 'React, TypeScript y design systems para productos de alto impacto.',
      location: 'Bogota, Colombia',
      website: 'https://portfolio.ethoshub.dev/laura-martinez',
      company: 'Pixel Forge',
      createdAt: '2024-02-10T10:00:00Z',
    },
    experienceYears: 8,
    expectedRole: 'Senior Frontend Engineer',
    availability: 'Disponible',
    workMode: 'Remoto',
    summary:
      'Ha liderado refactors frontend, sistemas de componentes y optimizacion de performance para productos SaaS.',
    hardSkills: [
      { name: 'React', category: 'Frontend', level: 'Senior', isTop: true, endorsements: 21 },
      { name: 'TypeScript', category: 'Frontend', level: 'Senior', isTop: true, endorsements: 17 },
      { name: 'JavaScript', category: 'Frontend', level: 'Senior', isTop: true, endorsements: 19 },
      { name: 'Next.js', category: 'Frontend', level: 'Senior', endorsements: 12 },
      { name: 'Tailwind CSS', category: 'Frontend', level: 'Mid', endorsements: 9 },
    ],
    softSkills: ['Comunicacion efectiva', 'Mentoria', 'Pensamiento critico'],
    portfolioHighlights: ['Design system enterprise', 'Migracion React 18'],
  },
  {
    user: {
      id: '7',
      email: 'diego.herrera@ethoshub.dev',
      name: 'Diego Herrera',
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face',
      username: 'diegoherrera',
      role: 'professional',
      slug: 'diego-herrera',
      profession: 'Senior Full Stack Developer',
      bio: 'Construye productos web end-to-end con foco en mantenibilidad, velocidad de entrega y arquitectura pragmatica.',
      headline: 'Full stack con React, Node.js y una fuerte cultura de producto.',
      location: 'Medellin, Colombia',
      website: 'https://portfolio.ethoshub.dev/diego-herrera',
      company: 'LaunchPath',
      createdAt: '2024-02-11T10:00:00Z',
    },
    experienceYears: 9,
    expectedRole: 'Senior Full Stack Developer',
    availability: 'Entrevistas',
    workMode: 'Hibrido',
    summary:
      'Ha participado en construccion de MVPs y escalamiento de plataformas con millones de eventos de usuario.',
    hardSkills: [
      { name: 'React', category: 'Frontend', level: 'Senior', isTop: true, endorsements: 16 },
      { name: 'Node.js', category: 'Backend', level: 'Senior', isTop: true, endorsements: 18 },
      { name: 'JavaScript', category: 'Frontend', level: 'Senior', isTop: true, endorsements: 14 },
      { name: 'PostgreSQL', category: 'Data', level: 'Mid', endorsements: 8 },
      { name: 'AWS', category: 'Infrastructure', level: 'Mid', endorsements: 6 },
    ],
    softSkills: ['Liderazgo tecnico', 'Colaboracion', 'Orientacion a negocio'],
    portfolioHighlights: ['Marketplace multi-tenant', 'Suite de onboarding para SaaS'],
  },
  {
    user: {
      id: '8',
      email: 'sofia.navarro@ethoshub.dev',
      name: 'Sofia Navarro',
      avatar:
        'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&h=300&fit=crop&crop=face',
      username: 'sofianavarro',
      role: 'professional',
      slug: 'sofia-navarro',
      profession: 'Senior Java Backend Engineer',
      bio: 'Especialista en ecosistemas Java y servicios distribuidos para fintech y plataformas transaccionales.',
      headline: 'Java, Spring Boot y microservicios robustos para entornos de alta demanda.',
      location: 'Lima, Peru',
      website: 'https://portfolio.ethoshub.dev/sofia-navarro',
      company: 'CoreBank Tech',
      createdAt: '2024-02-12T10:00:00Z',
    },
    experienceYears: 10,
    expectedRole: 'Senior Java Backend Engineer',
    availability: 'Disponible',
    workMode: 'Remoto',
    summary:
      'Ha disenado APIs transaccionales, procesamiento asincrono y observabilidad para sistemas criticos.',
    hardSkills: [
      { name: 'Java', category: 'Backend', level: 'Senior', isTop: true, endorsements: 24 },
      { name: 'Spring Boot', category: 'Backend', level: 'Senior', isTop: true, endorsements: 20 },
      { name: 'Microservices', category: 'Backend', level: 'Senior', isTop: true, endorsements: 18 },
      { name: 'PostgreSQL', category: 'Data', level: 'Senior', endorsements: 11 },
      { name: 'Kafka', category: 'Backend', level: 'Mid', endorsements: 9 },
    ],
    softSkills: ['Pensamiento analitico', 'Ownership', 'Resolucion de problemas'],
    portfolioHighlights: ['Core bancario modular', 'Motor de pagos en tiempo real'],
  },
  {
    user: {
      id: '9',
      email: 'andres.paredes@ethoshub.dev',
      name: 'Andres Paredes',
      avatar:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face',
      username: 'andresparedes',
      role: 'professional',
      slug: 'andres-paredes',
      profession: 'Software Engineer',
      bio: 'Ingeniero de software con base backend y fuerte interes por APIs limpias y sistemas internos confiables.',
      headline: 'Java y Kotlin para productos transaccionales y tooling interno.',
      location: 'Quito, Ecuador',
      website: 'https://portfolio.ethoshub.dev/andres-paredes',
      company: 'FlowOps',
      createdAt: '2024-02-13T10:00:00Z',
    },
    experienceYears: 5,
    expectedRole: 'Mid Software Engineer',
    availability: 'Explorando',
    workMode: 'Hibrido',
    summary:
      'Suma experiencia en mantenimiento evolutivo, integraciones REST y automatizacion de procesos operativos.',
    hardSkills: [
      { name: 'Java', category: 'Backend', level: 'Mid', isTop: true, endorsements: 11 },
      { name: 'Kotlin', category: 'Backend', level: 'Mid', isTop: true, endorsements: 8 },
      { name: 'REST API', category: 'Backend', level: 'Mid', isTop: true, endorsements: 10 },
      { name: 'Docker', category: 'Infrastructure', level: 'Mid', endorsements: 6 },
      { name: 'Git', category: 'Infrastructure', level: 'Senior', endorsements: 7 },
    ],
    softSkills: ['Aprendizaje continuo', 'Autonomia', 'Comunicacion transversal'],
    portfolioHighlights: ['Integraciones B2B para ERP', 'Backoffice de operaciones'],
  },
  {
    user: {
      id: '10',
      email: 'camila.torres@ethoshub.dev',
      name: 'Camila Torres',
      avatar:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=face',
      username: 'camilatorres',
      role: 'professional',
      slug: 'camila-torres',
      profession: 'QA Automation Engineer',
      bio: 'Disena estrategias de calidad automatizada para releases frecuentes y productos de alto trafico.',
      headline: 'Playwright, Cypress y calidad continua integrada al ciclo de desarrollo.',
      location: 'Santiago, Chile',
      website: 'https://portfolio.ethoshub.dev/camila-torres',
      company: 'Release Loop',
      createdAt: '2024-02-14T10:00:00Z',
    },
    experienceYears: 6,
    expectedRole: 'Senior QA Automation Engineer',
    availability: 'Disponible',
    workMode: 'Remoto',
    summary:
      'Especialista en automatizacion de regresion, testing de APIs y acompanamiento de equipos de desarrollo.',
    hardSkills: [
      { name: 'Playwright', category: 'Frontend', level: 'Senior', isTop: true, endorsements: 13 },
      { name: 'Cypress', category: 'Frontend', level: 'Senior', isTop: true, endorsements: 15 },
      { name: 'JavaScript', category: 'Frontend', level: 'Mid', isTop: true, endorsements: 9 },
      { name: 'REST API', category: 'Backend', level: 'Mid', endorsements: 7 },
      { name: 'Agile/Scrum', category: 'Soft Skill', level: 'Senior', endorsements: 10 },
    ],
    softSkills: ['Atencion al detalle', 'Feedback claro', 'Trabajo en equipo'],
    portfolioHighlights: ['Framework E2E reusable', 'QA dashboard para releases'],
  },
  {
    user: {
      id: '11',
      email: 'mateo.castro@ethoshub.dev',
      name: 'Mateo Castro',
      avatar:
        'https://images.unsplash.com/photo-1504593811423-6dd665756598?w=300&h=300&fit=crop&crop=face',
      username: 'mateocastro',
      role: 'professional',
      slug: 'mateo-castro',
      profession: 'Senior DevOps Engineer',
      bio: 'Fortalece plataformas cloud con foco en confiabilidad, despliegues seguros y observabilidad.',
      headline: 'AWS, Docker y Kubernetes para plataformas que necesitan escalar con calma.',
      location: 'Monterrey, Mexico',
      website: 'https://portfolio.ethoshub.dev/mateo-castro',
      company: 'InfraCloud',
      createdAt: '2024-02-15T10:00:00Z',
    },
    experienceYears: 9,
    expectedRole: 'Senior DevOps Engineer',
    availability: 'Entrevistas',
    workMode: 'Remoto',
    summary:
      'Ha llevado a equipos desde despliegues manuales hasta pipelines consolidados con infraestructura reproducible.',
    hardSkills: [
      { name: 'AWS', category: 'Infrastructure', level: 'Senior', isTop: true, endorsements: 18 },
      { name: 'Docker', category: 'Infrastructure', level: 'Senior', isTop: true, endorsements: 15 },
      { name: 'Kubernetes', category: 'Infrastructure', level: 'Senior', isTop: true, endorsements: 14 },
      { name: 'Terraform', category: 'Infrastructure', level: 'Senior', endorsements: 11 },
      { name: 'Python', category: 'Backend', level: 'Mid', endorsements: 6 },
    ],
    softSkills: ['Priorizacion', 'Calma bajo presion', 'Documentacion'],
    portfolioHighlights: ['Plataforma de despliegue continuo', 'Observabilidad centralizada'],
  },
  {
    user: {
      id: '12',
      email: 'daniela.vega@ethoshub.dev',
      name: 'Daniela Vega',
      avatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=face',
      username: 'danielavega',
      role: 'professional',
      slug: 'daniela-vega',
      profession: 'Senior Data Engineer',
      bio: 'Convierte datos dispersos en pipelines confiables y accesibles para analitica y producto.',
      headline: 'Python, SQL y orquestacion de datos para decisiones mejor informadas.',
      location: 'Buenos Aires, Argentina',
      website: 'https://portfolio.ethoshub.dev/daniela-vega',
      company: 'Signal Data',
      createdAt: '2024-02-16T10:00:00Z',
    },
    experienceYears: 8,
    expectedRole: 'Senior Data Engineer',
    availability: 'Disponible',
    workMode: 'Hibrido',
    summary:
      'Ha modernizado pipelines batch y near real-time para areas de growth, riesgo y operaciones.',
    hardSkills: [
      { name: 'Python', category: 'Backend', level: 'Senior', isTop: true, endorsements: 17 },
      { name: 'SQL', category: 'Data', level: 'Senior', isTop: true, endorsements: 15 },
      { name: 'Airflow', category: 'Data', level: 'Senior', isTop: true, endorsements: 12 },
      { name: 'AWS', category: 'Infrastructure', level: 'Mid', endorsements: 7 },
      { name: 'Java', category: 'Backend', level: 'Mid', endorsements: 5 },
    ],
    softSkills: ['Curiosidad', 'Pensamiento sistemico', 'Comunicacion con negocio'],
    portfolioHighlights: ['Lakehouse para analytics', 'Pipeline de riesgo crediticio'],
  },
  {
    user: {
      id: '13',
      email: 'nicolas.pena@ethoshub.dev',
      name: 'Nicolas Pena',
      avatar:
        'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=300&h=300&fit=crop&crop=face',
      username: 'nicolaspena',
      role: 'professional',
      slug: 'nicolas-pena',
      profession: 'Mobile Frontend Engineer',
      bio: 'Especialista en productos mobile-first con foco en performance percibida y experiencias fluidas.',
      headline: 'React Native y JavaScript para apps que se sienten rapidas y claras.',
      location: 'Ciudad de Mexico, Mexico',
      website: 'https://portfolio.ethoshub.dev/nicolas-pena',
      company: 'Pocket Labs',
      createdAt: '2024-02-17T10:00:00Z',
    },
    experienceYears: 6,
    expectedRole: 'Senior React Native Engineer',
    availability: 'Explorando',
    workMode: 'Remoto',
    summary:
      'Ha trabajado en apps de suscripcion y billeteras digitales, mejorando activacion y retencion.',
    hardSkills: [
      { name: 'React Native', category: 'Frontend', level: 'Senior', isTop: true, endorsements: 16 },
      { name: 'JavaScript', category: 'Frontend', level: 'Senior', isTop: true, endorsements: 14 },
      { name: 'React', category: 'Frontend', level: 'Mid', isTop: true, endorsements: 10 },
      { name: 'TypeScript', category: 'Frontend', level: 'Mid', endorsements: 8 },
      { name: 'Expo', category: 'Frontend', level: 'Senior', endorsements: 11 },
    ],
    softSkills: ['Empatia con usuario', 'Ownership', 'Adaptabilidad'],
    portfolioHighlights: ['App fintech mobile-first', 'Checkout in-app optimizado'],
  },
  {
    user: {
      id: '14',
      email: 'paula.rojas@ethoshub.dev',
      name: 'Paula Rojas',
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face',
      username: 'paularojas',
      role: 'professional',
      slug: 'paula-rojas',
      profession: 'Frontend Developer',
      bio: 'Construye interfaces accesibles, mantenibles y consistentes para equipos de producto en crecimiento.',
      headline: 'JavaScript, React y CSS con foco fuerte en accesibilidad y detalle visual.',
      location: 'La Paz, Bolivia',
      website: 'https://portfolio.ethoshub.dev/paula-rojas',
      company: 'North Studio',
      createdAt: '2024-02-18T10:00:00Z',
    },
    experienceYears: 4,
    expectedRole: 'Mid Frontend Developer',
    availability: 'Disponible',
    workMode: 'Presencial',
    summary:
      'Trabaja muy cerca con diseno y producto para aterrizar experiencias claras con velocidad de iteracion.',
    hardSkills: [
      { name: 'JavaScript', category: 'Frontend', level: 'Senior', isTop: true, endorsements: 12 },
      { name: 'React', category: 'Frontend', level: 'Mid', isTop: true, endorsements: 10 },
      { name: 'Tailwind CSS', category: 'Frontend', level: 'Senior', isTop: true, endorsements: 11 },
      { name: 'TypeScript', category: 'Frontend', level: 'Mid', endorsements: 6 },
      { name: 'Accessibility', category: 'Backend', level: 'Senior', endorsements: 7 },
    ],
    softSkills: ['Escucha activa', 'Organizacion', 'Colaboracion'],
    portfolioHighlights: ['Portal de autoservicio', 'Biblioteca de componentes accesibles'],
  },
  {
    user: {
      id: '15',
      email: 'javier.salas@ethoshub.dev',
      name: 'Javier Salas',
      avatar:
        'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=300&h=300&fit=crop&crop=face',
      username: 'javiersalas',
      role: 'professional',
      slug: 'javier-salas',
      profession: 'Senior Full Stack Engineer',
      bio: 'Conecta frontends modernos con servicios backend y decisiones tecnicas realistas para producto.',
      headline: 'React, Node.js y GraphQL para aplicaciones complejas con buena DX.',
      location: 'Guadalajara, Mexico',
      website: 'https://portfolio.ethoshub.dev/javier-salas',
      company: 'Nimbus Commerce',
      createdAt: '2024-02-19T10:00:00Z',
    },
    experienceYears: 8,
    expectedRole: 'Senior Full Stack Engineer',
    availability: 'Entrevistas',
    workMode: 'Hibrido',
    summary:
      'Ha guiado equipos en evoluciones de arquitectura sin perder foco en velocidad de entrega y calidad.',
    hardSkills: [
      { name: 'React', category: 'Frontend', level: 'Senior', isTop: true, endorsements: 17 },
      { name: 'JavaScript', category: 'Frontend', level: 'Senior', isTop: true, endorsements: 15 },
      { name: 'Node.js', category: 'Backend', level: 'Senior', isTop: true, endorsements: 16 },
      { name: 'Java', category: 'Backend', level: 'Mid', endorsements: 8 },
      { name: 'GraphQL', category: 'Backend', level: 'Mid', endorsements: 9 },
    ],
    softSkills: ['Negociacion', 'Liderazgo tecnico', 'Toma de decisiones'],
    portfolioHighlights: ['BFF para ecommerce', 'Plataforma interna de growth'],
  },
  {
    user: {
      id: '16',
      email: 'fernanda.molina@ethoshub.dev',
      name: 'Fernanda Molina',
      avatar:
        'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=300&h=300&fit=crop&crop=face',
      username: 'fernandamolina',
      role: 'professional',
      slug: 'fernanda-molina',
      profession: 'Frontend Lead',
      bio: 'Lidera equipos frontend con foco en calidad de interfaz, coherencia tecnica y crecimiento de personas.',
      headline: 'Frontend leadership con React, TypeScript y vision de producto.',
      location: 'Montevideo, Uruguay',
      website: 'https://portfolio.ethoshub.dev/fernanda-molina',
      company: 'Orbit Products',
      createdAt: '2024-02-20T10:00:00Z',
    },
    experienceYears: 11,
    expectedRole: 'Frontend Lead',
    availability: 'Disponible',
    workMode: 'Remoto',
    summary:
      'Combina ejecucion hands-on con liderazgo de equipo, mentoring y maduracion de practicas frontend.',
    hardSkills: [
      { name: 'React', category: 'Frontend', level: 'Senior', isTop: true, endorsements: 23 },
      { name: 'TypeScript', category: 'Frontend', level: 'Senior', isTop: true, endorsements: 19 },
      { name: 'JavaScript', category: 'Frontend', level: 'Senior', isTop: true, endorsements: 18 },
      { name: 'Next.js', category: 'Frontend', level: 'Senior', endorsements: 13 },
      { name: 'GraphQL', category: 'Backend', level: 'Mid', endorsements: 7 },
    ],
    softSkills: ['Mentoria', 'Liderazgo', 'Comunicacion ejecutiva'],
    portfolioHighlights: ['Design platform multi-producto', 'Refactor de portal corporativo'],
  },
  {
    user: {
      id: '17',
      email: 'ricardo.leon@ethoshub.dev',
      name: 'Ricardo Leon',
      avatar:
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop&crop=face',
      username: 'ricardoleon',
      role: 'professional',
      slug: 'ricardo-leon',
      profession: 'Backend Architect',
      bio: 'Arquitecto backend orientado a escalabilidad, integridad transaccional y evolucion sostenible de servicios.',
      headline: 'Java y Spring para plataformas backend robustas y orientadas a negocio.',
      location: 'San Jose, Costa Rica',
      website: 'https://portfolio.ethoshub.dev/ricardo-leon',
      company: 'ScaleStack Labs',
      createdAt: '2024-02-21T10:00:00Z',
    },
    experienceYears: 12,
    expectedRole: 'Backend Architect',
    availability: 'Entrevistas',
    workMode: 'Remoto',
    summary:
      'Ha modernizado monolitos, definido boundaries de dominio y acompanado decisiones de arquitectura de largo plazo.',
    hardSkills: [
      { name: 'Java', category: 'Backend', level: 'Senior', isTop: true, endorsements: 22 },
      { name: 'Spring Boot', category: 'Backend', level: 'Senior', isTop: true, endorsements: 18 },
      { name: 'PostgreSQL', category: 'Data', level: 'Senior', isTop: true, endorsements: 15 },
      { name: 'Docker', category: 'Infrastructure', level: 'Mid', endorsements: 9 },
      { name: 'Redis', category: 'Data', level: 'Mid', endorsements: 8 },
    ],
    softSkills: ['Vision sistemica', 'Mentoria', 'Comunicacion clara'],
    portfolioHighlights: ['Modernizacion de core legacy', 'Arquitectura de servicios financieros'],
  },
];

function createEndorsements(skillId: string, count: number, userId: string) {
  return Array.from({ length: count }, (_, index) => ({
    id: `${skillId}-endorsement-${index + 1}`,
    skillId,
    endorserId: `recruiter-${index + 1}`,
    endorserName: `Validacion ${index + 1}`,
    endorserAvatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    createdAt: `2024-03-${String((index % 9) + 1).padStart(2, '0')}T10:00:00Z`,
    userId,
  })).map(({ userId: _userId, ...endorsement }) => endorsement);
}

export const recruiterTalentUsers: User[] = recruiterTalentProfiles.map((profile) => profile.user);

export const recruiterTalentHardSkills: HardSkill[] = recruiterTalentProfiles.flatMap((profile) =>
  profile.hardSkills.map((skill, index) => {
    const id = `${profile.user.id}-hs-${index + 1}`;
    return {
      id,
      userId: profile.user.id,
      skillTag: {
        id: `${profile.user.slug}-${index + 1}`,
        name: skill.name,
        category: skill.category,
        isNormalized: true,
      },
      level: skill.level,
      isTop: Boolean(skill.isTop),
      endorsements: createEndorsements(id, skill.endorsements, profile.user.id),
      createdAt: `2024-03-${String(index + 1).padStart(2, '0')}T10:00:00Z`,
    };
  })
);

export const recruiterTalentSoftSkills: SoftSkill[] = recruiterTalentProfiles.flatMap((profile) =>
  profile.softSkills.map((skill, index) => ({
    id: `${profile.user.id}-ss-${index + 1}`,
    userId: profile.user.id,
    title: skill,
    description: `${skill} aplicada a proyectos reales y colaboracion con equipos multidisciplinarios.`,
    createdAt: `2024-03-${String(index + 1).padStart(2, '0')}T12:00:00Z`,
  }))
);

function inferProjectCategory(profile: RecruiterTalentProfile): ProjectCategory {
  if (profile.expectedRole.toLowerCase().includes('data')) return 'Data';
  if (profile.expectedRole.toLowerCase().includes('devops')) return 'DevOps';
  if (profile.expectedRole.toLowerCase().includes('mobile')) return 'Mobile';
  if (profile.expectedRole.toLowerCase().includes('backend')) return 'API';
  return 'Web';
}

export const recruiterTalentProjects: Project[] = recruiterTalentProfiles.map((profile, index) => ({
  id: `rt-project-${profile.user.id}`,
  userId: profile.user.id,
  title: profile.portfolioHighlights[0] ?? `Proyecto destacado de ${profile.user.name}`,
  description: `${profile.summary} Proyecto demo preparado para la vitrina publica del talento.`,
  category: inferProjectCategory(profile),
  status: 'completed',
  isPublic: true,
  isFeatured: true,
  thumbnail: `https://images.unsplash.com/photo-${1550000000000 + index * 77777}?w=900&h=600&fit=crop`,
  technicalInfo: {
    role: profile.expectedRole,
    technologies: profile.hardSkills.slice(0, 5).map((skill) => skill.name),
    startDate: '2024-01-10',
    endDate: '2024-05-20',
    results: profile.portfolioHighlights[1] ?? 'Impacto visible en producto, performance y escalabilidad.',
  },
  media: [],
  files: [],
  createdAt: '2024-05-01T10:00:00Z',
  updatedAt: '2024-05-15T10:00:00Z',
}));
