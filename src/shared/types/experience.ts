export interface WorkExperience {
  workExperienceId?: string;
  profileId?: string;
  companyName: string;
  jobTitle: string;
  description?: string;
  isCurrent: boolean;
  isFreelance?: boolean;
  logoUrl?: string;
  companyImageUrl?: string;
  companyUrl?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
  technologies?: string[];
  createdAt?: string;
  updatedAt?: string;
}