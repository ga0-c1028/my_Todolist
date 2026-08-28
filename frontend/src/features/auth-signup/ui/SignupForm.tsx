import { useEffect, useState, type FormEvent, type JSX } from 'react';
import { Button, ErrorMessage } from '../../../shared/ui';
import { isValidEmail, isValidPassword, isValidName } from '../../../shared/lib/validators';
import { useSignup } from '../model/useSignup';
import { useLocale } from '../../../shared/config';
import './SignupForm.css';

interface SignupFormProps {
  onSuccess?: () => void;
}

export function SignupForm({ onSuccess }: SignupFormProps): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const mutation = useSignup();
  const { t } = useLocale();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidEmail(email)) {
      setValidationError(t('signup.errorInvalidEmail'));
      return;
    }
    if (!isValidPassword(password)) {
      setValidationError(t('signup.errorInvalidPassword'));
      return;
    }
    if (!isValidName(name)) {
      setValidationError(t('signup.errorInvalidName'));
      return;
    }

    setValidationError(null);
    mutation.mutate({ email, password, name });
  }

  useEffect(() => {
    if (mutation.isSuccess) {
      onSuccess?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mutation.isSuccess]);

  if (mutation.isSuccess) {
    return <p role="status">{t('signup.successMessage')}</p>;
  }

  return (
    <form className="signup-form" onSubmit={handleSubmit} noValidate>
      <div className="signup-form__field">
        <label htmlFor="signup-email">{t('signup.emailLabel')}</label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
        />
      </div>
      <div className="signup-form__field">
        <label htmlFor="signup-password">{t('signup.passwordLabel')}</label>
        <input
          id="signup-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
        />
      </div>
      <div className="signup-form__field">
        <label htmlFor="signup-name">{t('signup.nameLabel')}</label>
        <input
          id="signup-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
        />
      </div>
      <ErrorMessage message={mutation.isError ? mutation.error.message : validationError} />
      <Button type="submit" disabled={mutation.isPending}>
        {t('signup.submit')}
      </Button>
    </form>
  );
}
