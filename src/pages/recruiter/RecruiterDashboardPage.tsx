import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Users,
  Heart,
  Building2,
  Globe,
  MapPin,
  Pencil,
  Plus,
  ChevronRight,
  TrendingUp,
  Search,
  Sparkles,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '@/store';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
} from '@/shared/ui';

// Company Profile Schema (maps to core.profiles_company)
interface CompanyProfile {
  company_name: string;
  industry: string;
  company_size: string;
  location: string;
  website_url: string;
  description: string;
  logo_url?: string;
}

// Vacancy Schema
interface Vacancy {
  id: string;
  title: string;
  role: string;
  status: 'open' | 'closed' | 'draft';
  applicants: number;
  salary_range: string;
  requirements: string[];
  created_at: string;
}

// Mock data
const mockCompanyProfile: CompanyProfile = {
  company_name: 'TechCorp Solutions',
  industry: 'Tecnologia',
  company_size: '50-200 empleados',
  location: 'Ciudad de Mexico, Mexico',
  website_url: 'https://techcorp.example.com',
  description: 'Empresa lider en desarrollo de software y soluciones tecnologicas innovadoras para empresas.',
  logo_url: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop',
};

const mockVacancies: Vacancy[] = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    role: 'Frontend',
    status: 'open',
    applicants: 24,
    salary_range: '$60,000 - $80,000 USD',
    requirements: ['React', 'TypeScript', '5+ anos experiencia'],
    created_at: '2024-03-15',
  },
  {
    id: '2',
    title: 'Backend Engineer (Node.js)',
    role: 'Backend',
    status: 'open',
    applicants: 18,
    salary_range: '$55,000 - $75,000 USD',
    requirements: ['Node.js', 'PostgreSQL', 'AWS'],
    created_at: '2024-03-10',
  },
  {
    id: '3',
    title: 'DevOps Engineer',
    role: 'DevOps',
    status: 'closed',
    applicants: 12,
    salary_range: '$70,000 - $90,000 USD',
    requirements: ['Kubernetes', 'Terraform', 'CI/CD'],
    created_at: '2024-02-28',
  },
  {
    id: '4',
    title: 'QA Automation Lead',
    role: 'QA',
    status: 'draft',
    applicants: 0,
    salary_range: '$50,000 - $65,000 USD',
    requirements: ['Playwright', 'Cypress', 'Liderazgo'],
    created_at: '2024-03-18',
  },
];

// KPI Card Component
function KPICard({ 
  icon: Icon, 
  label, 
  value, 
  trend, 
  delay 
}: { 
  icon: typeof Briefcase; 
  label: string; 
  value: string | number;
  trend?: { value: number; positive: boolean };
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-0 dark:border-white/10 dark:bg-zinc-950">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 dark:from-violet-600/5 dark:to-purple-600/5" />
        <CardContent className="relative p-4 md:p-6">
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/20">
              <Icon className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            </div>
            {trend && (
              <div className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ${
                trend.positive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
              }`}>
                <TrendingUp className={`h-3 w-3 ${!trend.positive && 'rotate-180'}`} />
                {trend.value}%
              </div>
            )}
          </div>
          <div className="mt-4">
            <p className="font-sans text-3xl font-bold text-black dark:text-white">{value}</p>
            <p className="mt-1 font-sans text-sm text-gray-500 dark:text-gray-400">{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Vacancy Card Component
function VacancyCard({ vacancy, index }: { vacancy: Vacancy; index: number }) {
  const statusConfig = {
    open: { label: 'Abierta', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30' },
    closed: { label: 'Cerrada', color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30' },
    draft: { label: 'Borrador', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30' },
  };

  const status = statusConfig[vacancy.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.3 }}
    >
      <Card className="group rounded-2xl border border-gray-200 bg-white p-0 transition-all hover:border-violet-500/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.1)] dark:border-white/10 dark:bg-zinc-950 dark:hover:border-violet-500/50">
        <CardContent className="p-4 md:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h3 className="font-sans text-base font-semibold text-black sm:text-lg dark:text-white">{vacancy.title}</h3>
                <Badge className={`border ${status.color} text-xs`}>
                  {status.label}
                </Badge>
              </div>
              <p className="mt-1 font-sans text-sm text-gray-500 dark:text-gray-400">{vacancy.role}</p>
            </div>
            <div className="flex items-center gap-2 self-start rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 dark:border-violet-500/20 dark:bg-violet-500/10">
              <Users className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              <span className="font-sans text-sm font-medium text-violet-700 dark:text-violet-300">{vacancy.applicants}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {vacancy.requirements.map((req) => (
              <Badge key={req} variant="outline" className="border-gray-200 bg-transparent text-xs text-gray-600 dark:border-white/20 dark:text-gray-400">
                {req}
              </Badge>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="font-sans text-gray-600 dark:text-gray-400">{vacancy.salary_range}</span>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 self-start font-sans text-violet-600 hover:bg-violet-50 hover:text-violet-700 sm:self-auto dark:text-violet-400 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
            >
              Ver detalles
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Create Vacancy Modal Component
function CreateVacancyModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    role: '',
    requirements: '',
    salaryMin: '',
    salaryMax: '',
  });

  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    onClose();
    setStep(1);
    setFormData({ title: '', role: '', requirements: '', salaryMin: '', salaryMax: '' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-zinc-950"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-sans text-xl font-bold text-black dark:text-white">Crear Nueva Vacante</h2>
                  <p className="mt-1 font-sans text-sm text-gray-500 dark:text-gray-400">Paso {step} de {totalSteps}</p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mb-6 flex gap-2">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i < step ? 'bg-gradient-to-r from-violet-600 to-purple-600' : 'bg-gray-200 dark:bg-white/10'
                    }`}
                  />
                ))}
              </div>

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="mb-2 block font-sans text-sm font-medium text-black dark:text-white">
                        Titulo de la vacante
                      </label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Ej: Senior Frontend Developer"
                        className="rounded-xl border-gray-200 bg-gray-50 font-sans text-black placeholder:text-gray-400 focus:border-violet-500 dark:border-white/20 dark:bg-black dark:text-white dark:placeholder:text-gray-500 dark:focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block font-sans text-sm font-medium text-black dark:text-white">
                        Rol / Categoria
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 font-sans text-sm text-black focus:border-violet-500 focus:outline-none dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-violet-500"
                      >
                        <option value="">Seleccionar rol...</option>
                        <option value="frontend">Frontend</option>
                        <option value="backend">Backend</option>
                        <option value="fullstack">Full Stack</option>
                        <option value="devops">DevOps</option>
                        <option value="qa">QA / Testing</option>
                        <option value="data">Data Engineering</option>
                        <option value="mobile">Mobile</option>
                      </select>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="mb-2 block font-sans text-sm font-medium text-black dark:text-white">
                        Requisitos (separados por coma)
                      </label>
                      <Textarea
                        value={formData.requirements}
                        onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                        placeholder="React, TypeScript, 5+ anos de experiencia..."
                        className="min-h-[120px] rounded-xl border-gray-200 bg-gray-50 font-sans text-black placeholder:text-gray-400 focus:border-violet-500 dark:border-white/20 dark:bg-black dark:text-white dark:placeholder:text-gray-500 dark:focus:border-violet-500"
                      />
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="mb-2 block font-sans text-sm font-medium text-black dark:text-white">
                        Rango Salarial (USD anual)
                      </label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          value={formData.salaryMin}
                          onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                          placeholder="Min"
                          className="rounded-xl border-gray-200 bg-gray-50 font-sans text-black placeholder:text-gray-400 focus:border-violet-500 dark:border-white/20 dark:bg-black dark:text-white dark:placeholder:text-gray-500 dark:focus:border-violet-500"
                        />
                        <span className="text-gray-500 dark:text-gray-400">-</span>
                        <Input
                          type="number"
                          value={formData.salaryMax}
                          onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                          placeholder="Max"
                          className="rounded-xl border-gray-200 bg-gray-50 font-sans text-black placeholder:text-gray-400 focus:border-violet-500 dark:border-white/20 dark:bg-black dark:text-white dark:placeholder:text-gray-500 dark:focus:border-violet-500"
                        />
                      </div>
                    </div>
                    <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-500/20 dark:bg-violet-500/5">
                      <p className="font-sans text-sm text-violet-700 dark:text-violet-300">
                        Al publicar esta vacante, sera visible para todos los profesionales en EthosHub.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-6 flex justify-between">
                <Button
                  variant="outline"
                  onClick={step === 1 ? onClose : handleBack}
                  className="rounded-xl border-gray-200 bg-white font-sans text-black hover:bg-gray-50 dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
                >
                  {step === 1 ? 'Cancelar' : 'Atras'}
                </Button>
                <Button
                  onClick={step === totalSteps ? handleSubmit : handleNext}
                  className="rounded-xl border-0 bg-gradient-to-r from-violet-600 to-purple-600 font-sans text-white shadow-lg"
                >
                  {step === totalSteps ? 'Publicar Vacante' : 'Siguiente'}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// Edit Company Modal Component
function EditCompanyModal({
  isOpen,
  onClose,
  profile,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  profile: CompanyProfile;
  onSave: (data: CompanyProfile) => void;
}) {
  const [formData, setFormData] = useState(profile);

  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-zinc-950"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-sans text-xl font-bold text-black dark:text-white">Editar Perfil de Empresa</h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block font-sans text-sm font-medium text-black dark:text-white">
                    Nombre de la empresa
                  </label>
                  <Input
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="rounded-xl border-gray-200 bg-gray-50 font-sans text-black focus:border-violet-500 dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-sans text-sm font-medium text-black dark:text-white">
                    Industria
                  </label>
                  <Input
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="rounded-xl border-gray-200 bg-gray-50 font-sans text-black focus:border-violet-500 dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-sans text-sm font-medium text-black dark:text-white">
                    Tamano de empresa
                  </label>
                  <select
                    value={formData.company_size}
                    onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 font-sans text-sm text-black focus:border-violet-500 focus:outline-none dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-violet-500"
                  >
                    <option value="1-10 empleados">1-10 empleados</option>
                    <option value="11-50 empleados">11-50 empleados</option>
                    <option value="50-200 empleados">50-200 empleados</option>
                    <option value="200-500 empleados">200-500 empleados</option>
                    <option value="500+ empleados">500+ empleados</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block font-sans text-sm font-medium text-black dark:text-white">
                    Ubicacion
                  </label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="rounded-xl border-gray-200 bg-gray-50 font-sans text-black focus:border-violet-500 dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-sans text-sm font-medium text-black dark:text-white">
                    Sitio Web
                  </label>
                  <Input
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    className="rounded-xl border-gray-200 bg-gray-50 font-sans text-black focus:border-violet-500 dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-sans text-sm font-medium text-black dark:text-white">
                    Descripcion
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="min-h-[100px] rounded-xl border-gray-200 bg-gray-50 font-sans text-black focus:border-violet-500 dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="rounded-xl border-gray-200 bg-white font-sans text-black hover:bg-gray-50 dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="rounded-xl border-0 bg-gradient-to-r from-violet-600 to-purple-600 font-sans text-white shadow-lg"
                >
                  Guardar Cambios
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function RecruiterDashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [companyProfile, setCompanyProfile] = useState(mockCompanyProfile);
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [showCreateVacancy, setShowCreateVacancy] = useState(false);

  const openVacancies = mockVacancies.filter(v => v.status === 'open').length;
  const totalApplicants = mockVacancies.reduce((sum, v) => sum + v.applicants, 0);
  const savedTalent = 12;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 dark:bg-black">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 md:mb-8"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          <span className="font-sans text-sm font-medium uppercase tracking-wider text-violet-600 dark:text-violet-400">
            Panel de Reclutador
          </span>
        </div>
        <h1 className="mt-2 font-sans text-2xl font-bold text-black sm:text-3xl dark:text-white">
          Bienvenido, {user?.name?.split(' ')[0] || 'Reclutador'}
        </h1>
        <p className="mt-1 font-sans text-gray-600 dark:text-gray-400">
          Tu centro de comando para gestionar vacantes y encontrar talento.
        </p>
      </motion.div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mb-8 lg:grid-cols-3">
        <KPICard
          icon={Briefcase}
          label="Vacantes Activas"
          value={openVacancies}
          trend={{ value: 12, positive: true }}
          delay={0}
        />
        <KPICard
          icon={Users}
          label="Postulaciones Recibidas"
          value={totalApplicants}
          trend={{ value: 8, positive: true }}
          delay={0.1}
        />
        <KPICard
          icon={Heart}
          label="Talento Guardado"
          value={savedTalent}
          delay={0.2}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col gap-3 sm:flex-row sm:flex-wrap"
          >
            <Button
              onClick={() => navigate('/recruiter/talent-discovery')}
              className="gap-2 rounded-xl border-0 bg-gradient-to-r from-violet-600 to-purple-600 px-5 font-sans text-white shadow-lg"
            >
              <Search className="h-4 w-4" />
              Busqueda de Talento
            </Button>
            <Button
              onClick={() => setShowCreateVacancy(true)}
              variant="outline"
              className="gap-2 rounded-xl border-gray-200 bg-white font-sans text-black hover:bg-gray-50 dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
            >
              <Plus className="h-4 w-4" />
              Crear Nueva Vacante
            </Button>
          </motion.div>

          {/* Mis Vacantes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="rounded-2xl border border-gray-200 bg-white p-0 dark:border-white/10 dark:bg-zinc-950">
              <CardHeader className="border-b border-gray-200 p-4 md:p-5 dark:border-white/10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/20">
                      <Briefcase className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <CardTitle className="font-sans text-lg font-semibold text-black dark:text-white">
                        Mis Vacantes
                      </CardTitle>
                      <p className="font-sans text-sm text-gray-500 dark:text-gray-400">
                        {mockVacancies.length} vacantes en total
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowCreateVacancy(true)}
                    size="sm"
                    className="gap-1 self-start rounded-xl border-0 bg-violet-100 font-sans text-sm text-violet-700 hover:bg-violet-200 sm:self-auto dark:bg-violet-500/20 dark:text-violet-300 dark:hover:bg-violet-500/30"
                  >
                    <Plus className="h-4 w-4" />
                    Nueva
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 p-4 md:p-5">
                {mockVacancies.map((vacancy, index) => (
                  <VacancyCard key={vacancy.id} vacancy={vacancy} index={index} />
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sidebar - Company Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-6"
        >
          <Card className="rounded-2xl border border-gray-200 bg-white p-0 dark:border-white/10 dark:bg-zinc-950">
            <CardHeader className="border-b border-gray-200 p-4 md:p-5 dark:border-white/10">
              <div className="flex items-center justify-between">
                <CardTitle className="font-sans text-lg font-semibold text-black dark:text-white">
                  Perfil de Empresa
                </CardTitle>
                <button
                  onClick={() => setShowEditCompany(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-violet-600 transition-colors hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-white/10"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-5">
              {/* Company Logo & Name */}
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-black">
                  {companyProfile.logo_url ? (
                    <img 
                      src={companyProfile.logo_url} 
                      alt={companyProfile.company_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Building2 className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-sans text-lg font-bold text-black dark:text-white">
                    {companyProfile.company_name}
                  </h3>
                  <p className="font-sans text-sm text-violet-600 dark:text-violet-400">{companyProfile.industry}</p>
                </div>
              </div>

              {/* Company Info */}
              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Users className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
                  <span className="font-sans text-gray-600 dark:text-gray-400">{companyProfile.company_size}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
                  <span className="font-sans text-gray-600 dark:text-gray-400">{companyProfile.location}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
                  <a 
                    href={companyProfile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 truncate font-sans text-violet-600 hover:underline dark:text-violet-400"
                  >
                    {companyProfile.website_url.replace('https://', '')}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </div>
              </div>

              {/* Description */}
              <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-black/50">
                <p className="font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {companyProfile.description}
                </p>
              </div>

              <Button
                onClick={() => setShowEditCompany(true)}
                variant="outline"
                className="mt-5 w-full gap-2 rounded-xl border-gray-200 bg-white font-sans text-black hover:bg-gray-50 dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
              >
                <Pencil className="h-4 w-4" />
                Editar Perfil de Empresa
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5 dark:border-white/10 dark:bg-zinc-950">
            <h3 className="mb-4 font-sans text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Resumen del mes
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-sans text-sm text-gray-600 dark:text-gray-400">Perfiles vistos</span>
                <span className="font-sans text-lg font-bold text-black dark:text-white">247</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-sans text-sm text-gray-600 dark:text-gray-400">Contactos enviados</span>
                <span className="font-sans text-lg font-bold text-black dark:text-white">18</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-sans text-sm text-gray-600 dark:text-gray-400">Tasa de respuesta</span>
                <span className="font-sans text-lg font-bold text-emerald-600 dark:text-emerald-400">72%</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Modals */}
      <EditCompanyModal
        isOpen={showEditCompany}
        onClose={() => setShowEditCompany(false)}
        profile={companyProfile}
        onSave={setCompanyProfile}
      />
      <CreateVacancyModal
        isOpen={showCreateVacancy}
        onClose={() => setShowCreateVacancy(false)}
      />
    </div>
  );
}