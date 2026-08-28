export type TodoStatus = 'notStarted' | 'inProgress' | 'completed' | 'overdue';

export interface Todo {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  isCompleted: boolean;
  completedAt: string | null;
  status: TodoStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoRequest {
  categoryId?: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
}

export interface UpdateTodoRequest {
  categoryId?: string;
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  isCompleted?: boolean;
}

export interface TodoListParams {
  categoryId?: string;
  status?: TodoStatus;
}
