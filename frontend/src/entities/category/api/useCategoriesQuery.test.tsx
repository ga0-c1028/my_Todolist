import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCategoriesQuery } from './useCategoriesQuery';
import type { Category } from '../model/types';

vi.mock('./categoryApi', () => ({
  listCategories: vi.fn(),
}));

import { listCategories } from './categoryApi';

const fakeCategories: Category[] = [
  { id: 'c1', userId: 'u1', name: '업무', isDefault: false },
  { id: 'c2', userId: 'u1', name: '개인', isDefault: true },
];

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useCategoriesQuery', () => {
  it('resolves with the categories returned by listCategories', async () => {
    vi.mocked(listCategories).mockResolvedValue(fakeCategories);

    const { result } = renderHook(() => useCategoriesQuery(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(fakeCategories);
  });
});
