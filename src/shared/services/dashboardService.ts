// src/shared/services/dashboardService.ts

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  try {
    const token = localStorage.getItem('ethoshub_access_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch {}
  return headers;
}

// ── Tipos que devuelve fn_get_professional_dashboard_json ──────────────────

export interface DashboardBasicInfo {
  first_name:         string;
  last_name:          string;
  professional_title: string;
  photo_url:          string | null;
  country_name:       string | null;
}

export interface DashboardSkill {
  skill_id:    string;
  name:        string;
  icon_url:    string | null;
  seniority?:  string;
  years_using?: number;
}

export interface DashboardExperience {
  work_experience_id: string;
  company_name:       string;
  job_title:          string;
  description:        string | null;
  is_current:         boolean;
  start_date:         string;
  end_date:           string | null;
  logo_url:           string | null;
}

export interface DashboardEducation {
  academic_record_id: string;
  institution_name:   string;
  degree_title:       string;
  start_date:         string;
  end_date:           string | null;
  in_progress:        boolean;
}

export interface ProfessionalDashboardData {
  basic_info:     DashboardBasicInfo;
  projects_count: number;
  bio_headline:   string | null;
  soft_skills:    DashboardSkill[];
  hard_skills:    DashboardSkill[];
  experience:     DashboardExperience[];
  education:      DashboardEducation[];
}

// ── Service ────────────────────────────────────────────────────────────────

export const dashboardService = {
  async getProfessionalDashboard(userId: string): Promise<ProfessionalDashboardData> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/dashboard/professional/${userId}`,
      { headers: getAuthHeaders() }
    );
    if (!response.ok) {
      throw new Error(`Error al cargar el dashboard: ${response.status}`);
    }
    return response.json();
  },
};