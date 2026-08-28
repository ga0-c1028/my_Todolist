import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTodo } from '../../../entities/todo';
import { getEnv } from '../../../shared/config';
import type { UpdateTodoRequest } from '../../../entities/todo';

export function useUpdateTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTodoRequest }) => updateTodo(id, payload),
    onSuccess: (todo) => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      if (getEnv().isDev) console.log('[todo-edit] 할일 수정 성공:', todo.id);
    },
    onError: (error) => {
      if (getEnv().isDev) console.log('[todo-edit] 할일 수정 실패:', error);
    },
  });
}
