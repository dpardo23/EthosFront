import { create } from 'zustand';
import type { HardSkill, SoftSkill, GlobalSkillTag, SkillLevel, SkillCategory } from '@/shared/types';

// ── Mock tag catalog ──────────────────────────────────────────────────────────

const SKILL_TAGS: GlobalSkillTag[] = [
  { id: 'tag-react',         name: 'React',           category: 'Frontend',       isNormalized: true },
  { id: 'tag-typescript',    name: 'TypeScript',      category: 'Frontend',       isNormalized: true },
  { id: 'tag-nextjs',        name: 'Next.js',         category: 'Frontend',       isNormalized: true },
  { id: 'tag-tailwind',      name: 'Tailwind CSS',    category: 'Frontend',       isNormalized: true },
  { id: 'tag-vuejs',         name: 'Vue.js',          category: 'Frontend',       isNormalized: true },
  { id: 'tag-svelte',        name: 'Svelte',          category: 'Frontend',       isNormalized: true },
  { id: 'tag-angular',       name: 'Angular',         category: 'Frontend',       isNormalized: true },
  { id: 'tag-framer',        name: 'Framer Motion',   category: 'Frontend',       isNormalized: true },
  { id: 'tag-zustand',       name: 'Zustand',         category: 'Frontend',       isNormalized: true },
  { id: 'tag-nodejs',        name: 'Node.js',         category: 'Backend',        isNormalized: true },
  { id: 'tag-postgresql',    name: 'PostgreSQL',      category: 'Backend',        isNormalized: true },
  { id: 'tag-restapi',       name: 'REST APIs',       category: 'Backend',        isNormalized: true },
  { id: 'tag-graphql',       name: 'GraphQL',         category: 'Backend',        isNormalized: true },
  { id: 'tag-express',       name: 'Express.js',      category: 'Backend',        isNormalized: true },
  { id: 'tag-nestjs',        name: 'NestJS',          category: 'Backend',        isNormalized: true },
  { id: 'tag-prisma',        name: 'Prisma',          category: 'Backend',        isNormalized: true },
  { id: 'tag-docker',        name: 'Docker',          category: 'Infrastructure', isNormalized: true },
  { id: 'tag-ghactions',     name: 'GitHub Actions',  category: 'Infrastructure', isNormalized: true },
  { id: 'tag-aws',           name: 'AWS',             category: 'Infrastructure', isNormalized: true },
  { id: 'tag-kubernetes',    name: 'Kubernetes',      category: 'Infrastructure', isNormalized: true },
  { id: 'tag-terraform',     name: 'Terraform',       category: 'Infrastructure', isNormalized: true },
  { id: 'tag-reactnative',   name: 'React Native',    category: 'Mobile',         isNormalized: true },
  { id: 'tag-flutter',       name: 'Flutter',         category: 'Mobile',         isNormalized: true },
  { id: 'tag-swift',         name: 'Swift',           category: 'Mobile',         isNormalized: true },
  { id: 'tag-mongodb',       name: 'MongoDB',         category: 'Data',           isNormalized: true },
  { id: 'tag-redis',         name: 'Redis',           category: 'Data',           isNormalized: true },
  { id: 'tag-elasticsearch', name: 'Elasticsearch',   category: 'Data',           isNormalized: true },
  { id: 'tag-figma',         name: 'Figma',           category: 'Design',         isNormalized: true },
  { id: 'tag-illustrator',   name: 'Illustrator',     category: 'Design',         isNormalized: true },
];

// ── Mock initial profile data ─────────────────────────────────────────────────

const MOCK_HARD_SKILLS: HardSkill[] = [
  {
    id: 'hs-1', userId: 'mock-profile', level: 'Senior', isTop: true, topOrder: 1,
    skillTag: { id: 'tag-react', name: 'React', category: 'Frontend', isNormalized: true },
    endorsements: [], createdAt: '2024-01-10T00:00:00Z',
  },
  {
    id: 'hs-2', userId: 'mock-profile', level: 'Senior', isTop: true, topOrder: 2,
    skillTag: { id: 'tag-typescript', name: 'TypeScript', category: 'Frontend', isNormalized: true },
    endorsements: [], createdAt: '2024-01-11T00:00:00Z',
  },
  {
    id: 'hs-3', userId: 'mock-profile', level: 'Mid', isTop: false,
    skillTag: { id: 'tag-nextjs', name: 'Next.js', category: 'Frontend', isNormalized: true },
    endorsements: [], createdAt: '2024-01-12T00:00:00Z',
  },
  {
    id: 'hs-4', userId: 'mock-profile', level: 'Senior', isTop: true, topOrder: 3,
    skillTag: { id: 'tag-tailwind', name: 'Tailwind CSS', category: 'Frontend', isNormalized: true },
    endorsements: [], createdAt: '2024-01-13T00:00:00Z',
  },
  {
    id: 'hs-5', userId: 'mock-profile', level: 'Junior', isTop: false,
    skillTag: { id: 'tag-vuejs', name: 'Vue.js', category: 'Frontend', isNormalized: true },
    endorsements: [], createdAt: '2024-01-14T00:00:00Z',
  },
  {
    id: 'hs-6', userId: 'mock-profile', level: 'Mid', isTop: false,
    skillTag: { id: 'tag-framer', name: 'Framer Motion', category: 'Frontend', isNormalized: true },
    endorsements: [], createdAt: '2024-01-14T12:00:00Z',
  },
  {
    id: 'hs-7', userId: 'mock-profile', level: 'Mid', isTop: false,
    skillTag: { id: 'tag-nodejs', name: 'Node.js', category: 'Backend', isNormalized: true },
    endorsements: [], createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'hs-8', userId: 'mock-profile', level: 'Mid', isTop: false,
    skillTag: { id: 'tag-postgresql', name: 'PostgreSQL', category: 'Backend', isNormalized: true },
    endorsements: [], createdAt: '2024-01-16T00:00:00Z',
  },
  {
    id: 'hs-9', userId: 'mock-profile', level: 'Senior', isTop: false,
    skillTag: { id: 'tag-restapi', name: 'REST APIs', category: 'Backend', isNormalized: true },
    endorsements: [], createdAt: '2024-01-17T00:00:00Z',
  },
  {
    id: 'hs-10', userId: 'mock-profile', level: 'Junior', isTop: false,
    skillTag: { id: 'tag-graphql', name: 'GraphQL', category: 'Backend', isNormalized: true },
    endorsements: [], createdAt: '2024-01-18T00:00:00Z',
  },
  {
    id: 'hs-11', userId: 'mock-profile', level: 'Mid', isTop: false,
    skillTag: { id: 'tag-express', name: 'Express.js', category: 'Backend', isNormalized: true },
    endorsements: [], createdAt: '2024-01-19T00:00:00Z',
  },
  {
    id: 'hs-12', userId: 'mock-profile', level: 'Junior', isTop: false,
    skillTag: { id: 'tag-docker', name: 'Docker', category: 'Infrastructure', isNormalized: true },
    endorsements: [], createdAt: '2024-01-20T00:00:00Z',
  },
  {
    id: 'hs-13', userId: 'mock-profile', level: 'Junior', isTop: false,
    skillTag: { id: 'tag-ghactions', name: 'GitHub Actions', category: 'Infrastructure', isNormalized: true },
    endorsements: [], createdAt: '2024-01-21T00:00:00Z',
  },
  {
    id: 'hs-14', userId: 'mock-profile', level: 'Junior', isTop: false,
    skillTag: { id: 'tag-aws', name: 'AWS', category: 'Infrastructure', isNormalized: true },
    endorsements: [], createdAt: '2024-01-22T00:00:00Z',
  },
  {
    id: 'hs-15', userId: 'mock-profile', level: 'Mid', isTop: false,
    skillTag: { id: 'tag-reactnative', name: 'React Native', category: 'Mobile', isNormalized: true },
    endorsements: [], createdAt: '2024-01-23T00:00:00Z',
  },
  {
    id: 'hs-16', userId: 'mock-profile', level: 'Mid', isTop: false,
    skillTag: { id: 'tag-mongodb', name: 'MongoDB', category: 'Data', isNormalized: true },
    endorsements: [], createdAt: '2024-01-24T00:00:00Z',
  },
  {
    id: 'hs-17', userId: 'mock-profile', level: 'Junior', isTop: false,
    skillTag: { id: 'tag-figma', name: 'Figma', category: 'Design', isNormalized: true },
    endorsements: [], createdAt: '2024-01-25T00:00:00Z',
  },
];

const MOCK_SOFT_SKILLS: SoftSkill[] = [
  {
    id: 'ss-1', userId: 'mock-profile',
    title: 'Liderazgo Técnico',
    description: 'Lideré un equipo de 4 developers para migrar una app monolítica a microservicios en 3 meses, sin downtime en producción.',
    createdAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'ss-2', userId: 'mock-profile',
    title: 'Comunicación Efectiva',
    description: 'Presenté propuestas técnicas a stakeholders no técnicos logrando la aprobación de presupuesto para modernizar la infraestructura.',
    createdAt: '2024-02-02T00:00:00Z',
  },
  {
    id: 'ss-3', userId: 'mock-profile',
    title: 'Resolución de Problemas',
    description: 'Diagnostiqué y resolví un cuello de botella crítico en producción que afectaba a +10k usuarios activos en menos de 2 horas.',
    createdAt: '2024-02-03T00:00:00Z',
  },
  {
    id: 'ss-4', userId: 'mock-profile',
    title: 'Trabajo en Equipo',
    description: 'Colaboré en un squad ágil de 8 personas coordinando sprints y code reviews para mantener alta velocidad de entrega.',
    createdAt: '2024-02-04T00:00:00Z',
  },
];

// ── Store interface ───────────────────────────────────────────────────────────

interface SkillsStore {
  hardSkills: HardSkill[];
  softSkills: SoftSkill[];
  searchResults: GlobalSkillTag[];
  loading: boolean;
  error: string | null;

  fetchHardSkills: (profileId: string) => Promise<void>;
  fetchSoftSkills: (profileId: string) => Promise<void>;
  searchTags: (query: string) => Promise<void>;
  addHardSkill: (profileId: string, tagId: string, level: SkillLevel) => Promise<void>;
  updateHardSkill: (profileId: string, skillId: string, level: SkillLevel) => Promise<void>;
  removeHardSkill: (profileId: string, skillId: string) => Promise<void>;
  createTag: (name: string, category: SkillCategory) => Promise<GlobalSkillTag>;
  addSoftSkill: (profileId: string, title: string, description?: string) => Promise<void>;
  updateSoftSkill: (skillId: string, title: string, description?: string) => Promise<void>;
  removeSoftSkill: (profileId: string, skillId: string) => Promise<void>;
  toggleTopSkill: (profileId: string, skillId: string) => Promise<void>;
  reorderTopSkills: (profileId: string, skillIds: string[]) => Promise<void>;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useSkillsStore = create<SkillsStore>((set, get) => ({
  hardSkills: MOCK_HARD_SKILLS.map(s => ({ ...s })),
  softSkills: MOCK_SOFT_SKILLS.map(s => ({ ...s })),
  searchResults: [],
  loading: false,
  error: null,

  fetchHardSkills: async (_profileId: string) => {
    // Data pre-loaded at initialization; no-op.
  },

  fetchSoftSkills: async (_profileId: string) => {
    // Data pre-loaded at initialization; no-op.
  },

  searchTags: async (query: string) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    const q = query.toLowerCase();
    const existing = get().hardSkills.map(s => s.skillTag.id);
    const results = SKILL_TAGS
      .filter(t => t.name.toLowerCase().includes(q) && !existing.includes(t.id))
      .slice(0, 8);
    set({ searchResults: results });
  },

  addHardSkill: async (profileId: string, tagId: string, level: SkillLevel) => {
    const tag = SKILL_TAGS.find(t => t.id === tagId)
      ?? get().searchResults.find(t => t.id === tagId);
    if (!tag) return;
    const newSkill: HardSkill = {
      id: crypto.randomUUID(),
      userId: profileId,
      skillTag: tag,
      level,
      isTop: false,
      endorsements: [],
      createdAt: new Date().toISOString(),
    };
    set(s => ({ hardSkills: [...s.hardSkills, newSkill] }));
  },

  updateHardSkill: async (_profileId: string, skillId: string, level: SkillLevel) => {
    set(s => ({
      hardSkills: s.hardSkills.map(h => h.id === skillId ? { ...h, level } : h),
    }));
  },

  createTag: async (name: string, category: SkillCategory) => {
    const newTag: GlobalSkillTag = {
      id: crypto.randomUUID(),
      name,
      category,
      isNormalized: false,
    };
    SKILL_TAGS.push(newTag);
    return newTag;
  },

  removeHardSkill: async (_profileId: string, skillId: string) => {
    set(s => ({
      hardSkills: s.hardSkills.filter(h => h.id !== skillId),
    }));
  },

  addSoftSkill: async (profileId: string, title: string, description?: string) => {
    const newSkill: SoftSkill = {
      id: crypto.randomUUID(),
      userId: profileId,
      title,
      description,
      createdAt: new Date().toISOString(),
    };
    set(s => ({ softSkills: [...s.softSkills, newSkill] }));
  },

  updateSoftSkill: async (skillId: string, title: string, description?: string) => {
    set(s => ({
      softSkills: s.softSkills.map(sk =>
        sk.id === skillId ? { ...sk, title, description: description ?? '' } : sk
      ),
    }));
  },

  removeSoftSkill: async (_profileId: string, skillId: string) => {
    set(s => ({
      softSkills: s.softSkills.filter(sk => sk.id !== skillId),
    }));
  },

  toggleTopSkill: async (_profileId: string, skillId: string) => {
    const { hardSkills } = get();
    const skill = hardSkills.find(s => s.id === skillId);
    if (!skill) return;

    if (skill.isTop) {
      set(s => ({
        hardSkills: s.hardSkills.map(h =>
          h.id === skillId ? { ...h, isTop: false, topOrder: undefined } : h
        ),
      }));
    } else {
      const topCount = hardSkills.filter(s => s.isTop).length;
      if (topCount >= 3) return;
      const maxOrder = Math.max(
        0,
        ...hardSkills.filter(s => s.isTop).map(s => s.topOrder ?? 0)
      );
      set(s => ({
        hardSkills: s.hardSkills.map(h =>
          h.id === skillId ? { ...h, isTop: true, topOrder: maxOrder + 1 } : h
        ),
      }));
    }
  },

  reorderTopSkills: async (_profileId: string, skillIds: string[]) => {
    set(s => ({
      hardSkills: s.hardSkills.map(h => {
        const idx = skillIds.indexOf(h.id);
        return idx >= 0 ? { ...h, topOrder: idx + 1 } : h;
      }),
    }));
  },
}));
