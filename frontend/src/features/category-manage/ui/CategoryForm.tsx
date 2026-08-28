import { useId, useState, type FormEvent, type JSX } from 'react';
import { Button, ErrorMessage } from '../../../shared/ui';
import { isValidCategoryName } from '../../../shared/lib/validators';
import './CategoryForm.css';

interface CategoryFormProps {
  initialName?: string;
  onSubmit: (name: string) => void;
  onCancel?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  serverError?: string | null;
}

export function CategoryForm({
  initialName = '',
  onSubmit,
  onCancel,
  submitLabel = '추가',
  isSubmitting,
  serverError,
}: CategoryFormProps): JSX.Element {
  const [name, setName] = useState(initialName);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputId = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidCategoryName(name)) {
      setValidationError('이름은 1자 이상 20자 이하로 입력해주세요.');
      return;
    }

    setValidationError(null);
    onSubmit(name);
    if (!onCancel) {
      setName('');
    }
  }

  return (
    <form className="category-form" onSubmit={handleSubmit} noValidate>
      <div className="category-form__field">
        {onCancel ? null : <label htmlFor={inputId}>새 카테고리 이름 (1~20자)</label>}
        <input
          id={inputId}
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <ErrorMessage message={serverError ?? validationError} />
      <div className="category-form__actions">
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            취소
          </Button>
        ) : null}
      </div>
    </form>
  );
}
