import type { JSX } from 'react';
import { useCategoriesQuery } from '../../../entities/category';
import type { TodoStatus } from '../../../entities/todo';
import { useTodoFilterStore } from '../../../features/todo-filter';
import { useLocale } from '../../../shared/config';
import './TodoFilterBar.css';

export function TodoFilterBar(): JSX.Element {
  const { data: categories } = useCategoriesQuery();
  const categoryId = useTodoFilterStore((state) => state.categoryId);
  const status = useTodoFilterStore((state) => state.status);
  const setCategoryId = useTodoFilterStore((state) => state.setCategoryId);
  const setStatus = useTodoFilterStore((state) => state.setStatus);
  const { t, messages } = useLocale();

  const STATUS_OPTIONS: Array<{ label: string; value: TodoStatus | undefined }> = [
    { label: messages.todoFilter.all, value: undefined },
    { label: messages.todoStatus.notStarted, value: 'notStarted' },
    { label: messages.todoStatus.inProgress, value: 'inProgress' },
    { label: messages.todoStatus.completed, value: 'completed' },
    { label: messages.todoStatus.overdue, value: 'overdue' },
  ];

  return (
    <div className="todo-filter-bar">
      <div className="todo-filter-bar__group">
        <label className="todo-filter-bar__label" htmlFor="todo-filter-category">
          {t('todoFilter.categoryLabel')}
        </label>
        <select
          id="todo-filter-category"
          className="todo-filter-bar__select"
          value={categoryId ?? ''}
          onChange={(event) => setCategoryId(event.target.value || undefined)}
        >
          <option value="">{t('todoFilter.all')}</option>
          {(categories ?? []).map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="todo-filter-bar__group">
        <span className="todo-filter-bar__label">{t('todoFilter.statusLabel')}</span>
        <div className="todo-filter-bar__status-buttons" role="group" aria-label={t('todoFilter.statusFilterAriaLabel')}>
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
          aria-label={t('todoFilter.statusFilterAriaLabel')}
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
