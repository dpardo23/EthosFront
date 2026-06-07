import { useState } from 'react';
import { Download, FileText, Music, Video, ExternalLink, X, ZoomIn } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { AttachmentCategory } from '@/shared/lib/chatAttachments';

interface Props {
  url: string;
  type: AttachmentCategory | null;
  isMine: boolean;
  fileName?: string;
}

function fileNameFromUrl(url: string): string {
  try {
    const parts = new URL(url).pathname.split('/');
    const raw = decodeURIComponent(parts[parts.length - 1] ?? 'archivo');
    // strip timestamp prefix like "1718000000000-name.pdf"
    return raw.replace(/^\d{13}-/, '');
  } catch {
    return 'archivo';
  }
}

function ImagePreview({ url, isMine }: { url: string; isMine: boolean }) {
  const [lightbox, setLightbox] = useState(false);

  return (
    <>
      <div className="group relative mb-2 overflow-hidden rounded-xl">
        <img
          src={url}
          alt="Imagen adjunta"
          className="max-h-56 w-full object-cover cursor-zoom-in transition-opacity group-hover:opacity-90"
          onClick={() => setLightbox(true)}
        />
        <div className="absolute inset-0 flex items-end justify-end gap-1 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setLightbox(true)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <a
            href={url}
            download
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
          >
            <Download className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={() => setLightbox(false)}
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={url}
            alt="Imagen adjunta"
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <a
            href={url}
            download
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
            className="absolute bottom-4 flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 transition-colors"
          >
            <Download className="h-4 w-4" />
            Descargar
          </a>
        </div>
      )}
    </>
  );
}

function AudioPreview({ url, isMine }: { url: string; isMine: boolean }) {
  const name = fileNameFromUrl(url);
  return (
    <div className="mb-2 space-y-1.5">
      <div className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs',
        isMine ? 'bg-white/10' : 'bg-black/10',
      )}>
        <Music className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate max-w-[180px]">{name}</span>
        <a href={url} download target="_blank" rel="noreferrer"
          className="ml-auto shrink-0 opacity-70 hover:opacity-100">
          <Download className="h-3.5 w-3.5" />
        </a>
      </div>
      <audio controls className="w-full rounded-lg" style={{ height: 36 }}>
        <source src={url} />
      </audio>
    </div>
  );
}

function VideoPreview({ url, isMine }: { url: string; isMine: boolean }) {
  const name = fileNameFromUrl(url);
  return (
    <div className="mb-2 space-y-1.5">
      <div className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs',
        isMine ? 'bg-white/10' : 'bg-black/10',
      )}>
        <Video className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate max-w-[180px]">{name}</span>
        <a href={url} download target="_blank" rel="noreferrer"
          className="ml-auto shrink-0 opacity-70 hover:opacity-100">
          <Download className="h-3.5 w-3.5" />
        </a>
      </div>
      <video controls className="w-full max-h-48 rounded-xl object-cover">
        <source src={url} />
      </video>
    </div>
  );
}

function FilePreview({ url, isMine }: { url: string; isMine: boolean }) {
  const name = fileNameFromUrl(url);
  const isPdf = name.toLowerCase().endsWith('.pdf');

  return (
    <div className={cn(
      'mb-2 flex items-center gap-3 rounded-xl px-3 py-2.5',
      isMine ? 'bg-white/10' : 'bg-black/10',
    )}>
      <div className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
        isMine ? 'bg-white/15' : 'bg-black/15',
      )}>
        <FileText className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{name}</p>
        <p className="text-[10px] opacity-60">{isPdf ? 'PDF' : 'Documento'}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {isPdf && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            title="Abrir en nueva pestaña"
            className="flex h-7 w-7 items-center justify-center rounded-lg opacity-70 hover:opacity-100 transition-opacity"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        <a
          href={url}
          download
          target="_blank"
          rel="noreferrer"
          title="Descargar"
          className="flex h-7 w-7 items-center justify-center rounded-lg opacity-70 hover:opacity-100 transition-opacity"
        >
          <Download className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

export function AttachmentBubble({ url, type, isMine }: Props) {
  switch (type) {
    case 'image': return <ImagePreview url={url} isMine={isMine} />;
    case 'audio': return <AudioPreview url={url} isMine={isMine} />;
    case 'video': return <VideoPreview url={url} isMine={isMine} />;
    default:      return <FilePreview  url={url} isMine={isMine} />;
  }
}
