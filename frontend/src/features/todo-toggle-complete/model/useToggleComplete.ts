import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTodo } from '../../../entities/todo';
import { getEnv } from '../../../shared/config';
import type { Todo } from '../../../entities/todo';

export function useToggleComplete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (todo: Todo) => updateTodo(todo.id, { isCompleted: !todo.isCompleted }),
    onSuccess: (todo) => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      if (getEnv().isDev) console.log('[todo-toggle-complete] 완료 상태 변경:', todo.id, todo.isCompleted);
    },
    onError: (error) => {
      if (getEnv().isDev) console.log('[todo-toggle-complete] 완료 상태 변경 실패:', error);
    },
  });
}
