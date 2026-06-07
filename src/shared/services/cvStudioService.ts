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

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
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

// ── LaTeX → PDF (via backend pdflatex) ───────────────────────────────────────

export async function compileLatexToPdf(latexCode: string, profileImageUrl?: string): Promise<Blob> {
  let errorMessage: string | null = null;
  try {
    const res = await api.post('/v1/cv-documents/compile-latex',
      { code: latexCode, profileImageUrl: profileImageUrl ?? null },
      { responseType: 'blob', timeout: 150_000 },
    );
    const blob = res.data as Blob;
    if (blob.type === 'application/json' || blob.type?.includes('json')) {
      const text = await blob.text();
      const parsed = JSON.parse(text);
      errorMessage = parsed.message ?? 'Error de compilación LaTeX';
    } else {
      return blob;
    }
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: Blob } };
    if (axiosErr.response?.data instanceof Blob) {
      try {
        const text = await axiosErr.response.data.text();
        const parsed = JSON.parse(text);
        errorMessage = parsed.message ?? 'Error de compilación LaTeX';
      } catch {
        errorMessage = 'Error de compilación LaTeX';
      }
    } else {
      errorMessage = (err as Error).message ?? 'Error de compilación LaTeX';
    }
  }
  throw new Error(errorMessage ?? 'Error de compilación LaTeX');
}

// ── AI Assist (single REST call, no streaming) ────────────────────────────────

export interface AiCallOptions {
  prompt: string;
  content: string;
  mode: string;
  history?: ChatMessage[];
}

export async function callAiAssist(opts: AiCallOptions): Promise<string> {
  const res = await api.post<{ data: { text: string } }>('/v1/cv-documents/ai-assist', {
    prompt: opts.prompt,
    content: opts.content,
    mode: opts.mode,
    history: opts.history ?? [],
  }, { timeout: 120_000 });
  return res.data.data.text;
}
