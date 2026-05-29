export interface WorkExperience {
  workExperienceId?: string;
  userId?: string;
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
  // Campos extra que mantienes en tu UI original:
  location?: string;
  technologies?: string[];
  createdAt?: string;
  updatedAt?: string;
}