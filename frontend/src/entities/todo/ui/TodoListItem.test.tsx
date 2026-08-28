import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoListItem } from './TodoListItem';
import type { Todo } from '../model/types';

const baseTodo: Todo = {
  id: 't1',
  userId: 'u1',
  categoryId: 'c1',
  title: '할일 제목',
  description: null,
  startDate: '2026-01-10',
  endDate: '2026-01-20',
  isCompleted: false,
  completedAt: null,
  status: 'inProgress',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('TodoListItem', () => {
  it('renders the todo title', () => {
    render(<TodoListItem todo={baseTodo} />);
    expect(screen.getByText('할일 제목')).toBeInTheDocument();
  });

  it('applies the strikethrough class when isCompleted is true', () => {
    render(<TodoListItem todo={{ ...baseTodo, isCompleted: true }} />);
    expect(screen.getByText('할일 제목')).toHaveClass('todo-list-item__title--completed');
  });

  it('does not apply the strikethrough class when isCompleted is false', () => {
    render(<TodoListItem todo={baseTodo} />);
    expect(screen.getByText('할일 제목')).not.toHaveClass('todo-list-item__title--completed');
  });

  it('renders categoryName when provided', () => {
    render(<TodoListItem todo={baseTodo} categoryName="업무" />);
    expect(screen.getByText('업무')).toBeInTheDocument();
  });

  it('does not crash when categoryName is omitted', () => {
    expect(() => render(<TodoListItem todo={baseTodo} />)).not.toThrow();
  });

  it('renders the date range text', () => {
    render(<TodoListItem todo={baseTodo} />);
    expect(screen.getByText('2026-01-10 ~ 2026-01-20')).toBeInTheDocument();
  });

  it('checkbox checked state matches todo.isCompleted', () => {
    render(<TodoListItem todo={{ ...baseTodo, isCompleted: true }} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('calls onToggleComplete with the todo when checkbox is clicked', async () => {
    const onToggleComplete = vi.fn();
    const user = userEvent.setup();
    render(<TodoListItem todo={baseTodo} onToggleComplete={onToggleComplete} />);

    await user.click(screen.getByRole('checkbox'));

    expect(onToggleComplete).toHaveBeenCalledWith(baseTodo);
  });

  it('does not throw when onToggleComplete is omitted', async () => {
    const user = userEvent.setup();
    render(<TodoListItem todo={baseTodo} />);

    await expect(user.click(screen.getByRole('checkbox'))).resolves.not.toThrow();
  });

  it('calls onEdit with the todo when 수정 is clicked', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    render(<TodoListItem todo={baseTodo} onEdit={onEdit} />);

    await user.click(screen.getByText('수정'));

    expect(onEdit).toHaveBeenCalledWith(baseTodo);
  });

  it('does not throw when onEdit is omitted', async () => {
    const user = userEvent.setup();
    render(<TodoListItem todo={baseTodo} />);

    await expect(user.click(screen.getByText('수정'))).resolves.not.toThrow();
  });

  it('calls onDelete with the todo when 삭제 is clicked', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(<TodoListItem todo={baseTodo} onDelete={onDelete} />);

    await user.click(screen.getByText('삭제'));

    expect(onDelete).toHaveBeenCalledWith(baseTodo);
  });

  it('does not throw when onDelete is omitted', async () => {
    const user = userEvent.setup();
    render(<TodoListItem todo={baseTodo} />);

    await expect(user.click(screen.getByText('삭제'))).resolves.not.toThrow();
  });

  it('renders a TodoStatusBadge reflecting todo.status', () => {
    render(<TodoListItem todo={{ ...baseTodo, status: 'overdue' }} />);
    expect(screen.getByText((content) => content.includes('기한초과'))).toBeInTheDocument();
  });
});
