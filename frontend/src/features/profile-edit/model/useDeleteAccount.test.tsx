import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useDeleteAccount } from './useDeleteAccount';

vi.mock('../../../entities/user', () => ({
  deleteMe: vi.fn(),
  useAuthStore: vi.fn(),
}));

import { deleteMe, useAuthStore } from '../../../entities/user';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useDeleteAccount', () => {
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

  it('calls deleteMe, clears the auth store, and redirects to /login on success', async () => {
    vi.mocked(deleteMe).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteAccount(), { wrapper: createWrapper() });
    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(deleteMe).toHaveBeenCalled();
    expect(authLogout).toHaveBeenCalled();
    expect(window.location.href).toBe('/login');
  });

  it('does not clear the store or redirect when deleteMe rejects', async () => {
    vi.mocked(deleteMe).mockRejectedValue(new Error('server error'));

    const { result } = renderHook(() => useDeleteAccount(), { wrapper: createWrapper() });
    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(authLogout).not.toHaveBeenCalled();
    expect(window.location.href).toBe('');
  });
});
