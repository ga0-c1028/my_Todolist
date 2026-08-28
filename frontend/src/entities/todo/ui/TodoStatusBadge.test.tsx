import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TodoStatusBadge } from './TodoStatusBadge';
import type { TodoStatus } from '../model/types';

const CASES: { status: TodoStatus; label: string; className: string }[] = [
  { status: 'notStarted', label: '시작 전', className: 'todo-status-badge--not-started' },
  { status: 'inProgress', label: '진행중', className: 'todo-status-badge--in-progress' },
  { status: 'completed', label: '완료', className: 'todo-status-badge--completed' },
  { status: 'overdue', label: '기한초과', className: 'todo-status-badge--overdue' },
];

describe('TodoStatusBadge', () => {
  it.each(CASES)('renders the label $label for status $status', ({ status, label }) => {
    render(<TodoStatusBadge status={status} />);
    expect(screen.getByText((content) => content.includes(label))).toBeInTheDocument();
  });

  it.each(CASES)('applies the class $className for status $status', ({ status, className, label }) => {
    render(<TodoStatusBadge status={status} />);
    expect(screen.getByText((content) => content.includes(label))).toHaveClass(className);
  });

  it('includes a check-mark for the completed status', () => {
    render(<TodoStatusBadge status="completed" />);
    expect(screen.getByText('✓ 완료')).toBeInTheDocument();
  });
});
