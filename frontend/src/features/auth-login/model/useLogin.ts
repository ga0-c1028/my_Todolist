import { useMutation } from '@tanstack/react-query';
import { login, useAuthStore } from '../../../entities/user';
import { getEnv } from '../../../shared/config';
import type { LoginRequest } from '../../../entities/user';

export function useLogin() {
  const authLogin = useAuthStore((state) => state.login);
  return useMutation({
    mutationFn: (payload: LoginRequest) => login(payload),
    onSuccess: (data) => {
      authLogin(data.user, data.accessToken, data.refreshToken);
      if (getEnv().isDev) console.log('[auth-login] 로그인 성공:', data.user.email);
    },
    onError: (error) => {
      if (getEnv().isDev) console.log('[auth-login] 로그인 실패:', error);
    },
  });
}
