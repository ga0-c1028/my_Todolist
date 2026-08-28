import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TodoFormPage } from './TodoFormPage';
import type { Todo } from '../../../entities/todo';
import type { TodoFormValues } from '../../../features/todo-create';

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

vi.mock('../../../features/todo-edit', () => ({
  useUpdateTodo: vi.fn(),
}));

vi.mock('../../../features/todo-create', () => ({
  useCreateTodo: vi.fn(),
  TodoForm: (props: {
    mode: 'create' | 'edit';
    initialValues?: Partial<TodoFormValues>;
    onSubmit: (values: TodoFormValues) => void;
  }) => (
    <div data-testid="todo-form-stub">
      <span data-testid="todo-form-mode">{props.mode}</span>
      {props.initialValues?.title ? <span>{props.initialValues.title}</span> : null}
      <button
        onClick={() =>
          props.onSubmit({
            title: 't',
            description: '',
            categoryId: '',
            startDate: '2026-01-01',
            endDate: '2026-01-05',
            isCompleted: false,
          })
        }
      >
        submit
      </button>
    </div>
  ),
}));

import { useAuthStore } from '../../../entities/user';
import { useLogout } from '../../../features/auth-logout';
import { useTodosQuery } from '../../../entities/todo';
import { useUpdateTodo } from '../../../features/todo-edit';
import { useCreateTodo } from '../../../features/todo-create';

const fakeUser = { id: 'u1', name: '홍길동', email: 'a@b.com', createdAt: '', updatedAt: '' };

function makeTodo(overrides: Partial<Todo>): Todo {
  return {
    id: 't1',
    userId: 'u1',
    categoryId: 'c1',
    title: '기존 할일',
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

function renderPage(initialPath: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/todos/new" element={<TodoFormPage />} />
          <Route path="/todos/:id/edit" element={<TodoFormPage />} />
          <Route path="/todos" element={<div data-testid="list-page" />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TodoFormPage', () => {
  const createMutate = vi.fn();
  const updateMutate = vi.fn();

  beforeEach(() => {
    vi.mocked(useAuthStore).mockImplementation(((selector: (state: { user: typeof fakeUser; isAuthenticated: boolean }) => unknown) =>
      selector({ user: fakeUser, isAuthenticated: true })) as typeof useAuthStore);
    vi.mocked(useLogout).mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useLogout>);
    createMutate.mockReset();
    updateMutate.mockReset();
    createMutate.mockImplementation((_payload, options) => {
      options?.onSuccess?.(makeTodo({ id: 'new1' }));
    });
    updateMutate.mockImplementation((vars, options) => {
      options?.onSuccess?.(makeTodo({ id: vars.id }));
    });
    vi.mocked(useCreateTodo).mockReturnValue({ mutate: createMutate, isPending: false, error: null } as unknown as ReturnType<typeof useCreateTodo>);
    vi.mocked(useUpdateTodo).mockReturnValue({ mutate: updateMutate, isPending: false, error: null } as unknown as ReturnType<typeof useUpdateTodo>);
  });

  describe('create mode', () => {
    beforeEach(() => {
      vi.mocked(useTodosQuery).mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<typeof useTodosQuery>);
    });

    it('renders the 할일 등록 heading and TodoForm in create mode', () => {
      renderPage('/todos/new');

      expect(screen.getByRole('heading', { name: '할일 등록' })).toBeInTheDocument();
      expect(screen.getByTestId('todo-form-mode')).toHaveTextContent('create');
    });

    it('submits, transforms blank description/categoryId to undefined, and navigates to /todos on success', async () => {
      const user = userEvent.setup();
      renderPage('/todos/new');

      await user.click(screen.getByRole('button', { name: 'submit' }));

      expect(createMutate).toHaveBeenCalledWith(
        {
          title: 't',
          description: undefined,
          categoryId: undefined,
          startDate: '2026-01-01',
          endDate: '2026-01-05',
        },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(screen.getByTestId('list-page')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('renders 할일 수정 heading, passes initialValues/mode=edit, and mutates+navigates on submit', async () => {
      vi.mocked(useTodosQuery).mockReturnValue({
        data: [makeTodo({ id: 't1', title: '기존 할일' })],
        isLoading: false,
      } as unknown as ReturnType<typeof useTodosQuery>);
      const user = userEvent.setup();
      renderPage('/todos/t1/edit');

      expect(screen.getByRole('heading', { name: '할일 수정' })).toBeInTheDocument();
      expect(screen.getByTestId('todo-form-mode')).toHaveTextContent('edit');
      expect(screen.getByText('기존 할일')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'submit' }));

      expect(updateMutate).toHaveBeenCalledWith(
        {
          id: 't1',
          payload: {
            title: 't',
            description: undefined,
            categoryId: undefined,
            startDate: '2026-01-01',
            endDate: '2026-01-05',
            isCompleted: false,
          },
        },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(screen.getByTestId('list-page')).toBeInTheDocument();
    });

    it('shows a not-found message with a link back to /todos when the todo does not exist', () => {
      vi.mocked(useTodosQuery).mockReturnValue({
        data: [makeTodo({ id: 'other' })],
        isLoading: false,
      } as unknown as ReturnType<typeof useTodosQuery>);
      renderPage('/todos/t1/edit');

      expect(screen.getByText('해당 할일을 찾을 수 없습니다.')).toBeInTheDocument();
      expect(screen.queryByTestId('todo-form-stub')).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: '← 목록으로' })).toHaveAttribute('href', '/todos');
    });
  });
});
