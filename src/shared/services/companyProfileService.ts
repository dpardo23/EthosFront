import type { CompanyProfile } from '@/shared/types';

/**
 * API service layer for recruiter company profile read and update operations.
 */
const API_BASE_URL = ((import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_BASE_URL || '').replace(/\/$/, '');

type ApiEnvelope<T> = {
  code?: number;
  status?: number;
  success?: boolean;
  message: string;
  data?: T;
  errors?: string[];
};

async function requestJson<T>(path: string, init: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...(init.headers || {}),
    },
    ...init,
  });

  const payload = (await response.json()) as ApiEnvelope<T>;
  const isSuccess = response.ok || payload.success === true || payload.code === 200 || payload.code === 201;

  if (!isSuccess) {
    const details = payload.errors?.[0] || payload.message || 'Error en la solicitud';
    throw new Error(details);
  }

  if (!payload.data) {
    throw new Error('Respuesta del servidor sin datos');
  }

  return payload.data;
}

export const companyProfileService = {
  
  async saveCompanyProfile(profileId: string, companyData: CompanyProfile): Promise<CompanyProfile> {
    const response = await requestJson<{
      profileId: string;
      companyName: string;
      industry: string;
      companySize: number;
      nit: string;
      contactFirstName: string;
      contactLastName: string;
      websiteUrl: string;
      phone?: string;
    }>(`/api/v1/recruiter/profile/company/${profileId}`, {
      method: 'PUT',
      body: JSON.stringify({
        companyName: companyData.company_name,
        industry: companyData.industry,
        companySize: typeof companyData.company_size === 'string'
          ? parseInt(companyData.company_size, 10)
          : companyData.company_size,
        nit: companyData.nit || '',
        contactFirstName: companyData.contact_first_name || '',
        contactLastName: companyData.contact_last_name || '',
        websiteUrl: companyData.website_url,
        phone: companyData.phone || '',
      }),
    });

    return {
      profile_id: response.profileId,
      company_name: response.companyName,
      industry: response.industry,
      company_size: response.companySize,
      nit: response.nit,
      contact_first_name: response.contactFirstName,
      contact_last_name: response.contactLastName,
      website_url: response.websiteUrl,
      phone: response.phone,
    };
  },

  
  async getCompanyProfile(profileId: string): Promise<CompanyProfile> {
    const response = await requestJson<{
      profileId: string;
      companyName: string;
      industry: string;
      companySize: number;
      nit: string;
      contactFirstName: string;
      contactLastName: string;
      websiteUrl: string;
      phone?: string;
    }>(`/api/v1/recruiter/profile/company/${profileId}`, {
      method: 'GET',
    });

    return {
      profile_id: response.profileId,
      company_name: response.companyName,
      industry: response.industry,
      company_size: response.companySize,
      nit: response.nit,
      contact_first_name: response.contactFirstName,
      contact_last_name: response.contactLastName,
      website_url: response.websiteUrl,
      phone: response.phone,
    };
  },
};
