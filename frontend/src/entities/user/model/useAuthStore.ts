import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setTokens, clearTokens } from '../../../shared/api';
import type { User } from './types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      hasHydrated: false,
      login: (user, accessToken, refreshToken) => {
        setTokens(accessToken, refreshToken);
        set({ user, isAuthenticated: true });
      },
      logout: () => {
        clearTokens();
        set({ user: null, isAuthenticated: false });
      },
      updateUser: (user) => set({ user }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'my_todolist_auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
