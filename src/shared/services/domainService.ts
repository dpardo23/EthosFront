import api from '@/shared/api/api';

export type DomainResponse = {
  dominio: string;
  fecha_registro: string;
  activo: boolean;
};

export const domainService = {
  getAllDomains: async (): Promise<DomainResponse[]> => {
    const res = await api.get('/admin/domains');
    return res.data.data;
  },
  
  addDomain: async (dominio: string): Promise<void> => {
    await api.post('/admin/domains', { dominio });
  },

  deleteDomain: async (dominio: string): Promise<void> => {
    await api.delete(`/admin/domains/${dominio}`);
  }
};