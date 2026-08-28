import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from './useAuthStore';

vi.mock('../../../shared/api', () => ({
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
}));

describe('useAuthStore hydration', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
    useAuthStore.getState().setHasHydrated(false);
  });

  it('has hasHydrated false initially', () => {
    expect(useAuthStore.getState().hasHydrated).toBe(false);
  });

  it('setHasHydrated(true) updates hasHydrated without affecting user/isAuthenticated', () => {
    useAuthStore.getState().setHasHydrated(true);

    const state = useAuthStore.getState();
    expect(state.hasHydrated).toBe(true);
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
