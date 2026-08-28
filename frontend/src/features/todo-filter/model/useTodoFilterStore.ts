import { create } from 'zustand';
import type { TodoStatus } from '../../../entities/todo';

interface TodoFilterState {
  categoryId: string | undefined;
  status: TodoStatus | undefined;
  setCategoryId: (categoryId: string | undefined) => void;
  setStatus: (status: TodoStatus | undefined) => void;
  reset: () => void;
}

export const useTodoFilterStore = create<TodoFilterState>((set) => ({
  categoryId: undefined,
  status: undefined,
  setCategoryId: (categoryId) => set({ categoryId }),
  setStatus: (status) => set({ status }),
  reset: () => set({ categoryId: undefined, status: undefined }),
}));
