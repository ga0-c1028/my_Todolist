import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTodo } from '../../../entities/todo';
import { getEnv } from '../../../shared/config';
import type { CreateTodoRequest } from '../../../entities/todo';

export function useCreateTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTodoRequest) => createTodo(payload),
    onSuccess: (todo) => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      if (getEnv().isDev) console.log('[todo-create] 할일 생성 성공:', todo.id);
    },
    onError: (error) => {
      if (getEnv().isDev) console.log('[todo-create] 할일 생성 실패:', error);
    },
  });
}
