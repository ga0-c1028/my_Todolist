import { useState } from 'react';
import { AppHeader } from '../../../widgets/app-header';
import { useAuthStore } from '../../../entities/user';
import { ProfileForm, useUpdateProfile, useDeleteAccount } from '../../../features/profile-edit';
import { Button, ConfirmDialog } from '../../../shared/ui';
import { useLocale } from '../../../shared/config';
import './ProfilePage.css';

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const mutation = useUpdateProfile();
  const deleteAccount = useDeleteAccount();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { t } = useLocale();

  if (!user) {
    return null; // unreachable in practice once route guards exist (FE-12); defensive guard for type-safety since user can be null
  }

  return (
    <div className="profile-page">
      <AppHeader />
      <div className="profile-page__content">
        <h1>{t('profile.title')}</h1>
        <ProfileForm
          user={user}
          onSubmit={(payload) => mutation.mutate(payload)}
          isSubmitting={mutation.isPending}
          serverError={mutation.error?.message}
          isSuccess={mutation.isSuccess}
        />

        <div className="profile-page__danger-zone">
          <Button type="button" variant="secondary" onClick={() => setConfirmOpen(true)}>
            {t('profile.deleteAccount')}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={t('profile.deleteConfirmTitle')}
        description={t('profile.deleteConfirmDescription')}
        confirmLabel={t('profile.deleteConfirmLabel')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => {
          setConfirmOpen(false);
          deleteAccount.mutate();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
