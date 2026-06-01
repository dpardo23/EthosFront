import api from '@/shared/api/api';

export interface CvDocument {
  id: string;
  title: string;
  mode: 'markdown' | 'latex';
  content: string;
  templateId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CvDocumentRequest {
  title: string;
  mode: 'markdown' | 'latex';
  content: string;
  templateId?: string | null;
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function listDocuments(): Promise<CvDocument[]> {
  const res = await api.get<{ data: CvDocument[] }>('/v1/cv-documents');
  return res.data.data ?? [];
}

export async function createDocument(req: CvDocumentRequest): Promise<CvDocument> {
  const res = await api.post<{ data: CvDocument }>('/v1/cv-documents', req);
  return res.data.data;
}

export async function updateDocument(id: string, req: CvDocumentRequest): Promise<CvDocument> {
  const res = await api.put<{ data: CvDocument }>(`/v1/cv-documents/${id}`, req);
  return res.data.data;
}

export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/v1/cv-documents/${id}`);
}

// ── LaTeX → PDF (via backend Tectonic) ───────────────────────────────────────

export async function compileLatexToPdf(latexCode: string): Promise<Blob> {
  const res = await api.post('/v1/cv-documents/compile-latex', latexCode, {
    headers: { 'Content-Type': 'text/plain' },
    responseType: 'blob',
    timeout: 35_000,
  });
  return res.data as Blob;
}

// ── AI Assist (SSE stream) ────────────────────────────────────────────────────

export interface AiStreamOptions {
  prompt: string;
  content: string;
  mode: string;
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
  signal?: AbortSignal;
}

export async function streamAiAssist(opts: AiStreamOptions): Promise<void> {
  const token = localStorage.getItem('ethoshub_access_token');
  const tokenType = localStorage.getItem('ethoshub_token_type') ?? 'Bearer';

  const baseUrl = import.meta.env.VITE_API_URL ?? '/api';

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/v1/cv-documents/ai-assist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `${tokenType} ${token}` } : {}),
      },
      body: JSON.stringify({ prompt: opts.prompt, content: opts.content, mode: opts.mode }),
      signal: opts.signal,
    });
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      opts.onError('No se pudo conectar con el asistente IA. Verifica que el servidor esté activo.');
    }
    return;
  }

  if (!response.ok || !response.body) {
    opts.onError(`Error ${response.status}: no se pudo conectar con el asistente IA`);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let lastEventName = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('event:')) {
          lastEventName = trimmed.slice(6).trim();
          continue;
        }
        if (trimmed.startsWith('data: ')) {
          const data = trimmed.slice(6);
          if (data === '[DONE]') { opts.onDone(); return; }
          if (lastEventName === 'error') {
            opts.onError(data);
            return;
          }
          // Tokens are JSON-encoded by the backend to preserve newlines through SSE.
          // JSON.parse('"hello\\nworld"') → "hello\nworld" (with real newline).
          let token: string;
          try { token = JSON.parse(data); } catch { token = data; }
          opts.onToken(token);
          lastEventName = '';
        }
      }
    }
    opts.onDone();
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      opts.onError('La conexión con el asistente IA fue interrumpida');
    }
  } finally {
    reader.releaseLock();
  }
}
