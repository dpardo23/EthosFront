import { create } from 'zustand';
import {
  listDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  type CvDocument,
  type CvDocumentRequest,
} from '@/shared/services/cvStudioService';

interface CvStudioState {
  // ── Document list ────────────────────────────────────────────────────────────
  documents: CvDocument[];
  isLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;

  fetchDocuments: () => Promise<void>;
  saveDocument: (req: CvDocumentRequest) => Promise<CvDocument>;
  editDocument: (id: string, req: CvDocumentRequest) => Promise<CvDocument>;
  removeDocument: (id: string) => Promise<void>;

  // ── Editor persistence (survives SPA route changes, resets on page refresh) ─
  editorContent: string;
  editorMode: 'markdown' | 'latex';
  activeTemplateId: string | null;
  editingDocId: string | null;

  setEditorContent: (v: string) => void;
  setEditorMode: (v: 'markdown' | 'latex') => void;
  setActiveTemplateId: (v: string | null) => void;
  setEditingDocId: (v: string | null) => void;
}

export const useCvStudioStore = create<CvStudioState>((set) => ({
  // ── Document list ────────────────────────────────────────────────────────────
  documents: [],
  isLoading: false,
  isSaving: false,
  isDeleting: false,

  fetchDocuments: async () => {
    set({ isLoading: true });
    try {
      const docs = await listDocuments();
      set({ documents: docs });
    } finally {
      set({ isLoading: false });
    }
  },

  saveDocument: async (req) => {
    set({ isSaving: true });
    try {
      const doc = await createDocument(req);
      set(s => ({ documents: [doc, ...s.documents] }));
      return doc;
    } finally {
      set({ isSaving: false });
    }
  },

  editDocument: async (id, req) => {
    set({ isSaving: true });
    try {
      const doc = await updateDocument(id, req);
      set(s => ({
        documents: s.documents.map(d => (d.id === id ? doc : d)),
      }));
      return doc;
    } finally {
      set({ isSaving: false });
    }
  },

  removeDocument: async (id) => {
    set({ isDeleting: true });
    try {
      await deleteDocument(id);
      set(s => ({ documents: s.documents.filter(d => d.id !== id) }));
    } finally {
      set({ isDeleting: false });
    }
  },

  // ── Editor persistence ───────────────────────────────────────────────────────
  editorContent: '',
  editorMode: 'markdown',
  activeTemplateId: null,
  editingDocId: null,

  setEditorContent: (v) => set({ editorContent: v }),
  setEditorMode: (v) => set({ editorMode: v }),
  setActiveTemplateId: (v) => set({ activeTemplateId: v }),
  setEditingDocId: (v) => set({ editingDocId: v }),
}));
