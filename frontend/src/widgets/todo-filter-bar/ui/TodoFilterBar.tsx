import type { JSX } from 'react';
import { useCategoriesQuery } from '../../../entities/category';
import type { TodoStatus } from '../../../entities/todo';
import { useTodoFilterStore } from '../../../features/todo-filter';
import './TodoFilterBar.css';

const STATUS_OPTIONS: Array<{ label: string; value: TodoStatus | undefined }> = [
  { label: '전체', value: undefined },
  { label: '시작 전', value: 'notStarted' },
  { label: '진행중', value: 'inProgress' },
  { label: '완료', value: 'completed' },
  { label: '기한초과', value: 'overdue' },
];

export function TodoFilterBar(): JSX.Element {
  const { data: categories } = useCategoriesQuery();
  const categoryId = useTodoFilterStore((state) => state.categoryId);
  const status = useTodoFilterStore((state) => state.status);
  const setCategoryId = useTodoFilterStore((state) => state.setCategoryId);
  const setStatus = useTodoFilterStore((state) => state.setStatus);

  return (
    <div className="todo-filter-bar">
      <div className="todo-filter-bar__group">
        <label className="todo-filter-bar__label" htmlFor="todo-filter-category">
          카테고리:
        </label>
        <select
          id="todo-filter-category"
          className="todo-filter-bar__select"
          value={categoryId ?? ''}
          onChange={(event) => setCategoryId(event.target.value || undefined)}
        >
          <option value="">전체</option>
          {(categories ?? []).map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="todo-filter-bar__group">
        <span className="todo-filter-bar__label">상태:</span>
        <div className="todo-filter-bar__status-buttons" role="group" aria-label="상태 필터">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.label}
              type="button"
              className={
                'todo-filter-bar__status-button' +
                (status === option.value ? ' todo-filter-bar__status-button--active' : '')
              }
              aria-pressed={status === option.value}
              onClick={() => setStatus(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <select
          className="todo-filter-bar__status-select"
          aria-label="상태 필터"
          value={status ?? ''}
          onChange={(event) =>
            setStatus((event.target.value || undefined) as TodoStatus | undefined)
          }
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.label} value={option.value ?? ''}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
