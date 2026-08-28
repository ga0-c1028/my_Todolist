import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../../../widgets/app-header';
import { TodoFilterBar } from '../../../widgets/todo-filter-bar';
import { useTodoFilterStore } from '../../../features/todo-filter';
import { useTodosQuery, TodoListItem, type Todo } from '../../../entities/todo';
import { useCategoriesQuery } from '../../../entities/category';
import { useToggleComplete } from '../../../features/todo-toggle-complete';
import { useDeleteTodo } from '../../../features/todo-delete';
import { Button, ConfirmDialog } from '../../../shared/ui';
import { getEnv } from '../../../shared/config';
import './TodoListPage.css';

export function TodoListPage() {
  const navigate = useNavigate();
  const { categoryId, status } = useTodoFilterStore();
  const { data: todos } = useTodosQuery({ categoryId, status });
  const { data: categories } = useCategoriesQuery();
  const toggleComplete = useToggleComplete();
  const deleteTodo = useDeleteTodo();
  const [pendingDelete, setPendingDelete] = useState<Todo | null>(null);

  const categoryNameById = new Map((categories ?? []).map((c) => [c.id, c.name]));

  function handleConfirmDelete() {
    if (!pendingDelete) return;
    if (getEnv().isDev) console.log('[todo-list] 삭제 확정:', pendingDelete.id);
    deleteTodo.mutate(pendingDelete.id);
    setPendingDelete(null);
  }

  return (
    <div className="todo-list-page">
      <AppHeader />
      <div className="todo-list-page__content">
        <div className="todo-list-page__toolbar">
          <TodoFilterBar />
          <Button onClick={() => navigate('/todos/new')}>+ 할일 등록</Button>
        </div>

        {(todos ?? []).length === 0 ? (
          <p className="todo-list-page__empty">등록된 할일이 없습니다. 새 할일을 등록해보세요.</p>
        ) : (
          <div className="todo-list-page__items">
            {(todos ?? []).map((todo) => (
              <TodoListItem
                key={todo.id}
                todo={todo}
                categoryName={categoryNameById.get(todo.categoryId)}
                onToggleComplete={(t) => toggleComplete.mutate(t)}
                onEdit={(t) => navigate(`/todos/${t.id}/edit`)}
                onDelete={(t) => setPendingDelete(t)}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="할일을 삭제하시겠어요?"
        description="삭제된 할일은 복구할 수 없습니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
