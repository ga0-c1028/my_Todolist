import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCreateCategory, useUpdateCategory, useDeleteCategory } from './useCategoryMutations';

vi.mock('../../../entities/category', () => ({
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

import { createCategory, updateCategory, deleteCategory } from '../../../entities/category';

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useCreateCategory', () => {
  it('calls createCategory with the given payload', async () => {
    vi.mocked(createCategory).mockResolvedValue({ id: 'c1', userId: 'u1', name: 'x', isDefault: false });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

    const { result } = renderHook(() => useCreateCategory(), { wrapper: createWrapper(queryClient) });
    await result.current.mutateAsync({ name: 'x' });

    expect(createCategory).toHaveBeenCalledWith({ name: 'x' });
  });

  it('invalidates the categories query cache on success', async () => {
    vi.mocked(createCategory).mockResolvedValue({ id: 'c1', userId: 'u1', name: 'x', isDefault: false });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateCategory(), { wrapper: createWrapper(queryClient) });
    result.current.mutate({ name: 'x' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['categories'] });
  });
});

describe('useUpdateCategory', () => {
  it('calls updateCategory with the given id and payload', async () => {
    vi.mocked(updateCategory).mockResolvedValue({ id: 'c1', userId: 'u1', name: 'y', isDefault: false });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

    const { result } = renderHook(() => useUpdateCategory(), { wrapper: createWrapper(queryClient) });
    await result.current.mutateAsync({ id: 'c1', payload: { name: 'y' } });

    expect(updateCategory).toHaveBeenCalledWith('c1', { name: 'y' });
  });

  it('invalidates the categories query cache on success', async () => {
    vi.mocked(updateCategory).mockResolvedValue({ id: 'c1', userId: 'u1', name: 'y', isDefault: false });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateCategory(), { wrapper: createWrapper(queryClient) });
    result.current.mutate({ id: 'c1', payload: { name: 'y' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['categories'] });
  });
});

describe('useDeleteCategory', () => {
  it('calls deleteCategory with the given id', async () => {
    vi.mocked(deleteCategory).mockResolvedValue(undefined);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

    const { result } = renderHook(() => useDeleteCategory(), { wrapper: createWrapper(queryClient) });
    await result.current.mutateAsync('c1');

    expect(deleteCategory).toHaveBeenCalledWith('c1');
  });

  it('invalidates both the categories and todos query caches on success', async () => {
    vi.mocked(deleteCategory).mockResolvedValue(undefined);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteCategory(), { wrapper: createWrapper(queryClient) });
    result.current.mutate('c1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledTimes(2);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['categories'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['todos'] });
  });
});
