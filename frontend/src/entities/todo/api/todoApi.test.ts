import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api, parseJsonOrThrow } from '../../../shared/api';
import { listTodos, getTodo, createTodo, updateTodo, deleteTodo } from './todoApi';
import type { Todo } from '../model/types';

vi.mock('../../../shared/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  parseJsonOrThrow: vi.fn(),
}));

const fakeTodo: Todo = {
  id: 't1',
  userId: 'u1',
  categoryId: 'c1',
  title: '할일',
  description: null,
  startDate: '2026-01-10',
  endDate: '2026-01-20',
  isCompleted: false,
  completedAt: null,
  status: 'inProgress',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('todoApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listTodos', () => {
    it('builds a query string with categoryId and status when both are given', async () => {
      vi.mocked(api.get).mockResolvedValue({} as Response);
      vi.mocked(parseJsonOrThrow).mockResolvedValue([fakeTodo]);

      await listTodos({ categoryId: 'c1', status: 'inProgress' });

      const url = vi.mocked(api.get).mock.calls[0][0];
      expect(url).toContain('categoryId=c1');
      expect(url).toContain('status=inProgress');
    });

    it('does not add a query string when no params are given', async () => {
      vi.mocked(api.get).mockResolvedValue({} as Response);
      vi.mocked(parseJsonOrThrow).mockResolvedValue([fakeTodo]);

      await listTodos({});

      const url = vi.mocked(api.get).mock.calls[0][0];
      expect(url).not.toContain('?');
    });

    it('returns the parsed array', async () => {
      vi.mocked(api.get).mockResolvedValue({} as Response);
      vi.mocked(parseJsonOrThrow).mockResolvedValue([fakeTodo]);

      const result = await listTodos();

      expect(result).toEqual([fakeTodo]);
    });
  });

  it('getTodo calls api.get with the todo id path', async () => {
    vi.mocked(api.get).mockResolvedValue({} as Response);
    vi.mocked(parseJsonOrThrow).mockResolvedValue(fakeTodo);

    await getTodo('t1');

    expect(api.get).toHaveBeenCalledWith('/api/todos/t1');
  });

  it('createTodo calls api.post with the payload', async () => {
    vi.mocked(api.post).mockResolvedValue({} as Response);
    vi.mocked(parseJsonOrThrow).mockResolvedValue(fakeTodo);

    await createTodo({ title: '할일', startDate: '2026-01-10', endDate: '2026-01-20' });

    expect(api.post).toHaveBeenCalledWith('/api/todos', {
      title: '할일',
      startDate: '2026-01-10',
      endDate: '2026-01-20',
    });
  });

  it('updateTodo calls api.patch with id and payload', async () => {
    vi.mocked(api.patch).mockResolvedValue({} as Response);
    vi.mocked(parseJsonOrThrow).mockResolvedValue(fakeTodo);

    await updateTodo('t1', { isCompleted: true });

    expect(api.patch).toHaveBeenCalledWith('/api/todos/t1', { isCompleted: true });
  });

  it('deleteTodo calls api.delete and does not parse the body when ok', async () => {
    vi.mocked(api.delete).mockResolvedValue({ ok: true } as Response);

    await expect(deleteTodo('t1')).resolves.toBeUndefined();

    expect(api.delete).toHaveBeenCalledWith('/api/todos/t1');
    expect(parseJsonOrThrow).not.toHaveBeenCalled();
  });

  it('deleteTodo throws when the response is not ok', async () => {
    vi.mocked(api.delete).mockResolvedValue({ ok: false } as Response);
    const error = new Error('삭제 실패');
    vi.mocked(parseJsonOrThrow).mockRejectedValue(error);

    await expect(deleteTodo('t1')).rejects.toBe(error);
    expect(parseJsonOrThrow).toHaveBeenCalled();
  });
});
