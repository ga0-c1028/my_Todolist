import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTodosQuery } from './useTodosQuery';
import type { Todo } from '../model/types';

vi.mock('./todoApi', () => ({
  listTodos: vi.fn(),
}));

import { listTodos } from './todoApi';

const fakeTodos: Todo[] = [
  {
    id: 't1',
    userId: 'u1',
    categoryId: 'c1',
    title: '할일',
    description: null,
    startDate: '2026-01-10',
    endDate: '2026-01-20',
    isCompleted: false,
    completedAt: null,
    status: 'inProgress',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useTodosQuery', () => {
  it('resolves with the todos returned by listTodos', async () => {
    vi.mocked(listTodos).mockResolvedValue(fakeTodos);

    const { result } = renderHook(() => useTodosQuery(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(fakeTodos);
  });

  it('passes the given params through to listTodos', async () => {
    vi.mocked(listTodos).mockResolvedValue(fakeTodos);

    const { result } = renderHook(() => useTodosQuery({ status: 'overdue' }), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listTodos).toHaveBeenCalledWith({ status: 'overdue' });
  });
});
