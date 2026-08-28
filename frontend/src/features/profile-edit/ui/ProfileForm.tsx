import { useState, type FormEvent, type JSX } from 'react';
import { Button, ErrorMessage } from '../../../shared/ui';
import { isValidName, isValidPassword } from '../../../shared/lib/validators';
import type { User, UpdateUserRequest } from '../../../entities/user';
import { useLocale } from '../../../shared/config';
import './ProfileForm.css';

interface ProfileFormProps {
  user: User;
  onSubmit: (payload: UpdateUserRequest) => void;
  isSubmitting?: boolean;
  serverError?: string | null;
  isSuccess?: boolean;
}

export function ProfileForm({ user, onSubmit, isSubmitting, serverError, isSuccess }: ProfileFormProps): JSX.Element {
  const [name, setName] = useState(user.name);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { t } = useLocale();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidName(name)) {
      setValidationError(t('profile.errorInvalidName'));
      return;
    }
    if (password !== '') {
      if (!isValidPassword(password)) {
        setValidationError(t('profile.errorInvalidPassword'));
        return;
      }
      if (password !== passwordConfirm) {
        setValidationError(t('profile.errorPasswordMismatch'));
        return;
      }
    }

    setValidationError(null);
    onSubmit({ name, ...(password !== '' ? { password } : {}) });
    setPassword('');
    setPasswordConfirm('');
  }

  return (
    <form className="profile-form" onSubmit={handleSubmit} noValidate>
      <div className="profile-form__field">
        <label htmlFor="profile-email">{t('profile.emailLabel')}</label>
        <input id="profile-email" type="email" value={user.email} readOnly disabled />
      </div>
      <div className="profile-form__field">
        <label htmlFor="profile-name">{t('profile.nameLabel')}</label>
        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="profile-form__field">
        <label htmlFor="profile-password">{t('profile.passwordLabel')}</label>
        <input
          id="profile-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <div className="profile-form__field">
        <label htmlFor="profile-password-confirm">{t('profile.passwordConfirmLabel')}</label>
        <input
          id="profile-password-confirm"
          type="password"
          value={passwordConfirm}
          onChange={(event) => setPasswordConfirm(event.target.value)}
        />
      </div>
      <ErrorMessage message={serverError ?? validationError} />
      {isSuccess ? <p className="profile-form__success">{t('profile.successMessage')}</p> : null}
      <Button type="submit" disabled={isSubmitting}>
        {t('profile.submit')}
      </Button>
    </form>
  );
}
