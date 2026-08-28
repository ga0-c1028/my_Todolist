import type { JSX } from 'react';
import type { TodoStatus } from '../model/types';
import { useLocale } from '../../../shared/config';
import './TodoStatusBadge.css';

interface TodoStatusBadgeProps {
  status: TodoStatus;
}

const CLASS_NAME: Record<TodoStatus, string> = {
  notStarted: 'todo-status-badge--not-started',
  inProgress: 'todo-status-badge--in-progress',
  completed: 'todo-status-badge--completed',
  overdue: 'todo-status-badge--overdue',
};

export function TodoStatusBadge({ status }: TodoStatusBadgeProps): JSX.Element {
  const { messages } = useLocale();
  const label = messages.todoStatus[status];
  const className = CLASS_NAME[status];
  return (
    <span className={`todo-status-badge ${className}`}>
      {status === 'completed' ? '✓ ' : ''}
      {label}
    </span>
  );
}
