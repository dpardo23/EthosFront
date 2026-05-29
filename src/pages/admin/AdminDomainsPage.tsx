import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Plus, Trash2, ShieldCheck, MailWarning, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input, Card, Badge } from '@/shared/ui';
import { domainService, DomainResponse } from '@/shared/services/domainService';

export default function AdminDomainsPage() {
  const [domains, setDomains] = useState<DomainResponse[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchDomains = async () => {
    try {
      setLoading(true);
      const data = await domainService.getAllDomains();
      setDomains(data);
    } catch (error) {
      toast.error('Error al cargar dominios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;

    try {
      setSubmitting(true);
      await domainService.addDomain(newDomain);
      toast.success('Dominio añadido exitosamente');
      setNewDomain('');
      fetchDomains(); // Refrescar la lista de la tabla
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al añadir dominio');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDomain = async (dominio: string) => {
    if (dominio === 'gmail.com') {
      toast.error('No puedes eliminar el dominio principal del sistema');
      return;
    }

    if (!window.confirm(`¿Estás seguro de eliminar el dominio ${dominio}?`)) return;

    try {
      await domainService.deleteDomain(dominio);
      toast.success('Dominio eliminado');
      fetchDomains(); // Refrescar la lista de la tabla
    } catch (error) {
      toast.error('Error al eliminar dominio');
    }
  };

  return (
    <div className="max-w-4xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="font-sans text-2xl font-bold tracking-tight text-black dark:text-white md:text-3xl">
          Gestión de Dominios Institucionales
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Controla qué dominios de correo están autorizados para registrarse en la plataforma.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Panel Izquierdo: Formulario de adición */}
        <Card className="col-span-1 border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-950 h-fit">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/20">
              <ShieldCheck className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="font-semibold text-black dark:text-white">Añadir Dominio</h2>
          </div>
          
          <form onSubmit={handleAddDomain} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Nuevo dominio permitido
              </label>
              <Input
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="ej: mi-universidad.edu"
                className="bg-gray-50 dark:bg-black"
                disabled={submitting}
              />
            </div>
            <Button
              type="submit"
              disabled={!newDomain.trim() || submitting}
              loading={submitting}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Autorizar Dominio
            </Button>
          </form>

          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
            <div className="flex gap-2">
              <MailWarning className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Si eliminas un dominio, los usuarios con ese correo no podrán iniciar sesión hasta que vuelvas a autorizarlo.
              </p>
            </div>
          </div>
        </Card>

        {/* Panel Derecho: Lista de dominios */}
        <Card className="col-span-2 border-gray-200 bg-white p-0 dark:border-white/10 dark:bg-zinc-950 overflow-hidden">
          <div className="border-b border-gray-200 p-5 dark:border-white/10">
            <h2 className="font-semibold text-black dark:text-white flex items-center gap-2">
              <Globe className="h-5 w-5 text-gray-500" />
              Lista de Autorizados
              <Badge variant="secondary" className="ml-2 bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                {domains.length} activos
              </Badge>
            </h2>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-gray-500">Cargando dominios...</div>
            ) : domains.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">No hay dominios registrados.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 dark:bg-white/5 dark:text-gray-400">
                  <tr>
                    <th className="px-5 py-3 font-medium">Dominio</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="px-5 py-3 font-medium text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                  {domains.map((domain, idx) => (
                    <motion.tr 
                      key={domain.dominio}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-gray-50 dark:hover:bg-white/5"
                    >
                      <td className="px-5 py-4 font-medium text-black dark:text-white">
                        @{domain.dominio}
                      </td>
                      <td className="px-5 py-4">
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border-0">
                          Activo
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {/* VALIDACIÓN VISUAL AQUÍ */}
                        {domain.dominio === 'gmail.com' ? (
                          <div className="inline-flex items-center justify-end gap-1 px-3 text-xs font-medium text-gray-400 dark:text-gray-500">
                            <Lock className="h-3 w-3" />
                            Protegido
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDomain(domain.dominio)}
                            className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}