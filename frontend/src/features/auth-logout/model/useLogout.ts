import { useMutation } from '@tanstack/react-query';
import { logout, useAuthStore } from '../../../entities/user';
import { getRefreshToken } from '../../../shared/api';
import { getEnv } from '../../../shared/config';

export function useLogout() {
  const authLogout = useAuthStore((state) => state.logout);
  return useMutation({
    mutationFn: async () => {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await logout(refreshToken).catch(() => undefined); // best-effort server-side invalidation; local session must clear even if this call fails (e.g. network error, already-expired token)
      }
    },
    onSuccess: () => {
      authLogout();
      if (getEnv().isDev) console.log('[auth-logout] 로그아웃 완료');
      window.location.href = '/login';
    },
  });
}
