import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route, useParams } from 'react-router-dom';
import { TodoListPage } from './TodoListPage';
import { useTodoFilterStore } from '../../../features/todo-filter';
import type { Todo } from '../../../entities/todo';

vi.mock('../../../entities/user', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../../features/auth-logout', () => ({
  useLogout: vi.fn(),
}));

vi.mock('../../../entities/todo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../entities/todo')>();
  return { ...actual, useTodosQuery: vi.fn() };
});

vi.mock('../../../entities/category', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../entities/category')>();
  return { ...actual, useCategoriesQuery: vi.fn() };
});

vi.mock('../../../features/todo-toggle-complete', () => ({
  useToggleComplete: vi.fn(),
}));

vi.mock('../../../features/todo-delete', () => ({
  useDeleteTodo: vi.fn(),
}));

import { useAuthStore } from '../../../entities/user';
import { useLogout } from '../../../features/auth-logout';
import { useTodosQuery } from '../../../entities/todo';
import { useCategoriesQuery } from '../../../entities/category';
import { useToggleComplete } from '../../../features/todo-toggle-complete';
import { useDeleteTodo } from '../../../features/todo-delete';

const fakeUser = { id: 'u1', name: '홍길동', email: 'a@b.com', createdAt: '', updatedAt: '' };

const fakeCategories = [
  { id: 'c1', userId: 'u1', name: '업무', isDefault: false },
  { id: 'c2', userId: 'u1', name: '개인', isDefault: true },
];

function makeTodo(overrides: Partial<Todo>): Todo {
  return {
    id: 't1',
    userId: 'u1',
    categoryId: 'c1',
    title: '제목1',
    description: null,
    startDate: '2026-01-01',
    endDate: '2026-01-05',
    isCompleted: false,
    completedAt: null,
    status: 'inProgress',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const fakeTodos: Todo[] = [
  makeTodo({ id: 't1', title: '할일 하나', categoryId: 'c1', status: 'inProgress', isCompleted: false }),
  makeTodo({ id: 't2', title: '할일 둘', categoryId: 'c2', status: 'completed', isCompleted: true }),
  makeTodo({ id: 't3', title: '할일 셋', categoryId: 'c1', status: 'overdue', isCompleted: false }),
];

function EditMarker() {
  const { id } = useParams<{ id: string }>();
  return <div data-testid="edit-page">edit:{id}</div>;
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/todos']}>
        <Routes>
          <Route path="/todos" element={<TodoListPage />} />
          <Route path="/todos/new" element={<div data-testid="new-page" />} />
          <Route path="/todos/:id/edit" element={<EditMarker />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TodoListPage', () => {
  const toggleMutate = vi.fn();
  const deleteMutate = vi.fn();

  beforeEach(() => {
    toggleMutate.mockClear();
    deleteMutate.mockClear();
    useTodoFilterStore.getState().reset();
    vi.mocked(useAuthStore).mockImplementation(((selector: (state: { user: typeof fakeUser; isAuthenticated: boolean }) => unknown) =>
      selector({ user: fakeUser, isAuthenticated: true })) as typeof useAuthStore);
    vi.mocked(useLogout).mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useLogout>);
    vi.mocked(useTodosQuery).mockReturnValue({ data: fakeTodos } as unknown as ReturnType<typeof useTodosQuery>);
    vi.mocked(useCategoriesQuery).mockReturnValue({ data: fakeCategories } as unknown as ReturnType<typeof useCategoriesQuery>);
    vi.mocked(useToggleComplete).mockReturnValue({ mutate: toggleMutate, isPending: false } as unknown as ReturnType<typeof useToggleComplete>);
    vi.mocked(useDeleteTodo).mockReturnValue({ mutate: deleteMutate, isPending: false } as unknown as ReturnType<typeof useDeleteTodo>);
  });

  it('renders all todos with their status badges', () => {
    renderPage();

    expect(screen.getByText('할일 하나')).toBeInTheDocument();
    expect(screen.getByText('할일 둘')).toBeInTheDocument();
    expect(screen.getByText('할일 셋')).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.className === 'todo-status-badge todo-status-badge--in-progress')).toBeInTheDocument();
    expect(screen.getByText('✓ 완료')).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.className === 'todo-status-badge todo-status-badge--overdue')).toBeInTheDocument();
  });

  it('re-invokes useTodosQuery with updated params when the filter store changes', () => {
    renderPage();

    act(() => {
      useTodoFilterStore.getState().setStatus('completed');
    });

    const lastCall = vi.mocked(useTodosQuery).mock.calls.at(-1);
    expect(lastCall?.[0]).toEqual(expect.objectContaining({ status: 'completed' }));
  });

  it('clicking a checkbox calls toggleComplete.mutate with that todo', async () => {
    const user = userEvent.setup();
    renderPage();

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);

    expect(toggleMutate).toHaveBeenCalledWith(fakeTodos[0]);
  });

  it('clicking 수정 navigates to /todos/:id/edit for that item', async () => {
    const user = userEvent.setup();
    renderPage();

    const editButtons = screen.getAllByRole('button', { name: '수정' });
    await user.click(editButtons[1]);

    expect(screen.getByTestId('edit-page')).toHaveTextContent('edit:t2');
  });

  it('clicking + 할일 등록 navigates to /todos/new', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '+ 할일 등록' }));

    expect(screen.getByTestId('new-page')).toBeInTheDocument();
  });

  it('clicking 삭제 opens a confirmation dialog without calling mutate immediately', async () => {
    const user = userEvent.setup();
    renderPage();

    const deleteButtons = screen.getAllByRole('button', { name: '삭제' });
    await user.click(deleteButtons[0]);

    expect(screen.getByText('할일을 삭제하시겠어요?')).toBeInTheDocument();
    expect(deleteMutate).not.toHaveBeenCalled();
  });

  it('confirming the dialog calls deleteTodo.mutate with the id and closes the dialog', async () => {
    const user = userEvent.setup();
    renderPage();

    const deleteButtons = screen.getAllByRole('button', { name: '삭제' });
    await user.click(deleteButtons[0]);

    const dialog = screen.getByRole('dialog');
    const { getByRole } = within(dialog);
    await user.click(getByRole('button', { name: '삭제' }));

    expect(deleteMutate).toHaveBeenCalledWith('t1');
    expect(screen.queryByText('할일을 삭제하시겠어요?')).not.toBeInTheDocument();
  });

  it('canceling the dialog closes it without calling mutate', async () => {
    const user = userEvent.setup();
    renderPage();

    const deleteButtons = screen.getAllByRole('button', { name: '삭제' });
    await user.click(deleteButtons[0]);

    const dialog = screen.getByRole('dialog');
    const { getByRole } = within(dialog);
    await user.click(getByRole('button', { name: '취소' }));

    expect(deleteMutate).not.toHaveBeenCalled();
    expect(screen.queryByText('할일을 삭제하시겠어요?')).not.toBeInTheDocument();
  });

  it('shows the empty-state message when there are no todos', () => {
    vi.mocked(useTodosQuery).mockReturnValue({ data: [] } as unknown as ReturnType<typeof useTodosQuery>);
    renderPage();

    expect(screen.getByText('등록된 할일이 없습니다. 새 할일을 등록해보세요.')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
