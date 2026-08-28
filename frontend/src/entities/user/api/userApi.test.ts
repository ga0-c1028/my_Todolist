import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api, parseJsonOrThrow } from '../../../shared/api';
import { updateMe } from './userApi';
import type { User } from '../model/types';

vi.mock('../../../shared/api', () => ({
  api: { patch: vi.fn() },
  parseJsonOrThrow: vi.fn(),
}));

const fakeUser: User = {
  id: '1',
  email: 'user@example.com',
  name: '홍길동',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('updateMe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls api.patch with /api/users/me and the given patch', async () => {
    vi.mocked(api.patch).mockResolvedValue({} as Response);
    vi.mocked(parseJsonOrThrow).mockResolvedValue(fakeUser);

    await updateMe({ name: '새이름' });

    expect(api.patch).toHaveBeenCalledWith('/api/users/me', { name: '새이름' });
  });

  it('resolves with whatever parseJsonOrThrow resolves to', async () => {
    vi.mocked(api.patch).mockResolvedValue({} as Response);
    vi.mocked(parseJsonOrThrow).mockResolvedValue(fakeUser);

    const result = await updateMe({ name: '새이름' });

    expect(result).toEqual(fakeUser);
  });

  it('propagates rejection from parseJsonOrThrow', async () => {
    vi.mocked(api.patch).mockResolvedValue({} as Response);
    const error = new Error('잘못된 요청입니다.');
    vi.mocked(parseJsonOrThrow).mockRejectedValue(error);

    await expect(updateMe({ name: '새이름' })).rejects.toBe(error);
  });
});
