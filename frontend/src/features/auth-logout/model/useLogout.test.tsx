import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useLogout } from './useLogout';

vi.mock('../../../entities/user', () => ({
  logout: vi.fn(),
  useAuthStore: vi.fn(),
}));

vi.mock('../../../shared/api', () => ({
  getRefreshToken: vi.fn(),
}));

import { logout, useAuthStore } from '../../../entities/user';
import { getRefreshToken } from '../../../shared/api';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useLogout', () => {
  const authLogout = vi.fn();
  const originalLocation = window.location;

  beforeEach(() => {
    vi.mocked(useAuthStore).mockImplementation(((selector: (state: { logout: typeof authLogout }) => unknown) =>
      selector({ logout: authLogout })) as typeof useAuthStore);
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, href: '' },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  it('calls the logout API with the refresh token, clears the store, and redirects when a token exists', async () => {
    vi.mocked(getRefreshToken).mockReturnValue('rt1');
    vi.mocked(logout).mockResolvedValue(undefined);

    const { result } = renderHook(() => useLogout(), { wrapper: createWrapper() });
    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(logout).toHaveBeenCalledWith('rt1');
    expect(authLogout).toHaveBeenCalled();
    expect(window.location.href).toBe('/login');
  });

  it('skips the logout API call but still clears the store and redirects when there is no refresh token', async () => {
    vi.mocked(getRefreshToken).mockReturnValue(null);

    const { result } = renderHook(() => useLogout(), { wrapper: createWrapper() });
    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(logout).not.toHaveBeenCalled();
    expect(authLogout).toHaveBeenCalled();
    expect(window.location.href).toBe('/login');
  });

  it('still clears the store and redirects when the logout API call rejects', async () => {
    vi.mocked(getRefreshToken).mockReturnValue('rt1');
    vi.mocked(logout).mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useLogout(), { wrapper: createWrapper() });
    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(authLogout).toHaveBeenCalled();
    expect(window.location.href).toBe('/login');
  });
});
