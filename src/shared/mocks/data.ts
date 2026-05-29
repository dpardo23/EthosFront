import type {
  User,
  GlobalSkillTag,
  HardSkill,
  SoftSkill,
  Endorsement,
  Project,
  OAuthConnection,
  GithubRepository,
  GithubHeatmapDay,
  LinkedinExperience,
  LinkedinEducation,
  Recommendation,
  VisibilitySettings,
  ModerationAction,
  PlatformMetrics,
  ActivityLog,
  TimeSeriesData,
  UserPreferences,
  Notification,
} from '../types';

// =============================================
// USERS
// =============================================
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'carlos.dev@email.com',
    name: 'Carlos Mendoza',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    username: 'carlosmendoza',
    role: 'professional',
    slug: 'carlos-mendoza',
    profession: 'Senior Full Stack Developer',
    bio: 'Desarrollador apasionado con más de 8 años de experiencia creando soluciones web escalables. Especializado en React, Node.js y arquitecturas cloud.',
    headline: 'Construyendo productos web escalables con foco en performance y arquitectura.',
    location: 'Ciudad de México, México',
    website: 'https://carlosmendoza.dev',
    company: 'TechCorp Solutions',
    createdAt: '2023-01-15T10:00:00Z',
  },
  {
    id: '2',
    email: 'ana.recruiter@company.com',
    name: 'Ana García',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    username: 'anagarcia',
    role: 'recruiter',
    slug: 'ana-garcia',
    profession: 'Tech Recruiter',
    bio: 'Conectando talento con oportunidades en tecnología.',
    headline: 'Recruiting y talento digital con foco en equipos de alto rendimiento.',
    location: 'Bogotá, Colombia',
    website: '',
    company: 'PeopleFirst',
    createdAt: '2023-03-20T14:30:00Z',
  },
  {
    id: '3',
    email: 'admin@ethoshub.com',
    name: 'Admin EthosHub',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    username: 'admin',
    role: 'admin',
    slug: 'admin',
    profession: 'Platform Administrator',
    bio: 'Administrador de la plataforma EthosHub.',
    headline: 'Operaciones, seguridad y moderación de la plataforma.',
    location: 'Remoto',
    website: '',
    company: 'EthosHub',
    createdAt: '2022-12-01T08:00:00Z',
  },
  {
    id: '4',
    email: 'maria.designer@email.com',
    name: 'María López',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    username: 'marialopez',
    role: 'professional',
    slug: 'maria-lopez',
    profession: 'UX/UI Designer',
    bio: 'Diseñadora de experiencias digitales con enfoque en accesibilidad y usabilidad.',
    headline: 'Interfaces y experiencias digitales con criterio visual y accesibilidad.',
    location: 'Buenos Aires, Argentina',
    website: 'https://marialopez.design',
    company: 'DesignLab',
    createdAt: '2023-05-10T16:45:00Z',
  },
  {
    id: '5',
    email: 'pedro.backend@email.com',
    name: 'Pedro Ramírez',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    username: 'pedroramirez',
    role: 'professional',
    slug: 'pedro-ramirez',
    profession: 'Backend Engineer',
    bio: 'Ingeniero de software especializado en sistemas distribuidos y microservicios.',
    headline: 'Arquitecturas backend confiables, APIs limpias y despliegues sostenibles.',
    location: 'Santiago, Chile',
    website: '',
    company: 'InfraCloud',
    createdAt: '2023-02-28T09:15:00Z',
  },
];

// =============================================
// SKILLS
// =============================================
export const mockGlobalSkillTags: GlobalSkillTag[] = [
  { id: 's1', name: 'React', category: 'Frontend', isNormalized: true },
  { id: 's2', name: 'TypeScript', category: 'Frontend', isNormalized: true },
  { id: 's3', name: 'Vue.js', category: 'Frontend', isNormalized: true },
  { id: 's4', name: 'Angular', category: 'Frontend', isNormalized: true },
  { id: 's5', name: 'Next.js', category: 'Frontend', isNormalized: true },
  { id: 's6', name: 'Tailwind CSS', category: 'Frontend', isNormalized: true },
  { id: 's7', name: 'Node.js', category: 'Backend', isNormalized: true },
  { id: 's8', name: 'Python', category: 'Backend', isNormalized: true },
  { id: 's9', name: 'Java', category: 'Backend', isNormalized: true },
  { id: 's10', name: 'Go', category: 'Backend', isNormalized: true },
  { id: 's11', name: 'Express.js', category: 'Backend', isNormalized: true },
  { id: 's12', name: 'NestJS', category: 'Backend', isNormalized: true },
  { id: 's13', name: 'PostgreSQL', category: 'Data', isNormalized: true },
  { id: 's14', name: 'MongoDB', category: 'Data', isNormalized: true },
  { id: 's15', name: 'MySQL', category: 'Data', isNormalized: true },
  { id: 's16', name: 'Redis', category: 'Data', isNormalized: true },
  { id: 's17', name: 'AWS', category: 'Infrastructure', isNormalized: true },
  { id: 's18', name: 'Docker', category: 'Infrastructure', isNormalized: true },
  { id: 's19', name: 'Kubernetes', category: 'Infrastructure', isNormalized: true },
  { id: 's20', name: 'CI/CD', category: 'Infrastructure', isNormalized: true },
  { id: 's21', name: 'Git', category: 'Infrastructure', isNormalized: true },
  { id: 's22', name: 'GraphQL', category: 'Backend', isNormalized: true },
  { id: 's23', name: 'REST API', category: 'Backend', isNormalized: true },
  { id: 's24', name: 'Agile/Scrum', category: 'Soft Skill', isNormalized: true },
  // Duplicados para normalización
  { id: 's25', name: 'ReactJS', category: 'Frontend', isNormalized: false },
  { id: 's26', name: 'React.js', category: 'Frontend', isNormalized: false },
  { id: 's27', name: 'Nodejs', category: 'Backend', isNormalized: false },
];

export const mockEndorsements: Endorsement[] = [
  { id: 'e1', skillId: 'hs1', endorserId: '2', endorserName: 'Ana García', endorserAvatar: mockUsers[1].avatar || '', createdAt: '2024-01-10T10:00:00Z' },
  { id: 'e2', skillId: 'hs1', endorserId: '4', endorserName: 'María López', endorserAvatar: mockUsers[3].avatar || '', createdAt: '2024-01-12T14:30:00Z' },
  { id: 'e3', skillId: 'hs1', endorserId: '5', endorserName: 'Pedro Ramírez', endorserAvatar: mockUsers[4].avatar || '', createdAt: '2024-01-15T09:00:00Z' },
  { id: 'e4', skillId: 'hs2', endorserId: '2', endorserName: 'Ana García', endorserAvatar: mockUsers[1].avatar || '', createdAt: '2024-01-11T11:00:00Z' },
  { id: 'e5', skillId: 'hs2', endorserId: '5', endorserName: 'Pedro Ramírez', endorserAvatar: mockUsers[4].avatar || '', createdAt: '2024-01-13T16:00:00Z' },
  { id: 'e6', skillId: 'hs3', endorserId: '4', endorserName: 'María López', endorserAvatar: mockUsers[3].avatar || '', createdAt: '2024-01-14T12:00:00Z' },
];

export const mockHardSkills: HardSkill[] = [
  { id: 'hs1', userId: '1', skillTag: mockGlobalSkillTags[0], level: 'Senior', isTop: true, endorsements: mockEndorsements.filter(e => e.skillId === 'hs1'), createdAt: '2023-06-01T10:00:00Z' },
  { id: 'hs2', userId: '1', skillTag: mockGlobalSkillTags[1], level: 'Senior', isTop: true, endorsements: mockEndorsements.filter(e => e.skillId === 'hs2'), createdAt: '2023-06-01T10:00:00Z' },
  { id: 'hs3', userId: '1', skillTag: mockGlobalSkillTags[6], level: 'Senior', isTop: true, endorsements: mockEndorsements.filter(e => e.skillId === 'hs3'), createdAt: '2023-06-01T10:00:00Z' },
  { id: 'hs4', userId: '1', skillTag: mockGlobalSkillTags[12], level: 'Mid', isTop: false, endorsements: [], createdAt: '2023-06-02T10:00:00Z' },
  { id: 'hs5', userId: '1', skillTag: mockGlobalSkillTags[17], level: 'Mid', isTop: false, endorsements: [], createdAt: '2023-06-03T10:00:00Z' },
  { id: 'hs6', userId: '1', skillTag: mockGlobalSkillTags[16], level: 'Mid', isTop: false, endorsements: [], createdAt: '2023-06-04T10:00:00Z' },
  { id: 'hs7', userId: '1', skillTag: mockGlobalSkillTags[21], level: 'Senior', isTop: false, endorsements: [], createdAt: '2023-06-05T10:00:00Z' },
  { id: 'hs8', userId: '1', skillTag: mockGlobalSkillTags[5], level: 'Senior', isTop: false, endorsements: [], createdAt: '2023-06-06T10:00:00Z' },
];

export const mockSoftSkills: SoftSkill[] = [
  { id: 'ss1', userId: '1', title: 'Liderazgo técnico', description: 'Lideré un equipo de 5 desarrolladores en la migración exitosa de un monolito a microservicios, reduciendo el tiempo de despliegue en un 70%.', createdAt: '2023-06-01T10:00:00Z' },
  { id: 'ss2', userId: '1', title: 'Comunicación efectiva', description: 'Facilité sesiones de refinamiento y retrospectivas, mejorando la colaboración entre equipos de desarrollo y producto.', createdAt: '2023-06-02T10:00:00Z' },
  { id: 'ss3', userId: '1', title: 'Resolución de problemas', description: 'Identifiqué y resolví un cuello de botella en producción que afectaba a 10,000 usuarios diarios.', createdAt: '2023-06-03T10:00:00Z' },
];

// =============================================
// PROJECTS
// =============================================
export const mockProjects: Project[] = [
  {
    id: 'p1',
    userId: '1',
    title: 'E-Commerce Platform',
    description: 'Plataforma de comercio electrónico completa con carrito de compras, pasarela de pagos y panel de administración. Desarrollada con arquitectura de microservicios para alta escalabilidad.',
    category: 'Web',
    status: 'completed',
    isPublic: true,
    isFeatured: true,
    thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop',
    technicalInfo: {
      role: 'Lead Developer',
      technologies: ['React', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'AWS'],
      startDate: '2023-01-01',
      endDate: '2023-06-30',
      results: 'Incremento del 40% en conversiones y reducción del 60% en tiempo de carga.',
    },
    media: [
      { id: 'm1', projectId: 'p1', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', type: 'youtube', title: 'Demo del proyecto' },
    ],
    files: [
      { id: 'f1', projectId: 'p1', name: 'arquitectura.pdf', type: 'application/pdf', size: 2500000, url: '#' },
    ],
    createdAt: '2023-01-15T10:00:00Z',
    updatedAt: '2023-07-01T14:30:00Z',
  },
  {
    id: 'p2',
    userId: '1',
    title: 'Task Management App',
    description: 'Aplicación de gestión de tareas con funcionalidades de colaboración en tiempo real, notificaciones push y sincronización offline.',
    category: 'Mobile',
    status: 'completed',
    isPublic: true,
    isFeatured: false,
    thumbnail: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=600&h=400&fit=crop',
    technicalInfo: {
      role: 'Full Stack Developer',
      technologies: ['React Native', 'Firebase', 'TypeScript'],
      startDate: '2023-03-01',
      endDate: '2023-05-15',
      results: 'Más de 5,000 descargas en el primer mes con rating de 4.8 estrellas.',
    },
    media: [],
    files: [],
    createdAt: '2023-03-01T09:00:00Z',
    updatedAt: '2023-05-20T11:00:00Z',
  },
  {
    id: 'p3',
    userId: '1',
    title: 'Analytics Dashboard',
    description: 'Dashboard de analíticas en tiempo real para monitoreo de métricas de negocio con visualizaciones interactivas.',
    category: 'Data',
    status: 'in_progress',
    isPublic: true,
    isFeatured: true,
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
    technicalInfo: {
      role: 'Frontend Developer',
      technologies: ['React', 'D3.js', 'WebSocket', 'GraphQL'],
      startDate: '2023-08-01',
      results: 'En desarrollo - 80% completado.',
    },
    media: [
      { id: 'm2', projectId: 'p3', url: 'https://www.figma.com/file/example', type: 'figma', title: 'Diseño en Figma' },
    ],
    files: [],
    createdAt: '2023-08-01T10:00:00Z',
    updatedAt: '2024-01-10T16:00:00Z',
  },
  {
    id: 'p4',
    userId: '1',
    title: 'API Gateway Service',
    description: 'Servicio de API Gateway con autenticación JWT, rate limiting y logging centralizado.',
    category: 'API',
    status: 'completed',
    isPublic: false,
    isFeatured: false,
    thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop',
    technicalInfo: {
      role: 'Backend Developer',
      technologies: ['Node.js', 'Express', 'Redis', 'Kong'],
      startDate: '2022-10-01',
      endDate: '2022-12-31',
      results: 'Procesamiento de más de 1 millón de requests diarios.',
    },
    media: [],
    files: [],
    createdAt: '2022-10-01T08:00:00Z',
    updatedAt: '2023-01-05T10:00:00Z',
  },
];

// =============================================
// CONNECTIONS
// =============================================
export const mockConnections: OAuthConnection[] = [
  {
    id: 'c1',
    userId: '1',
    provider: 'github',
    status: 'connected',
    lastSynced: '2024-01-15T10:30:00Z',
    tokenExpiresAt: '2024-07-15T10:30:00Z',
    apiHealth: 'healthy',
  },
  {
    id: 'c2',
    userId: '1',
    provider: 'linkedin',
    status: 'expired',
    lastSynced: '2023-12-01T14:00:00Z',
    tokenExpiresAt: '2024-01-01T14:00:00Z',
    apiHealth: 'degraded',
  },
];

export const mockGithubRepos: GithubRepository[] = [
  { id: 'gr1', name: 'react-dashboard', description: 'Dashboard moderno con React y TypeScript', language: 'TypeScript', stars: 245, forks: 32, isFork: false, isImported: true, url: 'https://github.com/carlos/react-dashboard', readme: '# React Dashboard\n\nUn dashboard moderno construido con React, TypeScript y Tailwind CSS.\n\n## Características\n- Gráficos interactivos\n- Modo oscuro\n- Responsive design', updatedAt: '2024-01-10T10:00:00Z' },
  { id: 'gr2', name: 'node-api-starter', description: 'Template para APIs con Node.js y Express', language: 'JavaScript', stars: 128, forks: 45, isFork: false, isImported: false, url: 'https://github.com/carlos/node-api-starter', readme: '# Node API Starter\n\nTemplate completo para comenzar proyectos de API REST.', updatedAt: '2024-01-08T14:30:00Z' },
  { id: 'gr3', name: 'awesome-resources', description: 'Colección de recursos para desarrolladores', language: 'Markdown', stars: 567, forks: 89, isFork: false, isImported: false, url: 'https://github.com/carlos/awesome-resources', updatedAt: '2024-01-05T09:00:00Z' },
  { id: 'gr4', name: 'vue-components', description: 'Librería de componentes Vue.js', language: 'Vue', stars: 89, forks: 12, isFork: true, isImported: false, url: 'https://github.com/carlos/vue-components', updatedAt: '2023-12-20T16:00:00Z' },
  { id: 'gr5', name: 'python-ml-toolkit', description: 'Herramientas de Machine Learning en Python', language: 'Python', stars: 312, forks: 67, isFork: false, isImported: false, url: 'https://github.com/carlos/python-ml-toolkit', updatedAt: '2023-12-15T11:00:00Z' },
];

export const mockGithubHeatmap: GithubHeatmapDay[] = (() => {
  const days: GithubHeatmapDay[] = [];
  const now = new Date();
  for (let i = 365; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const count = Math.floor(Math.random() * 12);
    const level = count === 0 ? 0 : count < 3 ? 1 : count < 6 ? 2 : count < 9 ? 3 : 4;
    days.push({
      date: date.toISOString().split('T')[0],
      count,
      level: level as 0 | 1 | 2 | 3 | 4,
    });
  }
  return days;
})();

export const mockLinkedinExperiences: LinkedinExperience[] = [
  { id: 'le1', company: 'TechCorp Solutions', position: 'Senior Full Stack Developer', location: 'Ciudad de México', startDate: '2021-03-01', description: 'Desarrollo de aplicaciones web empresariales con React y Node.js. Liderazgo técnico de equipo de 5 personas.', isCurrent: true },
  { id: 'le2', company: 'StartupXYZ', position: 'Full Stack Developer', location: 'Guadalajara', startDate: '2019-01-01', endDate: '2021-02-28', description: 'Construcción de MVP y escalamiento de producto SaaS.', isCurrent: false },
  { id: 'le3', company: 'Digital Agency', position: 'Frontend Developer', location: 'Ciudad de México', startDate: '2017-06-01', endDate: '2018-12-31', description: 'Desarrollo de sitios web y aplicaciones para clientes corporativos.', isCurrent: false },
];

export const mockLinkedinEducations: LinkedinEducation[] = [
  { id: 'led1', institution: 'Universidad Nacional Autónoma de México', degree: 'Licenciatura', field: 'Ingeniería en Computación', startDate: '2013-08-01', endDate: '2017-05-31' },
  { id: 'led2', institution: 'Platzi', degree: 'Certificación', field: 'Cloud Computing con AWS', startDate: '2020-01-01', endDate: '2020-06-30' },
];

export const mockRecommendations: Recommendation[] = [
  { id: 'r1', authorName: 'Laura Sánchez', authorPosition: 'Engineering Manager en TechCorp', authorAvatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face', content: 'Carlos es un desarrollador excepcional. Su capacidad para resolver problemas complejos y su liderazgo técnico fueron fundamentales para el éxito de nuestros proyectos.', relationship: 'Supervisora directa', isPublic: true, createdAt: '2023-11-15T10:00:00Z' },
  { id: 'r2', authorName: 'Miguel Torres', authorPosition: 'CTO en StartupXYZ', authorAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face', content: 'Trabajar con Carlos fue una experiencia increíble. Su dedicación y conocimiento técnico elevaron la calidad de todo el equipo.', relationship: 'Colaborador', isPublic: true, createdAt: '2023-08-20T14:30:00Z' },
  { id: 'r3', authorName: 'Sofia Morales', authorPosition: 'Product Manager', authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face', content: 'Excelente comunicación y siempre cumple con los deadlines. Un placer trabajar con él.', relationship: 'Compañera de proyecto', isPublic: false, createdAt: '2023-06-10T09:00:00Z' },
];

// =============================================
// VISIBILITY
// =============================================
export const mockVisibilitySettings: VisibilitySettings[] = [
  {
    userId: '1',
    slug: 'carlos-mendoza',
    isPublicProfileEnabled: true,
    isPasswordProtected: false,
    sections: {
      projects: 'PUBLIC',
      skills: 'PUBLIC',
      experience: 'PUBLIC',
      bio: 'PUBLIC',
      contact: 'LINK_ONLY',
    },
    seo: {
      title: 'Carlos Mendoza - Senior Full Stack Developer',
      description: 'Desarrollador Full Stack con 8+ años de experiencia en React, Node.js y arquitecturas cloud.',
    },
    openGraph: {
      ogTitle: 'Carlos Mendoza - Portafolio Profesional',
      ogDescription: 'Descubre mis proyectos y habilidades como desarrollador Full Stack.',
      ogImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=1200&h=630&fit=crop',
      ogUrl: 'https://ethoshub.com/p/carlos-mendoza',
    },
  },
  {
    userId: '4',
    slug: 'maria-lopez',
    isPublicProfileEnabled: true,
    isPasswordProtected: true,
    password: '123456',
    sections: {
      projects: 'PUBLIC',
      skills: 'PUBLIC',
      experience: 'LINK_ONLY',
      bio: 'PUBLIC',
      contact: 'PRIVATE',
    },
    seo: {
      title: 'María López - UX/UI Designer',
      description: 'Diseñadora de experiencias digitales con enfoque en accesibilidad.',
    },
    openGraph: {
      ogTitle: 'María López - Portafolio de Diseño',
      ogDescription: 'Explora mis diseños y proyectos de UX/UI.',
      ogImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=1200&h=630&fit=crop',
      ogUrl: 'https://ethoshub.com/p/maria-lopez',
    },
  },
];

export const mockModerationHistory: ModerationAction[] = [
  { id: 'ma1', portfolioId: '1', adminId: '3', adminName: 'Admin EthosHub', actionType: 'make_public', previousState: 'private', newState: 'public', createdAt: '2024-01-10T10:00:00Z' },
  { id: 'ma2', portfolioId: '5', adminId: '3', adminName: 'Admin EthosHub', actionType: 'deactivate', previousState: 'active', newState: 'deactivated', reason: 'Contenido inapropiado reportado', createdAt: '2024-01-08T14:30:00Z' },
];

// =============================================
// ANALYTICS
// =============================================
export const mockPlatformMetrics: PlatformMetrics = {
  totalUsers: 15420,
  activeUsers: 8234,
  inactiveUsers: 7186,
  totalPortfolios: 12350,
  publishedPortfolios: 9876,
  totalVisits: 456789,
  totalInteractions: 34567,
  userGrowth: 12.5,
  visitGrowth: 23.8,
};

export const mockActivityLogs: ActivityLog[] = [
  { id: 'al1', type: 'user_registered', description: 'Nuevo usuario registrado', userId: '6', userName: 'Juan Pérez', createdAt: '2024-01-15T10:30:00Z' },
  { id: 'al2', type: 'portfolio_published', description: 'Portafolio publicado', userId: '4', userName: 'María López', createdAt: '2024-01-15T09:45:00Z' },
  { id: 'al3', type: 'visit', description: 'Visita a portafolio de Carlos Mendoza', createdAt: '2024-01-15T09:30:00Z' },
  { id: 'al4', type: 'interaction', description: 'Nueva validación de skill', userId: '2', userName: 'Ana García', createdAt: '2024-01-15T09:15:00Z' },
  { id: 'al5', type: 'portfolio_created', description: 'Nuevo portafolio creado', userId: '7', userName: 'Roberto Silva', createdAt: '2024-01-15T08:00:00Z' },
  { id: 'al6', type: 'user_registered', description: 'Nuevo usuario registrado', userId: '8', userName: 'Elena Castro', createdAt: '2024-01-14T17:30:00Z' },
  { id: 'al7', type: 'visit', description: 'Visita a portafolio de María López', createdAt: '2024-01-14T16:00:00Z' },
  { id: 'al8', type: 'interaction', description: 'Descarga de archivo de proyecto', createdAt: '2024-01-14T15:30:00Z' },
];

export const mockTimeSeriesData: TimeSeriesData[] = (() => {
  const data: TimeSeriesData[] = [];
  const now = new Date();
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      visits: Math.floor(Math.random() * 500) + 200,
      interactions: Math.floor(Math.random() * 100) + 20,
    });
  }
  return data;
})();

// =============================================
// PREFERENCES
// =============================================
export const mockUserPreferences: UserPreferences = {
  userId: '1',
  language: 'es',
  theme: 'light',
  showGithubHeatmap: true,
  showLinkedinRecommendations: true,
  sectionOrder: ['bio', 'skills', 'projects', 'experience', 'contact'],
  notifications: {
    connections: true,
    messages: true,
    projectViews: true,
    weeklyDigest: true,
    marketing: false,
    push_connections: true,
    push_messages: true,
    push_mentions: true,
  },
  privacy: {
    showEmail: false,
    showLocation: true,
    showConnections: true,
    allowMessages: true,
  },
};

// =============================================
// NOTIFICATIONS
// =============================================
export const mockNotifications: Notification[] = [
  { id: 'n1', userId: '1', type: 'endorsement', title: 'Nueva validación', message: 'Ana García validó tu skill de React', isRead: false, createdAt: '2024-01-15T10:00:00Z' },
  { id: 'n2', userId: '1', type: 'visit', title: 'Nueva visita', message: 'Tu portafolio recibió 5 nuevas visitas hoy', isRead: false, createdAt: '2024-01-15T09:00:00Z' },
  { id: 'n3', userId: '1', type: 'recommendation', title: 'Nueva recomendación', message: 'Laura Sánchez te dejó una recomendación', isRead: true, createdAt: '2024-01-14T16:30:00Z' },
  { id: 'n4', userId: '1', type: 'system', title: 'Actualización del sistema', message: 'Nuevas funcionalidades disponibles en tu dashboard', isRead: true, createdAt: '2024-01-13T10:00:00Z' },
];

// =============================================
// SLUG AVAILABILITY
// =============================================
export const reservedSlugs = ['admin', 'api', 'login', 'dashboard', 'explorar', 'settings', 'help', 'support'];
export const takenSlugs = ['carlos-mendoza', 'maria-lopez', 'pedro-ramirez', 'ana-garcia'];
