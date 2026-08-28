import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTodo } from '../../../entities/todo';
import { getEnv } from '../../../shared/config';

export function useDeleteTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTodo(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      if (getEnv().isDev) console.log('[todo-delete] 할일 삭제 성공:', id);
    },
    onError: (error) => {
      if (getEnv().isDev) console.log('[todo-delete] 할일 삭제 실패:', error);
    },
  });
}
