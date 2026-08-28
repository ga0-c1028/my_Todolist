import { useState, type FormEvent, type JSX } from 'react';
import { Button, ErrorMessage, DateRangePicker } from '../../../shared/ui';
import { isValidTodoTitle } from '../../../shared/lib/validators';
import { useCategoriesQuery } from '../../../entities/category';
import { useLocale } from '../../../shared/config';
import './TodoForm.css';

export interface TodoFormValues {
  title: string;
  description: string;
  categoryId: string;
  startDate: string | null;
  endDate: string | null;
  isCompleted: boolean;
}

interface TodoFormProps {
  mode: 'create' | 'edit';
  initialValues?: Partial<TodoFormValues>;
  onSubmit: (values: TodoFormValues) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  serverError?: string | null;
}

export function TodoForm({
  mode,
  initialValues,
  onSubmit,
  isSubmitting,
  submitLabel = '저장',
  serverError,
}: TodoFormProps): JSX.Element {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? '');
  const [startDate, setStartDate] = useState<string | null>(initialValues?.startDate ?? null);
  const [endDate, setEndDate] = useState<string | null>(initialValues?.endDate ?? null);
  const [isCompleted, setIsCompleted] = useState(initialValues?.isCompleted ?? false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { data: categories } = useCategoriesQuery();
  const { t } = useLocale();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidTodoTitle(title)) {
      setValidationError(t('todoForm.errorInvalidTitle'));
      return;
    }
    if (!startDate || !endDate) {
      setValidationError(t('todoForm.errorDatesRequired'));
      return;
    }
    if (endDate < startDate) {
      setValidationError(t('todoForm.errorDateOrder'));
      return;
    }

    setValidationError(null);
    onSubmit({ title, description, categoryId, startDate, endDate, isCompleted });
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit} noValidate>
      <div className="todo-form__field">
        <label htmlFor="todo-title">{t('todoForm.titleLabel')}</label>
        <input
          id="todo-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      <div className="todo-form__field">
        <label htmlFor="todo-description">{t('todoForm.descriptionLabel')}</label>
        <textarea
          id="todo-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={1000}
        />
      </div>
      <div className="todo-form__field">
        <label htmlFor="todo-category">{t('todoForm.categoryLabel')}</label>
        <select
          id="todo-category"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
        >
          <option value="">{t('todoForm.defaultCategoryOption')}</option>
          {(categories ?? []).map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div className="todo-form__field">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={(range) => {
            setStartDate(range.startDate);
            setEndDate(range.endDate);
          }}
        />
      </div>
      {mode === 'edit' ? (
        <div className="todo-form__completed">
          <input
            id="todo-is-completed"
            type="checkbox"
            checked={isCompleted}
            onChange={(event) => setIsCompleted(event.target.checked)}
          />
          <label htmlFor="todo-is-completed">{t('todoForm.completedLabel')}</label>
        </div>
      ) : null}
      <ErrorMessage message={serverError ?? validationError} />
      <Button type="submit" disabled={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  );
}
