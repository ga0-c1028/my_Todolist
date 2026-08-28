import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TodoFilterBar } from './TodoFilterBar';
import { useTodoFilterStore } from '../../../features/todo-filter';

vi.mock('../../../entities/category', () => ({
  useCategoriesQuery: vi.fn(),
}));

import { useCategoriesQuery } from '../../../entities/category';

const fakeCategories = [
  { id: 'c1', name: '업무', isDefault: false },
  { id: 'c2', name: '기본', isDefault: true },
];

function renderBar() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <TodoFilterBar />
    </QueryClientProvider>,
  );
}

describe('TodoFilterBar', () => {
  beforeEach(() => {
    useTodoFilterStore.getState().reset();
    vi.mocked(useCategoriesQuery).mockReturnValue({
      data: fakeCategories,
    } as unknown as ReturnType<typeof useCategoriesQuery>);
  });

  it('renders 전체 plus one option per category in the category select', () => {
    renderBar();
    const select = screen.getByLabelText('카테고리:') as HTMLSelectElement;
    const optionLabels = Array.from(select.options).map((option) => option.textContent);
    expect(optionLabels).toEqual(['전체', '업무', '기본']);
  });

  it('selecting a category updates the store, selecting 전체 clears it', async () => {
    const user = userEvent.setup();
    renderBar();
    const select = screen.getByLabelText('카테고리:') as HTMLSelectElement;

    await user.selectOptions(select, '업무');
    expect(useTodoFilterStore.getState().categoryId).toBe('c1');

    await user.selectOptions(select, '전체');
    expect(useTodoFilterStore.getState().categoryId).toBeUndefined();
  });

  it('clicking each status button updates the store status', async () => {
    const user = userEvent.setup();
    renderBar();
    const group = screen.getByRole('group', { name: '상태 필터' });

    await user.click(screen.getByRole('button', { name: '시작 전' }));
    expect(useTodoFilterStore.getState().status).toBe('notStarted');

    await user.click(screen.getByRole('button', { name: '진행중' }));
    expect(useTodoFilterStore.getState().status).toBe('inProgress');

    await user.click(screen.getByRole('button', { name: '완료' }));
    expect(useTodoFilterStore.getState().status).toBe('completed');

    await user.click(screen.getByRole('button', { name: '기한초과' }));
    expect(useTodoFilterStore.getState().status).toBe('overdue');

    await user.click(screen.getByRole('button', { name: '전체' }));
    expect(useTodoFilterStore.getState().status).toBeUndefined();

    expect(group).toBeInTheDocument();
  });

  it('reflects the active status via aria-pressed and the active class', () => {
    renderBar();
    act(() => {
      useTodoFilterStore.getState().setStatus('completed');
    });

    const activeButton = screen.getByRole('button', { name: '완료' });
    expect(activeButton).toHaveAttribute('aria-pressed', 'true');
    expect(activeButton).toHaveClass('todo-filter-bar__status-button--active');

    const inactiveButton = screen.getByRole('button', { name: '진행중' });
    expect(inactiveButton).toHaveAttribute('aria-pressed', 'false');
    expect(inactiveButton).not.toHaveClass('todo-filter-bar__status-button--active');
  });
});
