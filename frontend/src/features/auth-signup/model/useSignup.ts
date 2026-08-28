import { useMutation } from '@tanstack/react-query';
import { signup } from '../../../entities/user';
import { getEnv } from '../../../shared/config';
import type { SignupRequest } from '../../../entities/user';

export function useSignup() {
  return useMutation({
    mutationFn: (payload: SignupRequest) => signup(payload),
    onSuccess: (user) => {
      if (getEnv().isDev) console.log('[auth-signup] 가입 성공:', user.email);
    },
    onError: (error) => {
      if (getEnv().isDev) console.log('[auth-signup] 가입 실패:', error);
    },
  });
}
