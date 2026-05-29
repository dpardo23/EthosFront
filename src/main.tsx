import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from './app/router';
import { useUiStore } from './store/uiStore';
import './i18n';
import './index.css';

// Initialize theme before rendering to prevent flash
const initTheme = () => {
  const stored = localStorage.getItem('ethoshub_ui');
  let theme: 'light' | 'dark' | 'system' = 'dark';
  
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      theme = parsed.state?.theme || 'dark';
    } catch {
      // Use default
    }
  }
  
  const resolvedTheme = theme === 'system' 
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;
  
  if (resolvedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

initTheme();

// Initialize the store's theme on first load
useUiStore.getState().initializeTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <Toaster 
      position="top-right"
      toastOptions={{
        style: {
          background: 'hsl(var(--card))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
        },
        classNames: {
          success: 'border-l-4 border-l-green-500',
          error: 'border-l-4 border-l-red-500',
          info: 'border-l-4 border-l-blue-500',
        },
      }}
    />
  </React.StrictMode>
);
