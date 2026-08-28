import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useUpdateTodo } from './useUpdateTodo';
import type { Todo } from '../../../entities/todo';

vi.mock('../../../entities/todo', () => ({
  updateTodo: vi.fn(),
}));

import { updateTodo } from '../../../entities/todo';

const fakeTodo: Todo = {
  id: 't1',
  userId: 'u1',
  categoryId: 'c1',
  title: 'new',
  description: null,
  startDate: '2026-01-01',
  endDate: '2026-01-05',
  isCompleted: false,
  completedAt: null,
  status: 'notStarted',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useUpdateTodo', () => {
  it('calls updateTodo with the id and payload and resolves with its result', async () => {
    vi.mocked(updateTodo).mockResolvedValue(fakeTodo);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const { result } = renderHook(() => useUpdateTodo(), { wrapper: createWrapper(queryClient) });

    const returned = await result.current.mutateAsync({ id: 't1', payload: { title: 'new' } });

    expect(updateTodo).toHaveBeenCalledWith('t1', { title: 'new' });
    expect(returned).toEqual(fakeTodo);
  });

  it('invalidates the todos query cache on success', async () => {
    vi.mocked(updateTodo).mockResolvedValue(fakeTodo);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateTodo(), { wrapper: createWrapper(queryClient) });
    result.current.mutate({ id: 't1', payload: { title: 'new' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['todos'] });
  });

  it('surfaces the error without invalidating the cache when updateTodo rejects', async () => {
    vi.mocked(updateTodo).mockRejectedValue(new Error('network error'));
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const { result } = renderHook(() => useUpdateTodo(), { wrapper: createWrapper(queryClient) });
    result.current.mutate({ id: 't1', payload: { title: 'new' } });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
