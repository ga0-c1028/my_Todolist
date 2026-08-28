import { useMutation } from '@tanstack/react-query';
import { updateMe, useAuthStore } from '../../../entities/user';
import { getEnv } from '../../../shared/config';
import type { UpdateUserRequest } from '../../../entities/user';

export function useUpdateProfile() {
  const updateUser = useAuthStore((state) => state.updateUser);
  return useMutation({
    mutationFn: (payload: UpdateUserRequest) => updateMe(payload),
    onSuccess: (user) => {
      updateUser(user);
      if (getEnv().isDev) console.log('[profile-edit] 회원 정보 수정 성공:', user.id);
    },
    onError: (error) => {
      if (getEnv().isDev) console.log('[profile-edit] 회원 정보 수정 실패:', error);
    },
  });
}
