import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCreateTodo } from './useCreateTodo';
import type { Todo } from '../../../entities/todo';

vi.mock('../../../entities/todo', () => ({
  createTodo: vi.fn(),
}));

import { createTodo } from '../../../entities/todo';

const fakeTodo: Todo = {
  id: 't1',
  userId: 'u1',
  categoryId: 'c1',
  title: '할일 제목',
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

describe('useCreateTodo', () => {
  it('calls createTodo with the payload and resolves with its result', async () => {
    vi.mocked(createTodo).mockResolvedValue(fakeTodo);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const { result } = renderHook(() => useCreateTodo(), { wrapper: createWrapper(queryClient) });

    const payload = { title: '할일 제목', startDate: '2026-01-01', endDate: '2026-01-05' };
    const returned = await result.current.mutateAsync(payload);

    expect(createTodo).toHaveBeenCalledWith(payload);
    expect(returned).toEqual(fakeTodo);
  });

  it('invalidates the todos query cache on success', async () => {
    vi.mocked(createTodo).mockResolvedValue(fakeTodo);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateTodo(), { wrapper: createWrapper(queryClient) });
    result.current.mutate({ title: '할일 제목', startDate: '2026-01-01', endDate: '2026-01-05' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['todos'] });
  });

  it('surfaces the error without invalidating the cache when createTodo rejects', async () => {
    vi.mocked(createTodo).mockRejectedValue(new Error('network error'));
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const { result } = renderHook(() => useCreateTodo(), { wrapper: createWrapper(queryClient) });
    result.current.mutate({ title: '할일 제목', startDate: '2026-01-01', endDate: '2026-01-05' });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
