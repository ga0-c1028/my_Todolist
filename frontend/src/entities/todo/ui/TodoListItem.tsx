import type { JSX } from 'react';
import { Button } from '../../../shared/ui/Button';
import type { Todo } from '../model/types';
import { TodoStatusBadge } from './TodoStatusBadge';
import './TodoListItem.css';

interface TodoListItemProps {
  todo: Todo;
  categoryName?: string;
  onToggleComplete?: (todo: Todo) => void;
  onEdit?: (todo: Todo) => void;
  onDelete?: (todo: Todo) => void;
}

export function TodoListItem({
  todo,
  categoryName,
  onToggleComplete,
  onEdit,
  onDelete,
}: TodoListItemProps): JSX.Element {
  const titleClassName = todo.isCompleted
    ? 'todo-list-item__title todo-list-item__title--completed'
    : 'todo-list-item__title';

  return (
    <div className="todo-list-item">
      <input
        type="checkbox"
        className="todo-list-item__checkbox"
        checked={todo.isCompleted}
        onChange={() => onToggleComplete?.(todo)}
      />
      <div className="todo-list-item__body">
        <div className="todo-list-item__title-row">
          <span className={titleClassName}>{todo.title}</span>
          {categoryName && <span className="todo-list-item__category">{categoryName}</span>}
          <TodoStatusBadge status={todo.status} />
        </div>
        <span className="todo-list-item__dates">
          {todo.startDate} ~ {todo.endDate}
        </span>
      </div>
      <div className="todo-list-item__actions">
        <Button variant="secondary" onClick={() => onEdit?.(todo)}>
          수정
        </Button>
        <Button variant="secondary" onClick={() => onDelete?.(todo)}>
          삭제
        </Button>
      </div>
    </div>
  );
}
