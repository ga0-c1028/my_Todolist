import { useState, type FormEvent, type JSX } from 'react';
import { Button, ErrorMessage } from '../../../shared/ui';
import { isValidName, isValidPassword } from '../../../shared/lib/validators';
import type { User, UpdateUserRequest } from '../../../entities/user';
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidName(name)) {
      setValidationError('이름은 1자 이상 30자 이하로 입력해주세요.');
      return;
    }
    if (password !== '') {
      if (!isValidPassword(password)) {
        setValidationError('비밀번호는 영문·숫자를 포함해 8자 이상이어야 합니다.');
        return;
      }
      if (password !== passwordConfirm) {
        setValidationError('새 비밀번호가 일치하지 않습니다.');
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
        <label htmlFor="profile-email">이메일</label>
        <input id="profile-email" type="email" value={user.email} readOnly disabled />
      </div>
      <div className="profile-form__field">
        <label htmlFor="profile-name">이름</label>
        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="profile-form__field">
        <label htmlFor="profile-password">새 비밀번호 (영문·숫자 포함 8자 이상, 변경 시에만 입력)</label>
        <input
          id="profile-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <div className="profile-form__field">
        <label htmlFor="profile-password-confirm">새 비밀번호 확인</label>
        <input
          id="profile-password-confirm"
          type="password"
          value={passwordConfirm}
          onChange={(event) => setPasswordConfirm(event.target.value)}
        />
      </div>
      <ErrorMessage message={serverError ?? validationError} />
      {isSuccess ? <p className="profile-form__success">회원 정보가 수정되었습니다.</p> : null}
      <Button type="submit" disabled={isSubmitting}>
        저장
      </Button>
    </form>
  );
}
