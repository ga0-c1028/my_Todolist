import { useState } from 'react';
import { AppHeader } from '../../../widgets/app-header';
import { useAuthStore } from '../../../entities/user';
import { ProfileForm, useUpdateProfile, useDeleteAccount } from '../../../features/profile-edit';
import { Button, ConfirmDialog } from '../../../shared/ui';
import './ProfilePage.css';

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const mutation = useUpdateProfile();
  const deleteAccount = useDeleteAccount();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!user) {
    return null; // unreachable in practice once route guards exist (FE-12); defensive guard for type-safety since user can be null
  }

  return (
    <div className="profile-page">
      <AppHeader />
      <div className="profile-page__content">
        <h1>회원 정보 수정</h1>
        <ProfileForm
          user={user}
          onSubmit={(payload) => mutation.mutate(payload)}
          isSubmitting={mutation.isPending}
          serverError={mutation.error?.message}
          isSuccess={mutation.isSuccess}
        />

        <div className="profile-page__danger-zone">
          <Button type="button" variant="secondary" onClick={() => setConfirmOpen(true)}>
            회원 탈퇴
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="정말 탈퇴하시겠어요?"
        description="탈퇴 시 계정과 모든 카테고리·할일이 영구히 삭제되며 되돌릴 수 없습니다."
        confirmLabel="탈퇴"
        cancelLabel="취소"
        onConfirm={() => {
          setConfirmOpen(false);
          deleteAccount.mutate();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
