import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api, parseJsonOrThrow } from '../../../shared/api';
import { listCategories, createCategory, updateCategory, deleteCategory } from './categoryApi';
import type { Category } from '../model/types';

vi.mock('../../../shared/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  parseJsonOrThrow: vi.fn(),
}));

const fakeCategories: Category[] = [
  { id: 'c1', userId: 'u1', name: '업무', isDefault: false },
];

describe('categoryApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listCategories calls api.get and returns parsed array', async () => {
    vi.mocked(api.get).mockResolvedValue({} as Response);
    vi.mocked(parseJsonOrThrow).mockResolvedValue(fakeCategories);

    const result = await listCategories();

    expect(api.get).toHaveBeenCalledWith('/api/categories');
    expect(result).toEqual(fakeCategories);
  });

  it('createCategory calls api.post with the payload', async () => {
    vi.mocked(api.post).mockResolvedValue({} as Response);
    vi.mocked(parseJsonOrThrow).mockResolvedValue(fakeCategories[0]);

    await createCategory({ name: 'x' });

    expect(api.post).toHaveBeenCalledWith('/api/categories', { name: 'x' });
  });

  it('updateCategory calls api.patch with id and payload', async () => {
    vi.mocked(api.patch).mockResolvedValue({} as Response);
    vi.mocked(parseJsonOrThrow).mockResolvedValue(fakeCategories[0]);

    await updateCategory('id1', { name: 'y' });

    expect(api.patch).toHaveBeenCalledWith('/api/categories/id1', { name: 'y' });
  });

  it('deleteCategory calls api.delete and does not parse the body when ok', async () => {
    vi.mocked(api.delete).mockResolvedValue({ ok: true } as Response);

    await expect(deleteCategory('id1')).resolves.toBeUndefined();

    expect(api.delete).toHaveBeenCalledWith('/api/categories/id1');
    expect(parseJsonOrThrow).not.toHaveBeenCalled();
  });

  it('deleteCategory throws when the response is not ok', async () => {
    vi.mocked(api.delete).mockResolvedValue({ ok: false } as Response);
    const error = new Error('삭제 실패');
    vi.mocked(parseJsonOrThrow).mockRejectedValue(error);

    await expect(deleteCategory('id1')).rejects.toBe(error);
    expect(parseJsonOrThrow).toHaveBeenCalled();
  });
});
