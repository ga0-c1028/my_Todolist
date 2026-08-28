import { useMutation } from '@tanstack/react-query';
import { deleteMe, useAuthStore } from '../../../entities/user';
import { getEnv } from '../../../shared/config';

export function useDeleteAccount() {
  const authLogout = useAuthStore((state) => state.logout);
  return useMutation({
    mutationFn: () => deleteMe(),
    onSuccess: () => {
      authLogout();
      if (getEnv().isDev) console.log('[profile-edit] 회원 탈퇴 완료');
      window.location.href = '/login';
    },
    onError: (error) => {
      if (getEnv().isDev) console.log('[profile-edit] 회원 탈퇴 실패:', error);
    },
  });
}
