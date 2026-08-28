import { useState, type FormEvent, type JSX } from 'react';
import { Button, ErrorMessage } from '../../../shared/ui';
import { useLogin } from '../model/useLogin';
import './LoginForm.css';

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const mutation = useLogin();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email || !password) {
      setValidationError('이메일과 비밀번호를 모두 입력해주세요.');
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
        <label htmlFor="login-email">이메일</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
        />
      </div>
      <div className="login-form__field">
        <label htmlFor="login-password">비밀번호</label>
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
        로그인
      </Button>
    </form>
  );
}
