import { useState, type FormEvent, type JSX } from 'react';
import { Button, ErrorMessage } from '../../../shared/ui';
import { useLogin } from '../model/useLogin';
import { useLocale } from '../../../shared/config';
import './LoginForm.css';

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const mutation = useLogin();
  const { t } = useLocale();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email || !password) {
      setValidationError(t('login.errorRequired'));
      return;
    }

    setValidationError(null);
    mutation.mutate(
      { email, password },
      {
        onSuccess: () => onSuccess?.(),
      },
    );
  }

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      <div className="login-form__field">
        <label htmlFor="login-email">{t('login.emailLabel')}</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
        />
      </div>
      <div className="login-form__field">
        <label htmlFor="login-password">{t('login.passwordLabel')}</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
        />
      </div>
      <ErrorMessage message={mutation.isError ? mutation.error.message : validationError} />
      <Button type="submit" disabled={mutation.isPending}>
        {t('login.submit')}
      </Button>
    </form>
  );
}
