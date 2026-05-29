import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  User,
  FileText,
  Image,
  MessageSquare,
  Flag,
  Activity,
  Server,
  Database,
  Zap,
  RefreshCw,
  ChevronDown,
  ExternalLink,
  Trash2,
  Check,
  X,
  Filter,
  Calendar,
} from 'lucide-react';
import { Button, Card, Badge, Avatar, Modal } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

// Types for admin schema
interface AuditLogEntry {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  action: string;
  entity_type: 'portfolio' | 'project' | 'profile' | 'skill' | 'connection' | 'auth';
  entity_id?: string;
  details: string;
  ip_address: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

interface ModerationItem {
  id: string;
  type: 'profile_content' | 'project' | 'image' | 'comment';
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content_preview: string;
  reason: string;
  reported_at: string;
  reported_by: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
}

interface SystemStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  uptime: string;
  lastCheck: string;
}

// Mock audit logs (admin.audit_trail)
const mockAuditLogs: AuditLogEntry[] = [
  {
    id: '1',
    user_id: 'u1',
    user_name: 'Ana Martinez',
    user_avatar: 'https://i.pravatar.cc/150?u=ana',
    action: 'UPDATE',
    entity_type: 'portfolio',
    entity_id: 'p123',
    details: 'Actualizo la seccion de habilidades',
    ip_address: '192.168.1.45',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    severity: 'info',
  },
  {
    id: '2',
    user_id: 'u2',
    user_name: 'Carlos Ruiz',
    user_avatar: 'https://i.pravatar.cc/150?u=carlos',
    action: 'CREATE',
    entity_type: 'project',
    entity_id: 'proj456',
    details: 'Creo nuevo proyecto "E-commerce Platform"',
    ip_address: '192.168.1.67',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    severity: 'success',
  },
  {
    id: '3',
    user_id: 'u3',
    user_name: 'Maria Lopez',
    user_avatar: 'https://i.pravatar.cc/150?u=maria',
    action: 'DELETE',
    entity_type: 'project',
    entity_id: 'proj789',
    details: 'Elimino proyecto "Old Website"',
    ip_address: '192.168.1.89',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    severity: 'warning',
  },
  {
    id: '4',
    user_id: 'u4',
    user_name: 'Pedro Sanchez',
    action: 'LOGIN_FAILED',
    entity_type: 'auth',
    details: 'Intento de login fallido (3 intentos)',
    ip_address: '192.168.2.10',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    severity: 'error',
  },
  {
    id: '5',
    user_id: 'u5',
    user_name: 'Laura Garcia',
    user_avatar: 'https://i.pravatar.cc/150?u=laura',
    action: 'UPDATE',
    entity_type: 'profile',
    details: 'Actualizo foto de perfil',
    ip_address: '192.168.1.23',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    severity: 'info',
  },
  {
    id: '6',
    user_id: 'u6',
    user_name: 'Javier Fernandez',
    user_avatar: 'https://i.pravatar.cc/150?u=javier',
    action: 'CREATE',
    entity_type: 'connection',
    details: 'Nueva conexion con @sofiatorres',
    ip_address: '192.168.1.78',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    severity: 'success',
  },
];

// Mock moderation queue
const mockModerationItems: ModerationItem[] = [
  {
    id: 'm1',
    type: 'profile_content',
    user_id: 'u9',
    user_name: 'Usuario Sospechoso',
    user_avatar: 'https://i.pravatar.cc/150?u=suspicious',
    content_preview: 'Contenido de perfil con posible spam o enlaces maliciosos...',
    reason: 'Contenido reportado como spam',
    reported_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    reported_by: '@anamartinez',
    status: 'pending',
    priority: 'high',
  },
  {
    id: 'm2',
    type: 'project',
    user_id: 'u10',
    user_name: 'John Test',
    user_avatar: 'https://i.pravatar.cc/150?u=johntest',
    content_preview: 'Proyecto con imagenes inapropiadas...',
    reason: 'Imagenes inapropiadas',
    reported_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    reported_by: '@carlosruiz',
    status: 'pending',
    priority: 'high',
  },
  {
    id: 'm3',
    type: 'comment',
    user_id: 'u11',
    user_name: 'Troll Account',
    content_preview: 'Comentario ofensivo en el proyecto de otro usuario...',
    reason: 'Lenguaje ofensivo',
    reported_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    reported_by: '@marialopez',
    status: 'pending',
    priority: 'medium',
  },
];

// System health mock
const mockSystemStatus: SystemStatus[] = [
  { name: 'API Server', status: 'healthy', latency: 45, uptime: '99.99%', lastCheck: '5s ago' },
  { name: 'Database', status: 'healthy', latency: 12, uptime: '99.95%', lastCheck: '5s ago' },
  { name: 'Auth Service', status: 'healthy', latency: 23, uptime: '99.98%', lastCheck: '5s ago' },
  { name: 'CDN', status: 'healthy', latency: 8, uptime: '100%', lastCheck: '5s ago' },
];

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const date = new Date(timestamp);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diff < 60) return 'hace unos segundos';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} horas`;
  return `hace ${Math.floor(diff / 86400)} dias`;
};

const getEntityIcon = (type: string) => {
  switch (type) {
    case 'portfolio': return FileText;
    case 'project': return FileText;
    case 'profile': return User;
    case 'skill': return Zap;
    case 'connection': return User;
    case 'auth': return Shield;
    default: return Activity;
  }
};

const getModerationTypeIcon = (type: string) => {
  switch (type) {
    case 'profile_content': return User;
    case 'project': return FileText;
    case 'image': return Image;
    case 'comment': return MessageSquare;
    default: return Flag;
  }
};

export default function AdminModerationPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(mockAuditLogs);
  const [moderationItems, setModerationItems] = useState<ModerationItem[]>(mockModerationItems);
  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>(mockSystemStatus);
  const [selectedLogFilter, setSelectedLogFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [showAllLogs, setShowAllLogs] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStatus(prev => prev.map(s => ({
        ...s,
        latency: Math.max(5, s.latency + Math.floor(Math.random() * 10) - 5),
        lastCheck: '5s ago',
      })));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleModerationAction = (itemId: string, action: 'approve' | 'reject') => {
    setModerationItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, status: action === 'approve' ? 'approved' : 'rejected' }
          : item
      )
    );
  };

  const filteredLogs = auditLogs.filter(log => 
    selectedLogFilter === 'all' || log.severity === selectedLogFilter
  );

  const displayedLogs = showAllLogs ? filteredLogs : filteredLogs.slice(0, 6);
  const pendingItems = moderationItems.filter(item => item.status === 'pending');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'bg-violet-500';
      case 'success': return 'bg-emerald-500';
      case 'warning': return 'bg-amber-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-violet-500';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="border-0 bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">Alta Prioridad</Badge>;
      case 'medium':
        return <Badge className="border-0 bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">Media</Badge>;
      case 'low':
        return <Badge className="border-0 bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400">Baja</Badge>;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400" />;
      case 'down': return <XCircle className="h-4 w-4 text-red-500 dark:text-red-400" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen space-y-4 sm:space-y-6 bg-gray-50 p-4 sm:p-6 dark:bg-black">
      {/* Header - Adaptado para móvil */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Moderación y Auditoría
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-violet-300/70">Panel de control del esquema admin</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="border-gray-200 bg-white text-gray-700 hover:bg-gray-100 dark:border-violet-500/30 dark:bg-transparent dark:text-violet-300 dark:hover:border-violet-500/50 dark:hover:bg-violet-500/10"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
            Actualizar
          </Button>
          {pendingItems.length > 0 && (
            <Badge className="border-0 bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
              <Flag className="mr-1 h-3 w-3" />
              {pendingItems.length} pendientes
            </Badge>
          )}
        </div>
      </div>

      {/* System Health Grid - Arreglado el responsive para móvil (1 col), tablet (2 col), desktop (4 col) */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
        {systemStatus.map((service, index) => (
          <motion.div
            key={service.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-violet-300 dark:border-violet-500/20 dark:bg-zinc-950 dark:hover:border-violet-500/40"
          >
            {service.status === 'healthy' && (
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-500/10">
                {service.name === 'API Server' && <Server className="h-5 w-5 text-violet-600 dark:text-violet-400" />}
                {service.name === 'Database' && <Database className="h-5 w-5 text-violet-600 dark:text-violet-400" />}
                {service.name === 'Auth Service' && <Shield className="h-5 w-5 text-violet-600 dark:text-violet-400" />}
                {service.name === 'CDN' && <Zap className="h-5 w-5 text-violet-600 dark:text-violet-400" />}
              </div>
              <div className="relative">
                {getStatusIcon(service.status)}
                {service.status === 'healthy' && (
                  <span className="absolute inset-0 animate-ping">
                    <CheckCircle className="h-4 w-4 text-emerald-500/50 dark:text-emerald-400/50" />
                  </span>
                )}
              </div>
            </div>
            <div className="mt-3">
              <p className="font-medium text-gray-900 dark:text-white">{service.name}</p>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="text-emerald-600 dark:text-emerald-400">{service.latency}ms</span>
                <span className="text-gray-300 dark:text-violet-500">|</span>
                <span className="text-gray-500 dark:text-violet-300/60">{service.uptime}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid - Pasa a 1 columna en móvil y 2 en pantallas grandes */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Audit Trail Timeline */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 dark:border-violet-500/20 dark:bg-zinc-950">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-sans text-lg font-semibold text-gray-900 dark:text-white">Audit Trail</h2>
                <p className="text-sm text-gray-500 dark:text-violet-300/60">admin.audit_logs</p>
              </div>
              <div className="flex w-full items-center sm:w-auto">
                <select
                  value={selectedLogFilter}
                  onChange={(e) => setSelectedLogFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-violet-500 focus:outline-none sm:w-auto dark:border-violet-500/20 dark:bg-black dark:text-violet-300 dark:focus:border-violet-500/50"
                >
                  <option value="all">Todos</option>
                  <option value="info">Info</option>
                  <option value="success">Éxito</option>
                  <option value="warning">Advertencia</option>
                  <option value="error">Error</option>
                </select>
              </div>
            </div>

            {/* Timeline */}
            <div className="relative space-y-4">
              <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-gray-200 via-gray-100 to-transparent dark:from-violet-500/50 dark:via-violet-500/20" />

              <AnimatePresence mode="popLayout">
                {displayedLogs.map((log, index) => {
                  const EntityIcon = getEntityIcon(log.entity_type);
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative flex gap-4 pl-8"
                    >
                      <div className={cn(
                        "absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white dark:border-black",
                        getSeverityColor(log.severity)
                      )}>
                        <EntityIcon className="h-3 w-3 text-white" />
                      </div>

                      <div className="flex-1 rounded-lg border border-gray-100 bg-gray-50 p-3 transition-all hover:border-gray-300 dark:border-violet-500/10 dark:bg-violet-500/5 dark:hover:border-violet-500/20">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar 
                              src={log.user_avatar} 
                              name={log.user_name} 
                              size="sm" 
                              className="border border-gray-200 dark:border-violet-500/20"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{log.user_name}</p>
                              <p className="text-xs text-gray-500 dark:text-violet-300/60">{formatTimeAgo(log.timestamp)}</p>
                            </div>
                          </div>
                          <Badge 
                            className={cn(
                              "w-fit border-0 text-xs",
                              log.severity === 'info' && "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
                              log.severity === 'success' && "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
                              log.severity === 'warning' && "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
                              log.severity === 'error' && "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"
                            )}
                          >
                            {log.action}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-gray-700 dark:text-violet-300/80">{log.details}</p>
                        <p className="mt-1 text-xs text-gray-400 dark:text-violet-400/50">IP: {log.ip_address}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {filteredLogs.length > 6 && (
                <button
                  onClick={() => setShowAllLogs(!showAllLogs)}
                  className="ml-8 flex items-center gap-2 text-sm text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                >
                  <ChevronDown className={cn("h-4 w-4 transition-transform", showAllLogs && "rotate-180")} />
                  {showAllLogs ? 'Ver menos' : `Ver ${filteredLogs.length - 6} mas`}
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Moderation Queue */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 dark:border-violet-500/20 dark:bg-zinc-950">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-sans text-lg font-semibold text-gray-900 dark:text-white">Cola de Moderación</h2>
                <p className="text-sm text-gray-500 dark:text-violet-300/60">admin.moderation_queue</p>
              </div>
              <Badge className="border-0 bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
                {pendingItems.length} pendientes
              </Badge>
            </div>

            <div className="space-y-4">
              {pendingItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/10">
                    <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="mt-4 font-medium text-gray-900 dark:text-white">Todo en orden</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-violet-300/60">No hay contenido pendiente de revisión</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {pendingItems.map((item, index) => {
                    const TypeIcon = getModerationTypeIcon(item.type);
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                          "rounded-xl border p-4 transition-all",
                          item.priority === 'high' 
                            ? "border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/5"
                            : item.priority === 'medium'
                            ? "border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/5"
                            : "border-gray-200 bg-gray-50 dark:border-violet-500/20 dark:bg-violet-500/5"
                        )}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                              item.priority === 'high' ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                              : item.priority === 'medium' ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                              : "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400"
                            )}>
                              <TypeIcon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium text-gray-900 dark:text-white">{item.user_name}</p>
                                {getPriorityBadge(item.priority)}
                              </div>
                              <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-violet-300/70">
                                {item.content_preview}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-violet-400/60">
                                <span className="flex items-center gap-1">
                                  <Flag className="h-3 w-3" />
                                  {item.reason}
                                </span>
                                <span className="hidden sm:inline">|</span>
                                <span>Por {item.reported_by}</span>
                                <span className="hidden sm:inline">|</span>
                                <span>{formatTimeAgo(item.reported_at)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions - Responsivo en móvil */}
                        <div className="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-violet-500/10">
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setDetailModalOpen(true);
                            }}
                            className="flex items-center gap-2 text-sm text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                          >
                            <Eye className="h-4 w-4" />
                            Ver detalles
                          </button>
                          <div className="flex w-full items-center gap-2 sm:w-auto">
                            <Button
                              size="sm"
                              onClick={() => handleModerationAction(item.id, 'reject')}
                              className="flex-1 border-red-200 bg-white text-red-600 hover:bg-red-50 sm:flex-none dark:border-red-500/30 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-500/10"
                              variant="outline"
                            >
                              <X className="mr-1 h-4 w-4" />
                              Rechazar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleModerationAction(item.id, 'approve')}
                              className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 sm:flex-none"
                            >
                              <Check className="mr-1 h-4 w-4" />
                              Aprobar
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Statistics Row - Arreglado el grid responsivo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4"
      >
        {[
          { label: 'Acciones Hoy', value: '1,247', icon: Activity, color: 'violet' },
          { label: 'Reportes Resueltos', value: '89', icon: CheckCircle, color: 'emerald' },
          { label: 'Advertencias Activas', value: '12', icon: AlertTriangle, color: 'amber' },
          { label: 'Usuarios Baneados', value: '3', icon: XCircle, color: 'red' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-4 dark:border-violet-500/20 dark:bg-black"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                stat.color === 'violet' && "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400",
                stat.color === 'emerald' && "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
                stat.color === 'amber' && "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
                stat.color === 'red' && "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
              )}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-violet-300/60">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {detailModalOpen && selectedItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm dark:bg-black/80"
              onClick={() => setDetailModalOpen(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-violet-500/30 dark:bg-black/95 dark:backdrop-blur-xl"
              >
                {/* Header */}
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <h3 className="font-sans text-xl font-semibold text-gray-900 dark:text-white">
                      Revisión de Contenido
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-violet-300/60">
                      ID: {selectedItem.id}
                    </p>
                  </div>
                  <button
                    onClick={() => setDetailModalOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 dark:border-violet-500/20 dark:text-violet-400 dark:hover:bg-violet-500/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* User Info */}
                <div className="mb-6 flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-violet-500/20 dark:bg-violet-500/5">
                  <Avatar 
                    src={selectedItem.user_avatar} 
                    name={selectedItem.user_name} 
                    size="lg" 
                    className="border-2 border-gray-200 dark:border-violet-500/30"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedItem.user_name}</p>
                    <p className="text-sm text-gray-500 dark:text-violet-300/60">Usuario reportado</p>
                    {getPriorityBadge(selectedItem.priority)}
                  </div>
                </div>

                {/* Content Preview */}
                <div className="mb-6">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-violet-300/60">
                    Contenido Reportado
                  </p>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-violet-500/20 dark:bg-violet-500/5">
                    <p className="text-sm text-gray-700 dark:text-violet-300/80">{selectedItem.content_preview}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="mb-6 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-violet-300/60">Razón del reporte</span>
                    <span className="text-gray-900 dark:text-white">{selectedItem.reason}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-violet-300/60">Reportado por</span>
                    <span className="text-gray-900 dark:text-white">{selectedItem.reported_by}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-violet-300/60">Fecha del reporte</span>
                    <span className="text-gray-900 dark:text-white">{formatTimeAgo(selectedItem.reported_at)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-violet-300/60">Tipo de contenido</span>
                    <span className="text-gray-900 dark:text-white capitalize">{selectedItem.type.replace('_', ' ')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      handleModerationAction(selectedItem.id, 'reject');
                      setDetailModalOpen(false);
                    }}
                    className="flex-1 border-red-200 bg-white text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-500/10"
                    variant="outline"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </Button>
                  <Button
                    onClick={() => {
                      handleModerationAction(selectedItem.id, 'approve');
                      setDetailModalOpen(false);
                    }}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-700 hover:to-emerald-600"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Aprobar
                  </Button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}