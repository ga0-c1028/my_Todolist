import { useQuery } from '@tanstack/react-query';
import { listTodos } from './todoApi';
import type { TodoListParams } from '../model/types';

export function useTodosQuery(params: TodoListParams = {}) {
  return useQuery({
    queryKey: ['todos', params],
    queryFn: () => listTodos(params),
  });
}
