/**
 * TypeScript types for academic record domain objects.
 */
export interface AcademicRecord {
  academicRecordId?: string;
  profileId?: string;
  institutionName: string;
  degree: string;
  fieldOfStudy?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
  credentialUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  
  educationType?: string;
  gpa?: number | null;
  verificationUrl?: string;
  institutionLogoUrl?: string;
  isVisible?: boolean;
}