import { useEffect, useState, type FormEvent, type JSX } from 'react';
import { Button, ErrorMessage } from '../../../shared/ui';
import { isValidEmail, isValidPassword, isValidName } from '../../../shared/lib/validators';
import { useSignup } from '../model/useSignup';
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidEmail(email)) {
      setValidationError('올바른 이메일 형식이 아닙니다.');
      return;
    }
    if (!isValidPassword(password)) {
      setValidationError('비밀번호는 영문·숫자를 포함해 8자 이상이어야 합니다.');
      return;
    }
    if (!isValidName(name)) {
      setValidationError('이름은 1자 이상 30자 이하로 입력해주세요.');
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
    return <p role="status">가입이 완료되었습니다. 로그인해주세요.</p>;
  }

  return (
    <form className="signup-form" onSubmit={handleSubmit} noValidate>
      <div className="signup-form__field">
        <label htmlFor="signup-email">이메일</label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
        />
      </div>
      <div className="signup-form__field">
        <label htmlFor="signup-password">비밀번호 (영문·숫자 포함 8자 이상)</label>
        <input
          id="signup-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
        />
      </div>
      <div className="signup-form__field">
        <label htmlFor="signup-name">이름</label>
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
        가입하기
      </Button>
    </form>
  );
}
