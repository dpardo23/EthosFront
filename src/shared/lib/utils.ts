import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * General-purpose utility functions: class name merging, date formatting, and string helpers.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function formatDate(dateString: string): string {
  
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ? dateString + 'T00:00:00'
    : dateString;
  return new Date(normalized).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Hace unos segundos';
  if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} minutos`;
  if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} horas`;
  if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
  return formatDate(dateString);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidMediaUrl(url: string): boolean {
  const allowedDomains = ['youtube.com', 'youtu.be', 'vimeo.com', 'figma.com', 'docs.google.com'];
  try {
    const parsedUrl = new URL(url);
    return allowedDomains.some(domain => parsedUrl.hostname.includes(domain));
  } catch {
    return false;
  }
}

export function getMediaType(url: string): 'youtube' | 'vimeo' | 'figma' | 'slides' | 'document' | null {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname.includes('youtube') || parsedUrl.hostname.includes('youtu.be')) {
      return 'youtube';
    }
    if (parsedUrl.hostname.includes('vimeo')) {
      return 'vimeo';
    }
    if (parsedUrl.hostname.includes('figma')) {
      return 'figma';
    }
    if (parsedUrl.hostname.includes('docs.google.com')) {
      return 'slides';
    }
    if (parsedUrl.hostname.includes('drive.google.com')) {
      return 'document';
    }
    return null;
  } catch {
    return null;
  }
}

export function getYoutubeEmbedUrl(url: string): string {
  const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

export function getVimeoEmbedUrl(url: string): string {
  const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
  return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function validateSlug(slug: string): { isValid: boolean; error?: string } {
  if (slug.length < 3) {
    return { isValid: false, error: 'El slug debe tener al menos 3 caracteres' };
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { isValid: false, error: 'Solo minúsculas, números y guiones' };
  }
  const reserved = ['admin', 'api', 'login', 'dashboard', 'explorar', 'settings'];
  if (reserved.includes(slug)) {
    return { isValid: false, error: 'Este slug está reservado por el sistema' };
  }
  return { isValid: true };
}
