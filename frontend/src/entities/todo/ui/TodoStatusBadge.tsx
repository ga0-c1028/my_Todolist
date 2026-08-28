import type { JSX } from 'react';
import type { TodoStatus } from '../model/types';
import './TodoStatusBadge.css';

interface TodoStatusBadgeProps {
  status: TodoStatus;
}

const STATUS_CONFIG: Record<TodoStatus, { label: string; className: string }> = {
  notStarted: { label: '시작 전', className: 'todo-status-badge--not-started' },
  inProgress: { label: '진행중', className: 'todo-status-badge--in-progress' },
  completed: { label: '완료', className: 'todo-status-badge--completed' },
  overdue: { label: '기한초과', className: 'todo-status-badge--overdue' },
};

export function TodoStatusBadge({ status }: TodoStatusBadgeProps): JSX.Element {
  const { label, className } = STATUS_CONFIG[status];
  return (
    <span className={`todo-status-badge ${className}`}>
      {status === 'completed' ? '✓ ' : ''}
      {label}
    </span>
  );
}
