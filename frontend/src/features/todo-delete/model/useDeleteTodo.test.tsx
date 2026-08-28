import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useDeleteTodo } from './useDeleteTodo';

vi.mock('../../../entities/todo', () => ({
  deleteTodo: vi.fn(),
}));

import { deleteTodo } from '../../../entities/todo';

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useDeleteTodo', () => {
  it('calls deleteTodo with the given id', async () => {
    vi.mocked(deleteTodo).mockResolvedValue(undefined);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const { result } = renderHook(() => useDeleteTodo(), { wrapper: createWrapper(queryClient) });

    await result.current.mutateAsync('t1');

    expect(deleteTodo).toHaveBeenCalledWith('t1');
  });

  it('invalidates the todos query cache on success', async () => {
    vi.mocked(deleteTodo).mockResolvedValue(undefined);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteTodo(), { wrapper: createWrapper(queryClient) });
    result.current.mutate('t1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['todos'] });
  });

  it('surfaces the error without invalidating the cache when deleteTodo rejects', async () => {
    vi.mocked(deleteTodo).mockRejectedValue(new Error('network error'));
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const { result } = renderHook(() => useDeleteTodo(), { wrapper: createWrapper(queryClient) });
    result.current.mutate('t1');

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
