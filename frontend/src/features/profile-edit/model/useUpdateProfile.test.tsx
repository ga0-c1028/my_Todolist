import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useUpdateProfile } from './useUpdateProfile';
import type { User } from '../../../entities/user';

vi.mock('../../../entities/user', () => ({
  updateMe: vi.fn(),
  useAuthStore: vi.fn(),
}));

import { updateMe, useAuthStore } from '../../../entities/user';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const fakeUser: User = { id: 'u1', name: '새이름', email: 'a@b.com', createdAt: '', updatedAt: '' };

describe('useUpdateProfile', () => {
  const updateUser = vi.fn();

  beforeEach(() => {
    updateUser.mockClear();
    vi.mocked(useAuthStore).mockImplementation(((selector: (state: { updateUser: typeof updateUser }) => unknown) =>
      selector({ updateUser })) as typeof useAuthStore);
  });

  it('calls updateMe with the given payload and updates the auth store with the resolved user on success', async () => {
    vi.mocked(updateMe).mockResolvedValue(fakeUser);

    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });
    result.current.mutate({ name: '새이름' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(updateMe).toHaveBeenCalledWith({ name: '새이름' });
    expect(updateUser).toHaveBeenCalledWith(fakeUser);
  });
});
