import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { CategoryManagePage } from './CategoryManagePage';

vi.mock('../../../entities/user', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../../features/auth-logout', () => ({
  useLogout: vi.fn(),
}));

vi.mock('../../../entities/category', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../entities/category')>();
  return { ...actual, useCategoriesQuery: vi.fn() };
});

vi.mock('../../../features/category-manage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../features/category-manage')>();
  return {
    ...actual,
    useCreateCategory: vi.fn(),
    useUpdateCategory: vi.fn(),
    useDeleteCategory: vi.fn(),
  };
});

import { useAuthStore } from '../../../entities/user';
import { useLogout } from '../../../features/auth-logout';
import { useCategoriesQuery } from '../../../entities/category';
import { useCreateCategory, useUpdateCategory, useDeleteCategory } from '../../../features/category-manage';

const fakeUser = { id: 'u1', name: '홍길동', email: 'a@b.com', createdAt: '', updatedAt: '' };

const fakeCategories = [
  { id: 'default1', userId: 'u1', name: '기본', isDefault: true },
  { id: 'c1', userId: 'u1', name: '업무', isDefault: false },
];

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CategoryManagePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CategoryManagePage', () => {
  const createMutate = vi.fn();
  const updateMutate = vi.fn();
  const deleteMutate = vi.fn();

  beforeEach(() => {
    createMutate.mockClear();
    updateMutate.mockClear();
    deleteMutate.mockClear();
    vi.mocked(useAuthStore).mockImplementation(((selector: (state: { user: typeof fakeUser; isAuthenticated: boolean }) => unknown) =>
      selector({ user: fakeUser, isAuthenticated: true })) as typeof useAuthStore);
    vi.mocked(useLogout).mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useLogout>);
    vi.mocked(useCategoriesQuery).mockReturnValue({ data: fakeCategories } as unknown as ReturnType<typeof useCategoriesQuery>);
    vi.mocked(useCreateCategory).mockReturnValue({ mutate: createMutate, isPending: false, error: null } as unknown as ReturnType<typeof useCreateCategory>);
    vi.mocked(useUpdateCategory).mockReturnValue({ mutate: updateMutate, isPending: false, error: null } as unknown as ReturnType<typeof useUpdateCategory>);
    vi.mocked(useDeleteCategory).mockReturnValue({ mutate: deleteMutate, isPending: false, error: null } as unknown as ReturnType<typeof useDeleteCategory>);
  });

  it('renders the heading, the create form, and both category rows', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: '카테고리 관리' })).toBeInTheDocument();
    expect(screen.getByText('새 카테고리 이름 (1~20자)')).toBeInTheDocument();
    expect(screen.getByText('기본')).toBeInTheDocument();
    expect(screen.getByText('업무')).toBeInTheDocument();
  });

  it('shows "(수정 불가)"/"(삭제 불가)" text for the default category and no 수정/삭제 buttons', () => {
    renderPage();

    const defaultRow = screen.getByText('기본').closest('div') as HTMLElement;
    expect(within(defaultRow).getByText('(수정 불가)')).toBeInTheDocument();
    expect(within(defaultRow).getByText('(삭제 불가)')).toBeInTheDocument();
    expect(within(defaultRow).queryByRole('button', { name: '수정' })).not.toBeInTheDocument();
    expect(within(defaultRow).queryByRole('button', { name: '삭제' })).not.toBeInTheDocument();
  });

  it('shows 수정/삭제 buttons for the non-default category', () => {
    renderPage();

    const workRow = screen.getByText('업무').closest('div') as HTMLElement;
    expect(within(workRow).getByRole('button', { name: '수정' })).toBeInTheDocument();
    expect(within(workRow).getByRole('button', { name: '삭제' })).toBeInTheDocument();
  });

  it('clicking 수정 on 업무 switches that row into inline edit mode, leaving the top-level create form untouched', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '수정' }));

    const textboxes = screen.getAllByRole('textbox');
    expect(textboxes).toHaveLength(2);
    const editInput = textboxes.find((el) => (el as HTMLInputElement).value === '업무');
    expect(editInput).toBeDefined();
  });

  it('submitting the inline edit form calls updateCategory.mutate with the id and new name', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '수정' }));

    const textboxes = screen.getAllByRole('textbox');
    const editInput = textboxes.find((el) => (el as HTMLInputElement).value === '업무') as HTMLInputElement;
    await user.clear(editInput);
    await user.type(editInput, '새업무');
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(updateMutate).toHaveBeenCalledWith(
      { id: 'c1', payload: { name: '새업무' } },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it('clicking 취소 in the inline edit form reverts the row to display mode without calling update', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '수정' }));
    await user.click(screen.getByRole('button', { name: '취소' }));

    expect(updateMutate).not.toHaveBeenCalled();
    expect(screen.getByText('업무')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();
  });

  it('clicking 삭제 on 업무 opens a confirmation dialog without calling delete immediately', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '삭제' }));

    expect(screen.getByText('카테고리를 삭제하시겠어요?')).toBeInTheDocument();
    expect(screen.getByText("삭제 시 소속 할일은 '기본' 카테고리로 이동합니다.")).toBeInTheDocument();
    expect(deleteMutate).not.toHaveBeenCalled();
  });

  it('confirming the dialog calls deleteCategory.mutate with the id and closes the dialog', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '삭제' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: '삭제' }));

    expect(deleteMutate).toHaveBeenCalledWith('c1');
    expect(screen.queryByText('카테고리를 삭제하시겠어요?')).not.toBeInTheDocument();
  });

  it('canceling the dialog closes it without calling delete', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '삭제' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: '취소' }));

    expect(deleteMutate).not.toHaveBeenCalled();
    expect(screen.queryByText('카테고리를 삭제하시겠어요?')).not.toBeInTheDocument();
  });

  it('submitting the top-level create form calls createCategory.mutate with the new name', async () => {
    const user = userEvent.setup();
    renderPage();

    const createInput = screen.getByText('새 카테고리 이름 (1~20자)').parentElement!.querySelector('input') as HTMLInputElement;
    await user.type(createInput, '취미');
    await user.click(screen.getByRole('button', { name: '추가' }));

    expect(createMutate).toHaveBeenCalledWith({ name: '취미' });
  });
});
