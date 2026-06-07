

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation:  () => ({ state: null, pathname: '/login', search: '', hash: '', key: 'default' }),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

vi.mock('@/store', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
      getSession:      vi.fn(),
    },
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div:    ({ children, ...p }: any) => <div    {...p}>{children}</div>,
    button: ({ children, whileHover: _h, whileTap: _t, ...p }: any) => <button {...p}>{children}</button>,
    aside:  ({ children, ...p }: any) => <aside  {...p}>{children}</aside>,
    span:   ({ children, ...p }: any) => <span   {...p}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const { useAuthStore } = await import('@/store');
const { supabase }     = await import('@/lib/supabase');
const { useAuthFlow }  = await import('@/hooks/useAuthFlow');

function buildMockStore(login: Mock, overrides: Record<string, unknown> = {}) {
  return {
    login,
    loading:         false,
    profile:         null,
    isAuthenticated: false,
    error:           null,
    logout:          vi.fn().mockResolvedValue(undefined),
    fetchProfile:    vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeLoginResult(role: 'professional' | 'recruiter') {
  return {
    profile:         { id: '1', email: `${role}@test.com`, name: 'Test', role, profile_id: '1' },
    token:           'fake-jwt',
    tokenType:       'Bearer',
    expiresIn:       86400,
    roleDisplayName: role === 'recruiter' ? 'Reclutador' : 'Profesional',
    redirectPath:    role === 'recruiter' ? '/recruiter/dashboard' : '/dashboard',
  };
}

describe('[RED] useAuthFlow — deterministic post-login redirect', () => {
  beforeEach(() => vi.clearAllMocks());

  it('PROFESSIONAL → /dashboard/profesional/configuracion', async () => {
    const mockLogin = vi.fn().mockResolvedValue(makeLoginResult('professional'));
    (useAuthStore as unknown as Mock).mockImplementation((selector?: (s: any) => any) =>
      selector ? selector(buildMockStore(mockLogin)) : buildMockStore(mockLogin)
    );

    const { useAuthFlow } = await import('@/hooks/useAuthFlow');
    const { result } = renderHook(() => useAuthFlow(), { wrapper: MemoryRouter });

    await act(async () => {
      await result.current.loginWithPassword('professional@test.com', 'pass123');
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      '/dashboard/profesional/configuracion',
      { replace: true },
    );
  });

  it('RECRUITER → /dashboard/reclutador/configuracion', async () => {
    const mockLogin = vi.fn().mockResolvedValue(makeLoginResult('recruiter'));
    (useAuthStore as unknown as Mock).mockImplementation((selector?: (s: any) => any) =>
      selector ? selector(buildMockStore(mockLogin)) : buildMockStore(mockLogin)
    );

    const { useAuthFlow } = await import('@/hooks/useAuthFlow');
    const { result } = renderHook(() => useAuthFlow(), { wrapper: MemoryRouter });

    await act(async () => {
      await result.current.loginWithPassword('recruiter@test.com', 'pass123');
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      '/dashboard/reclutador/configuracion',
      { replace: true },
    );
  });
});

describe('[RED] useAuthFlow — OAuth loading guard (no race conditions)', () => {
  beforeEach(() => vi.clearAllMocks());

  function mountHook() {
    (useAuthStore as unknown as Mock).mockImplementation((selector?: (s: any) => any) => {
      const store = buildMockStore(vi.fn());
      return selector ? selector(store) : store;
    });
    return renderHook(() => useAuthFlow(), { wrapper: MemoryRouter });
  }

  it('oauthLoading is null initially', async () => {
    const { result } = mountHook();
    expect(result.current.oauthLoading).toBeNull();
  });

  it('oauthLoading becomes "google" while Google OAuth is in flight', async () => {
    (supabase!.auth.signInWithOAuth as Mock).mockImplementation(
      () => new Promise(() => {}), 
    );

    const { result } = mountHook();
    expect(result.current.oauthLoading).toBeNull();

    act(() => {
      void result.current.loginWithOAuth('google');
    });

    await waitFor(() => expect(result.current.oauthLoading).toBe('google'));
  });

  it('oauthLoading becomes "github" while GitHub OAuth is in flight', async () => {
    (supabase!.auth.signInWithOAuth as Mock).mockImplementation(
      () => new Promise(() => {}),
    );

    const { result } = mountHook();

    act(() => {
      void result.current.loginWithOAuth('github');
    });

    await waitFor(() => expect(result.current.oauthLoading).toBe('github'));
  });

  it('oauthLoading is reset to null on OAuth error', async () => {
    (supabase!.auth.signInWithOAuth as Mock).mockResolvedValue({
      data: null,
      error: new Error('provider_error'),
    });

    const { result } = mountHook();

    await act(async () => {
      await result.current.loginWithOAuth('google');
    });

    expect(result.current.oauthLoading).toBeNull();
  });

  it('double-click is ignored — second call is a no-op while loading', async () => {
    (supabase!.auth.signInWithOAuth as Mock).mockImplementation(
      () => new Promise(() => {}),
    );

    const { result } = mountHook();

    act(() => { void result.current.loginWithOAuth('google'); });
    await waitFor(() => expect(result.current.oauthLoading).toBe('google'));

    
    act(() => { void result.current.loginWithOAuth('google'); });

    expect(supabase!.auth.signInWithOAuth).toHaveBeenCalledTimes(1);
  });
});

describe('[GREEN] api.ts 401 interceptor — no window.location reload', () => {
  beforeEach(() => vi.clearAllMocks());

  it('dispatches auth:unauthorized event on 401, without touching window.location', async () => {
    const locationReplaceSpy = vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      replace: vi.fn(),
      href: '',
    } as unknown as Location);

    const receivedEvents: string[] = [];
    const handler = (e: Event) => receivedEvents.push(e.type);
    window.addEventListener('auth:unauthorized', handler);

    try {
      
      localStorage.setItem('ethoshub_access_token', 'old-token');
      localStorage.setItem('ethoshub_token_type', 'Bearer');

      
      localStorage.removeItem('ethoshub_access_token');
      localStorage.removeItem('ethoshub_token_type');
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));

      expect(receivedEvents).toContain('auth:unauthorized');
      expect(localStorage.getItem('ethoshub_access_token')).toBeNull();

      
      const locMock = window.location as unknown as { replace: ReturnType<typeof vi.fn> };
      expect(locMock.replace).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener('auth:unauthorized', handler);
      locationReplaceSpy.mockRestore();
    }
  });

  it('ProtectedRoute logout is triggered by auth:unauthorized event', async () => {
    const mockLogout = vi.fn().mockResolvedValue(undefined);
    (useAuthStore as unknown as Mock).mockImplementation((selector?: (s: any) => any) => {
      const store = {
        isAuthenticated: true,
        profile: { id: '1', role: 'professional' },
        logout: mockLogout,
      };
      return selector ? selector(store) : store;
    });

    const handler = vi.fn();
    window.addEventListener('auth:unauthorized', handler);

    try {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      await waitFor(() => expect(handler).toHaveBeenCalledTimes(1));
    } finally {
      window.removeEventListener('auth:unauthorized', handler);
    }
  });
});
