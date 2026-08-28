import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearTokens, setTokens } from '../../../shared/api';
import { useAuthStore } from './useAuthStore';
import type { User } from './types';

vi.mock('../../../shared/api', () => ({
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
}));

const fakeUser: User = {
  id: '1',
  email: 'user@example.com',
  name: '홍길동',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().logout();
    localStorage.clear();
  });

  it('has null user and isAuthenticated false initially', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('login sets tokens and updates state', () => {
    useAuthStore.getState().login(fakeUser, 'at1', 'rt1');

    expect(setTokens).toHaveBeenCalledWith('at1', 'rt1');
    const state = useAuthStore.getState();
    expect(state.user).toEqual(fakeUser);
    expect(state.isAuthenticated).toBe(true);
  });

  it('logout clears tokens and resets state', () => {
    useAuthStore.getState().login(fakeUser, 'at1', 'rt1');
    vi.clearAllMocks();

    useAuthStore.getState().logout();

    expect(clearTokens).toHaveBeenCalled();
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('updateUser replaces user without touching auth state or tokens', () => {
    useAuthStore.getState().login(fakeUser, 'at1', 'rt1');
    vi.clearAllMocks();

    const newUser: User = { ...fakeUser, name: '새이름' };
    useAuthStore.getState().updateUser(newUser);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(newUser);
    expect(state.isAuthenticated).toBe(true);
    expect(setTokens).not.toHaveBeenCalled();
    expect(clearTokens).not.toHaveBeenCalled();
  });
});
