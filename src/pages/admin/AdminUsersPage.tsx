import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, MoreHorizontal, Mail, ExternalLink, Shield, Ban, UserPlus,
  Download, ChevronLeft, ChevronRight, Eye, UserCog, Trash2, CheckCircle,
  XCircle, Clock, Calendar, MapPin, Building, ArrowUpDown, ArrowUp,
  ArrowDown, Check, X, Filter, Briefcase, User, AlertTriangle,
} from 'lucide-react';
import {
  Button, Card, Badge, Avatar, Input, Modal, LoadingSpinner, EmptyState,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

// Types mapped to core.users and core.profiles_basic
interface UserData {
  id: string;
  email: string;
  username: string;
  nombre_completo: string;
  avatar_url?: string;
  rol: 'Estandar' | 'Reclutador' | 'Admin';
  status: 'active' | 'banned' | 'pending';
  fecha_registro: string;
  ultimo_login?: string;
  ubicacion?: string;
  empresa?: string;
  portfolio_views: number;
  proyectos_count: number;
  conexiones_count: number;
}

// Mock users data
const mockUsers: UserData[] = [
  { id: '1', email: 'ana.martinez@example.com', username: 'anamartinez', nombre_completo: 'Ana Martinez', avatar_url: 'https://i.pravatar.cc/150?u=ana', rol: 'Estandar', status: 'active', fecha_registro: '2023-06-15T10:30:00Z', ultimo_login: '2024-01-15T14:20:00Z', ubicacion: 'Madrid, Spain', empresa: 'TechCorp', portfolio_views: 1234, proyectos_count: 8, conexiones_count: 156 },
  { id: '2', email: 'carlos.ruiz@example.com', username: 'carlosruiz', nombre_completo: 'Carlos Ruiz', avatar_url: 'https://i.pravatar.cc/150?u=carlos', rol: 'Reclutador', status: 'active', fecha_registro: '2023-01-10T08:15:00Z', ultimo_login: '2024-01-16T09:00:00Z', ubicacion: 'Barcelona, Spain', empresa: 'StartupXYZ', portfolio_views: 5678, proyectos_count: 15, conexiones_count: 342 },
  { id: '3', email: 'maria.lopez@example.com', username: 'marialopez', nombre_completo: 'Maria Lopez', avatar_url: 'https://i.pravatar.cc/150?u=maria', rol: 'Admin', status: 'active', fecha_registro: '2023-03-20T12:00:00Z', ultimo_login: '2024-01-14T18:45:00Z', ubicacion: 'Valencia, Spain', portfolio_views: 2345, proyectos_count: 6, conexiones_count: 89 },
  { id: '4', email: 'pedro.sanchez@example.com', username: 'pedros', nombre_completo: 'Pedro Sanchez', avatar_url: 'https://i.pravatar.cc/150?u=pedro', rol: 'Estandar', status: 'pending', fecha_registro: '2024-01-10T15:30:00Z', portfolio_views: 12, proyectos_count: 0, conexiones_count: 0 },
  { id: '5', email: 'laura.garcia@example.com', username: 'lauragarcia', nombre_completo: 'Laura Garcia', avatar_url: 'https://i.pravatar.cc/150?u=laura', rol: 'Estandar', status: 'banned', fecha_registro: '2023-08-05T09:20:00Z', ultimo_login: '2023-12-20T11:30:00Z', ubicacion: 'Sevilla, Spain', portfolio_views: 567, proyectos_count: 3, conexiones_count: 45 },
  { id: '6', email: 'javier.fernandez@example.com', username: 'javierfernandez', nombre_completo: 'Javier Fernandez', avatar_url: 'https://i.pravatar.cc/150?u=javier', rol: 'Reclutador', status: 'active', fecha_registro: '2023-05-12T11:00:00Z', ultimo_login: '2024-01-16T10:30:00Z', ubicacion: 'Bilbao, Spain', empresa: 'HR Solutions', portfolio_views: 890, proyectos_count: 2, conexiones_count: 178 },
  { id: '7', email: 'sofia.torres@example.com', username: 'sofiatorres', nombre_completo: 'Sofia Torres', avatar_url: 'https://i.pravatar.cc/150?u=sofia', rol: 'Estandar', status: 'active', fecha_registro: '2023-09-01T14:15:00Z', ultimo_login: '2024-01-15T16:00:00Z', ubicacion: 'Malaga, Spain', portfolio_views: 1456, proyectos_count: 12, conexiones_count: 234 },
  { id: '8', email: 'diego.navarro@example.com', username: 'diegonavarro', nombre_completo: 'Diego Navarro', avatar_url: 'https://i.pravatar.cc/150?u=diego', rol: 'Estandar', status: 'active', fecha_registro: '2023-11-20T09:45:00Z', ultimo_login: '2024-01-14T12:00:00Z', ubicacion: 'Zaragoza, Spain', empresa: 'DevStudio', portfolio_views: 678, proyectos_count: 5, conexiones_count: 67 },
];

const roleOptions = [
  { value: 'all', label: 'Todos los Roles', icon: Users },
  { value: 'Estandar', label: 'Estandar', icon: User },
  { value: 'Reclutador', label: 'Reclutador', icon: Briefcase },
  { value: 'Admin', label: 'Admin', icon: Shield },
];

const statusOptions = [
  { value: 'all', label: 'Todos los Estados' },
  { value: 'active', label: 'Activo' },
  { value: 'banned', label: 'Baneado' },
  { value: 'pending', label: 'Pendiente' },
];

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; userId: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'nombre_completo' | 'fecha_registro' | 'portfolio_views'>('fecha_registro');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
    }, 800);
  }, []);

  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          user.nombre_completo.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.username.toLowerCase().includes(searchLower);
        const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
        const matchesRole = roleFilter === 'all' || user.rol === roleFilter;
        return matchesSearch && matchesStatus && matchesRole;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'nombre_completo') {
          comparison = a.nombre_completo.localeCompare(b.nombre_completo);
        } else if (sortBy === 'fecha_registro') {
          comparison = new Date(a.fecha_registro).getTime() - new Date(b.fecha_registro).getTime();
        } else if (sortBy === 'portfolio_views') {
          comparison = a.portfolio_views - b.portfolio_views;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [users, searchQuery, statusFilter, roleFilter, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: 'nombre_completo' | 'fecha_registro' | 'portfolio_views') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === paginatedUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(paginatedUsers.map(u => u.id)));
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleAction = (action: string, user: UserData) => {
    if (action === 'view') {
      setSelectedUser(user);
      setDetailModalOpen(true);
    } else if (action === 'changeRole') {
      setSelectedUser(user);
      setRoleModalOpen(true);
    } else if (action === 'ban' || action === 'unban') {
      setConfirmAction({ type: action, userId: user.id });
      setConfirmModalOpen(true);
    }
  };

  const confirmActionHandler = () => {
    if (confirmAction) {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === confirmAction.userId) {
            if (confirmAction.type === 'ban') return { ...u, status: 'banned' };
            if (confirmAction.type === 'unban') return { ...u, status: 'active' };
          }
          return u;
        })
      );
    }
    setConfirmModalOpen(false);
    setConfirmAction(null);
  };

  const handleChangeRole = (newRole: 'Estandar' | 'Reclutador' | 'Admin') => {
    if (selectedUser) {
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? { ...u, rol: newRole } : u)));
      setRoleModalOpen(false);
      setSelectedUser(null);
    }
  };

  const handleBulkExport = () => {
    const selectedData = users.filter((u) => selectedUsers.has(u.id));
    const csv = [
      ['Email', 'Nombre', 'Username', 'Rol', 'Estado', 'Fecha Registro'].join(','),
      ...selectedData.map((u) => [u.email, u.nombre_completo, u.username, u.rol, u.status, u.fecha_registro].join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'usuarios_ethoshub.csv';
    a.click();
  };

  const getStatusBadge = (status: UserData['status']) => {
    const variants = {
      active: { className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-500/30' },
      pending: { className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border-amber-500/30' },
      banned: { className: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400 border-red-500/30' },
    };
    const variant = variants[status];
    return (
      <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium', variant.className)}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getRoleBadge = (rol: UserData['rol']) => {
    const variants = {
      Admin: { className: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400 border-violet-500/30' },
      Reclutador: { className: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400 border-purple-500/30' },
      Estandar: { className: 'bg-gray-100 text-gray-700 dark:bg-slate-500/15 dark:text-slate-400 border-slate-500/30' },
    };
    const variant = variants[rol];
    return (
      <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium', variant.className)}>
        {rol}
      </span>
    );
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <ArrowUpDown className="h-3 w-3 text-gray-400 dark:text-violet-400/50" />;
    return sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-violet-600 dark:text-violet-400" /> : <ArrowDown className="h-3 w-3 text-violet-600 dark:text-violet-400" />;
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-50 dark:bg-black">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full space-y-4 overflow-x-hidden bg-gray-50 dark:bg-black p-4 md:space-y-6 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-tight text-black dark:text-white md:text-3xl">Gestion de Usuarios</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 md:text-base">{users.length.toLocaleString()} usuarios registrados</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
          {selectedUsers.size > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2">
              <span className="text-xs text-violet-600 dark:text-violet-300 sm:text-sm">{selectedUsers.size} seleccionados</span>
              <Button variant="outline" size="sm" onClick={handleBulkExport} className="border-gray-200 dark:border-violet-500/30 bg-white dark:bg-transparent text-black dark:text-violet-300 hover:bg-gray-50 dark:hover:bg-violet-500/10">
                <Download className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Exportar CSV</span>
              </Button>
            </motion.div>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className={cn("border-gray-200 dark:border-violet-500/30 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-violet-500/10", showFilters ? "text-violet-600 dark:text-violet-300" : "text-gray-600 dark:text-violet-300/70")}>
            <Filter className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Filtros</span>
          </Button>
          <Button className="bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg hover:from-violet-700 hover:to-purple-700">
            <UserPlus className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Agregar Usuario</span>
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="space-y-3 md:space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-violet-400/50 sm:left-4 sm:h-5 sm:w-5" />
          <input
            type="text"
            placeholder="Buscar por email, nombre o username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-violet-500/20 bg-white dark:bg-black py-2.5 pl-10 pr-4 text-sm text-black dark:text-white placeholder-gray-400 dark:placeholder-violet-400/40 transition-all focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 sm:py-3 sm:pl-12 sm:text-base"
          />
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="flex flex-col gap-3 rounded-xl border border-gray-200 dark:border-violet-500/20 bg-white dark:bg-black/60 p-3 sm:flex-row sm:flex-wrap sm:gap-4 sm:p-4">
                <div className="min-w-0 flex-1 sm:min-w-[180px]">
                  <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-violet-300/70 sm:mb-2">Rol</label>
                  <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-violet-500/20 bg-white dark:bg-black px-3 py-2 text-sm text-black dark:text-white focus:border-violet-500/50 focus:outline-none">
                    {roleOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="min-w-0 flex-1 sm:min-w-[180px]">
                  <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-violet-300/70 sm:mb-2">Estado</label>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-violet-500/20 bg-white dark:bg-black px-3 py-2 text-sm text-black dark:text-white focus:border-violet-500/50 focus:outline-none">
                    {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Users List/Table */}
      <div className="w-full max-w-full overflow-hidden rounded-xl border border-gray-200 dark:border-violet-500/20 bg-white dark:bg-black">
        {paginatedUsers.length === 0 ? (
          <div className="p-8 md:p-12"><EmptyState icon={Users} title="No se encontraron usuarios" description="Intenta ajustar los filtros" /></div>
        ) : (
          <>
            {/* Mobile Card List View */}
            <div className="block md:hidden">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-violet-500/20 bg-gray-50 dark:bg-violet-500/5 px-4 py-3">
                <button onClick={handleSelectAll} className={cn("flex items-center gap-2 text-xs font-medium", selectedUsers.size === paginatedUsers.length ? "text-violet-600 dark:text-violet-400" : "text-gray-500 dark:text-violet-300/70")}>
                  <span className={cn("flex h-4 w-4 items-center justify-center rounded border transition-all", selectedUsers.size === paginatedUsers.length ? "border-violet-500 bg-violet-500 text-white" : "border-gray-300 dark:border-violet-500/30")}>
                    {selectedUsers.size === paginatedUsers.length && <Check className="h-2.5 w-2.5" />}
                  </span>
                  Seleccionar todos
                </button>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-violet-500/10">
                <AnimatePresence mode="popLayout">
                  {paginatedUsers.map((user, index) => (
                    <motion.div key={user.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ delay: index * 0.03 }} className={cn("flex flex-col gap-3 p-4 transition-colors", selectedUsers.has(user.id) && "bg-violet-50 dark:bg-violet-500/10")}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <button onClick={() => handleSelectUser(user.id)} className={cn("flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-all", selectedUsers.has(user.id) ? "border-violet-500 bg-violet-500 text-white" : "border-gray-300 dark:border-violet-500/30")}>
                            {selectedUsers.has(user.id) && <Check className="h-3 w-3" />}
                          </button>
                          <Avatar src={user.avatar_url} name={user.nombre_completo} size="md" className="flex-shrink-0 border border-gray-200 dark:border-violet-500/20" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-black dark:text-white">{user.nombre_completo}</p>
                            <p className="truncate text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                          </div>
                        </div>
                        <div className="group relative flex-shrink-0">
                          <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-violet-500/20 text-gray-500 dark:text-violet-400 hover:bg-gray-50 dark:hover:bg-violet-500/10">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          <div className="invisible absolute right-0 top-full z-50 mt-2 min-w-[180px] rounded-xl border border-gray-200 dark:border-violet-500/30 bg-white dark:bg-black/95 p-2 opacity-0 shadow-xl transition-all group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                            <button onClick={() => handleAction('view', user)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-black dark:text-violet-300 hover:bg-gray-50 dark:hover:bg-violet-500/10"><Eye className="h-4 w-4" /> Ver Perfil</button>
                            <button onClick={() => handleAction('changeRole', user)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-black dark:text-violet-300 hover:bg-gray-50 dark:hover:bg-violet-500/10"><UserCog className="h-4 w-4" /> Cambiar Rol</button>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pl-8">
                        {getRoleBadge(user.rol)} {getStatusBadge(user.status)}
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"><Calendar className="h-3 w-3" /> {formatDate(user.fecha_registro)}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto w-full">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-violet-500/20 bg-gray-50 dark:bg-violet-500/5">
                    <th className="w-12 px-4 py-4">
                      <button onClick={handleSelectAll} className={cn("flex h-5 w-5 items-center justify-center rounded border transition-all", selectedUsers.size === paginatedUsers.length ? "border-violet-500 bg-violet-500 text-white" : "border-gray-300 dark:border-violet-500/30")}>
                        {selectedUsers.size === paginatedUsers.length && <Check className="h-3 w-3" />}
                      </button>
                    </th>
                    <th className="px-4 py-4 text-left"><button onClick={() => handleSort('nombre_completo')} className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500 dark:text-violet-300/70">Usuario <SortIcon field="nombre_completo" /></button></th>
                    <th className="px-4 py-4 text-left"><span className="text-xs font-semibold uppercase text-gray-500 dark:text-violet-300/70">Rol</span></th>
                    <th className="px-4 py-4 text-left"><span className="text-xs font-semibold uppercase text-gray-500 dark:text-violet-300/70">Estado</span></th>
                    <th className="px-4 py-4 text-left"><button onClick={() => handleSort('fecha_registro')} className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500 dark:text-violet-300/70">Registro <SortIcon field="fecha_registro" /></button></th>
                    <th className="px-4 py-4 text-left"><button onClick={() => handleSort('portfolio_views')} className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500 dark:text-violet-300/70">Vistas <SortIcon field="portfolio_views" /></button></th>
                    <th className="w-16 px-4 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-violet-500/10">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-violet-500/5">
                      <td className="px-4 py-4">
                        <button onClick={() => handleSelectUser(user.id)} className={cn("flex h-5 w-5 items-center justify-center rounded border transition-all", selectedUsers.has(user.id) ? "border-violet-500 bg-violet-500 text-white" : "border-gray-300 dark:border-violet-500/30")}>
                          {selectedUsers.has(user.id) && <Check className="h-3 w-3" />}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar src={user.avatar_url} name={user.nombre_completo} size="md" className="border border-gray-200 dark:border-violet-500/20" />
                          <div><p className="font-medium text-black dark:text-white">{user.nombre_completo}</p><p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p></div>
                        </div>
                      </td>
                      <td className="px-4 py-4">{getRoleBadge(user.rol)}</td>
                      <td className="px-4 py-4">{getStatusBadge(user.status)}</td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-violet-300/80">{formatDate(user.fecha_registro)}</td>
                      <td className="px-4 py-4 text-sm font-medium text-black dark:text-white">{user.portfolio_views.toLocaleString()}</td>
                      <td className="px-4 py-4 text-right">
                         {/* Mismo menú de acciones pero para desktop */}
                         <button onClick={() => handleAction('view', user)} className="text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300 font-medium text-sm">Ver</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 dark:border-violet-500/20 px-4 py-4 sm:flex-row md:px-6">
              <p className="text-xs text-gray-500 dark:text-violet-300/60 sm:text-sm">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredUsers.length)} de {filteredUsers.length}
              </p>
              <div className="flex items-center gap-1 sm:gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="h-8 w-8 p-0 border-gray-200 dark:border-violet-500/30 bg-transparent text-black dark:text-violet-300 sm:h-9 sm:w-9"><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} className="h-8 w-8 p-0 border-gray-200 dark:border-violet-500/30 bg-transparent text-black dark:text-violet-300 sm:h-9 sm:w-9"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal (Corregido fondo oscuro) */}
      <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title="Detalles del Usuario" size="lg">
        {selectedUser && (
          <div className="space-y-6 text-black dark:text-white">
            <div className="flex items-center gap-4">
              <Avatar src={selectedUser.avatar_url} name={selectedUser.nombre_completo} size="xl" className="border-2 border-violet-500/30" />
              <div><h3 className="text-xl font-semibold">{selectedUser.nombre_completo}</h3><p className="text-gray-500 dark:text-gray-400">@{selectedUser.username}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-500">Email</p><p>{selectedUser.email}</p></div>
              <div><p className="text-xs text-gray-500">Registro</p><p>{formatDate(selectedUser.fecha_registro)}</p></div>
            </div>
            <div className="flex justify-end pt-4"><Button onClick={() => setDetailModalOpen(false)} className="bg-violet-600 text-white">Cerrar</Button></div>
          </div>
        )}
      </Modal>
    </div>
  );
}