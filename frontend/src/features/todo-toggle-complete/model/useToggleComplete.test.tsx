import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useToggleComplete } from './useToggleComplete';
import type { Todo } from '../../../entities/todo';

vi.mock('../../../entities/todo', () => ({
  updateTodo: vi.fn(),
}));

import { updateTodo } from '../../../entities/todo';

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

describe('useToggleComplete', () => {
  it('calls updateTodo with isCompleted flipped to true when the todo is not completed', async () => {
    vi.mocked(updateTodo).mockResolvedValue({ ...fakeTodo, isCompleted: true });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const { result } = renderHook(() => useToggleComplete(), { wrapper: createWrapper(queryClient) });
    await result.current.mutateAsync(fakeTodo);

    expect(updateTodo).toHaveBeenCalledWith('t1', { isCompleted: true });
  });

  it('calls updateTodo with isCompleted flipped to false when the todo is completed', async () => {
    const completedTodo = { ...fakeTodo, isCompleted: true };
    vi.mocked(updateTodo).mockResolvedValue({ ...completedTodo, isCompleted: false });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const { result } = renderHook(() => useToggleComplete(), { wrapper: createWrapper(queryClient) });
    await result.current.mutateAsync(completedTodo);

    expect(updateTodo).toHaveBeenCalledWith('t1', { isCompleted: false });
  });

  it('invalidates the todos query cache on success', async () => {
    vi.mocked(updateTodo).mockResolvedValue({ ...fakeTodo, isCompleted: true });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useToggleComplete(), { wrapper: createWrapper(queryClient) });
    result.current.mutate(fakeTodo);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['todos'] });
  });

  it('surfaces the error without invalidating the cache when updateTodo rejects', async () => {
    vi.mocked(updateTodo).mockRejectedValue(new Error('network error'));
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const { result } = renderHook(() => useToggleComplete(), { wrapper: createWrapper(queryClient) });
    result.current.mutate(fakeTodo);

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
