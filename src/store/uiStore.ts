import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Toast, Theme } from '@/shared/types';
import { generateId } from '@/shared/lib/utils';

interface UiStore {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  sidebarOpen: boolean;
  toasts: Toast[];
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  initializeTheme: () => void;
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = (resolvedTheme: 'light' | 'dark') => {
  if (resolvedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

export const useUiStore = create<UiStore>()(
  persist(
    (set, get) => ({
      theme: 'dark', // Default to dark for OLED experience
      resolvedTheme: 'dark',
      sidebarOpen: true,
      toasts: [],

      setTheme: (theme: Theme) => {
        const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;
        set({ theme, resolvedTheme });
        applyTheme(resolvedTheme);
      },

      initializeTheme: () => {
        const { theme } = get();
        const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;
        set({ resolvedTheme });
        applyTheme(resolvedTheme);
        
        // Listen for system theme changes
        if (typeof window !== 'undefined') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          const handleChange = () => {
            const currentTheme = get().theme;
            if (currentTheme === 'system') {
              const newResolvedTheme = getSystemTheme();
              set({ resolvedTheme: newResolvedTheme });
              applyTheme(newResolvedTheme);
            }
          };
          mediaQuery.addEventListener('change', handleChange);
        }
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarOpen: (open: boolean) => {
        set({ sidebarOpen: open });
      },

      addToast: (toast: Omit<Toast, 'id'>) => {
        const id = generateId();
        set((state) => ({
          toasts: [...state.toasts, { ...toast, id }],
        }));
        setTimeout(() => {
          set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
          }));
        }, 5000);
      },

      removeToast: (id: string) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      },
    }),
    {
      name: 'ethoshub_ui',
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.initializeTheme();
        }
      },
    }
  )
);
