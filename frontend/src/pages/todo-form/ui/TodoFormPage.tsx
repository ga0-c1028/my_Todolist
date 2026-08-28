import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppHeader } from '../../../widgets/app-header';
import { TodoForm, useCreateTodo, type TodoFormValues } from '../../../features/todo-create';
import { useUpdateTodo } from '../../../features/todo-edit';
import { useTodosQuery } from '../../../entities/todo';
import { getEnv } from '../../../shared/config/env';
import { useLocale } from '../../../shared/config';
import './TodoFormPage.css';

export function TodoFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { data: todos, isLoading } = useTodosQuery();
  const existingTodo = isEdit ? todos?.find((todo) => todo.id === id) : undefined;
  const createMutation = useCreateTodo();
  const updateMutation = useUpdateTodo();
  const mutation = isEdit ? updateMutation : createMutation;
  const { t } = useLocale();

  function handleSubmit(values: TodoFormValues) {
    const payload = {
      title: values.title,
      description: values.description || undefined,
      categoryId: values.categoryId || undefined,
      startDate: values.startDate as string,
      endDate: values.endDate as string,
    };

    if (isEdit && id) {
      updateMutation.mutate(
        { id, payload: { ...payload, isCompleted: values.isCompleted } },
        {
          onSuccess: () => {
            if (getEnv().isDev) console.log('[todo-form] 수정 성공:', id);
            navigate('/todos');
          },
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: (todo) => {
          if (getEnv().isDev) console.log('[todo-form] 등록 성공:', todo.id);
          navigate('/todos');
        },
      });
    }
  }

  if (isEdit && !isLoading && !existingTodo) {
    return (
      <div className="todo-form-page">
        <AppHeader />
        <div className="todo-form-page__content">
          <p>{t('todoForm.notFound')}</p>
          <Link to="/todos">{t('todoForm.backToList')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="todo-form-page">
      <AppHeader />
      <div className="todo-form-page__content">
        <Link to="/todos" className="todo-form-page__back">
          {t('todoForm.backToList')}
        </Link>
        <h1>{isEdit ? t('todoForm.titleEdit') : t('todoForm.titleCreate')}</h1>
        <TodoForm
          mode={isEdit ? 'edit' : 'create'}
          initialValues={
            existingTodo
              ? {
                  title: existingTodo.title,
                  description: existingTodo.description ?? '',
                  categoryId: existingTodo.categoryId,
                  startDate: existingTodo.startDate,
                  endDate: existingTodo.endDate,
                  isCompleted: existingTodo.isCompleted,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          isSubmitting={mutation.isPending}
          serverError={mutation.error?.message}
          submitLabel={isEdit ? t('todoForm.submitEdit') : t('todoForm.submitCreate')}
        />
      </div>
    </div>
  );
}
