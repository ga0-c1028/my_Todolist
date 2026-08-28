import { api, parseJsonOrThrow } from '../../../shared/api';
import type { Todo, CreateTodoRequest, UpdateTodoRequest, TodoListParams } from '../model/types';

function buildQueryString(params: TodoListParams): string {
  const search = new URLSearchParams();
  if (params.categoryId) search.set('categoryId', params.categoryId);
  if (params.status) search.set('status', params.status);
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function listTodos(params: TodoListParams = {}): Promise<Todo[]> {
  const response = await api.get(`/api/todos${buildQueryString(params)}`);
  return parseJsonOrThrow<Todo[]>(response);
}

export async function getTodo(id: string): Promise<Todo> {
  const response = await api.get(`/api/todos/${id}`);
  return parseJsonOrThrow<Todo>(response);
}

export async function createTodo(payload: CreateTodoRequest): Promise<Todo> {
  const response = await api.post('/api/todos', payload);
  return parseJsonOrThrow<Todo>(response);
}

export async function updateTodo(id: string, payload: UpdateTodoRequest): Promise<Todo> {
  const response = await api.patch(`/api/todos/${id}`, payload);
  return parseJsonOrThrow<Todo>(response);
}

export async function deleteTodo(id: string): Promise<void> {
  const response = await api.delete(`/api/todos/${id}`);
  if (!response.ok) {
    await parseJsonOrThrow(response);
  }
}
