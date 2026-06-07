export const MAX_ATTACHMENT_BYTES = 30 * 1024 * 1024; // 30 MB

export const ALLOWED_MIME_TYPES: Record<string, string> = {
  // Images
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'image/svg+xml': 'image',
  // Video
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/ogg': 'video',
  'video/quicktime': 'video',
  // Audio
  'audio/mpeg': 'audio',
  'audio/ogg': 'audio',
  'audio/wav': 'audio',
  'audio/webm': 'audio',
  'audio/aac': 'audio',
  'audio/flac': 'audio',
  // Documents
  'application/pdf': 'file',
  'application/msword': 'file',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'file',
  'application/vnd.ms-excel': 'file',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'file',
  'application/vnd.ms-powerpoint': 'file',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'file',
  'text/plain': 'file',
  'text/csv': 'file',
  // Archives
  'application/zip': 'file',
  'application/x-rar-compressed': 'file',
  'application/x-7z-compressed': 'file',
};

export const ALLOWED_EXTENSIONS = Object.keys(ALLOWED_MIME_TYPES)
  .map(mime => {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg,.jpeg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/ogg': '.ogv',
      'video/quicktime': '.mov',
      'audio/mpeg': '.mp3',
      'audio/ogg': '.oga',
      'audio/wav': '.wav',
      'audio/webm': '.weba',
      'audio/aac': '.aac',
      'audio/flac': '.flac',
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'application/vnd.ms-powerpoint': '.ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
      'text/plain': '.txt',
      'text/csv': '.csv',
      'application/zip': '.zip',
      'application/x-rar-compressed': '.rar',
      'application/x-7z-compressed': '.7z',
    };
    return map[mime] ?? '';
  })
  .filter(Boolean)
  .join(',');

export type AttachmentCategory = 'image' | 'audio' | 'video' | 'file';

export function validateAttachment(file: File): { valid: boolean; error?: string; category?: AttachmentCategory } {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return { valid: false, error: `El archivo supera el límite de 30 MB (${(file.size / 1024 / 1024).toFixed(1)} MB)` };
  }
  const category = ALLOWED_MIME_TYPES[file.type] as AttachmentCategory | undefined;
  if (!category) {
    return { valid: false, error: `Tipo de archivo no permitido: ${file.type || 'desconocido'}` };
  }
  return { valid: true, category };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function getFileIcon(type: AttachmentCategory | null): string {
  switch (type) {
    case 'image': return '🖼️';
    case 'audio': return '🎵';
    case 'video': return '🎬';
    default: return '📄';
  }
}
