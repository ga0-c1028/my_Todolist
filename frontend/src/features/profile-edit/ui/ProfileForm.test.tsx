import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileForm } from './ProfileForm';
import type { User } from '../../../entities/user';

const fakeUser: User = { id: 'u1', name: '홍길동', email: 'a@b.com', createdAt: '', updatedAt: '' };

function renderForm(props: Partial<Parameters<typeof ProfileForm>[0]> = {}) {
  const onSubmit = vi.fn();
  render(<ProfileForm user={fakeUser} onSubmit={onSubmit} {...props} />);
  return { onSubmit };
}

describe('ProfileForm', () => {
  it('renders the email input pre-filled and read-only/disabled', () => {
    renderForm();

    const emailInput = screen.getByLabelText('이메일') as HTMLInputElement;
    expect(emailInput).toHaveValue('a@b.com');
    expect(emailInput).toHaveAttribute('readonly');
    expect(emailInput).toBeDisabled();
  });

  it('renders the name input pre-filled with the user name', () => {
    renderForm();

    expect(screen.getByLabelText('이름')).toHaveValue('홍길동');
  });

  it('shows a validation error and does not call onSubmit when the name is empty', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.clear(screen.getByLabelText('이름'));
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('이름은 1자 이상 30자 이하로 입력해주세요.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with only {name} when both password fields are left empty', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.clear(screen.getByLabelText('이름'));
    await user.type(screen.getByLabelText('이름'), '새이름');
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0][0];
    expect(payload).toEqual({ name: '새이름' });
    expect('password' in payload).toBe(false);
  });

  it('shows a validation error and does not call onSubmit when password is shorter than 8 chars', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.type(screen.getByLabelText(/새 비밀번호 \(/), 'abc123');
    await user.type(screen.getByLabelText('새 비밀번호 확인'), 'abc123');
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(
      await screen.findByText('비밀번호는 영문·숫자를 포함해 8자 이상이어야 합니다.'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows a validation error and does not call onSubmit when the confirm password does not match', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.type(screen.getByLabelText(/새 비밀번호 \(/), 'abcd1234');
    await user.type(screen.getByLabelText('새 비밀번호 확인'), 'abcd9999');
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('새 비밀번호가 일치하지 않습니다.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with {name, password} when password and confirm match', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.type(screen.getByLabelText(/새 비밀번호 \(/), 'abcd1234');
    await user.type(screen.getByLabelText('새 비밀번호 확인'), 'abcd1234');
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(onSubmit).toHaveBeenCalledWith({ name: '홍길동', password: 'abcd1234' });
  });

  it('clears the password fields after a successful submit', async () => {
    const user = userEvent.setup();
    renderForm();

    const passwordInput = screen.getByLabelText(/새 비밀번호 \(/);
    const confirmInput = screen.getByLabelText('새 비밀번호 확인');
    await user.type(passwordInput, 'abcd1234');
    await user.type(confirmInput, 'abcd1234');
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(passwordInput).toHaveValue('');
    expect(confirmInput).toHaveValue('');
  });

  it('displays the serverError message', () => {
    renderForm({ serverError: '서버 오류가 발생했습니다.' });

    expect(screen.getByRole('alert')).toHaveTextContent('서버 오류가 발생했습니다.');
  });

  it('renders the success message when isSuccess is true', () => {
    renderForm({ isSuccess: true });

    expect(screen.getByText('회원 정보가 수정되었습니다.')).toBeInTheDocument();
  });

  it('does not render the success message when isSuccess is false or omitted', () => {
    renderForm();

    expect(screen.queryByText('회원 정보가 수정되었습니다.')).not.toBeInTheDocument();
  });

  it('disables the submit button when isSubmitting is true', () => {
    renderForm({ isSubmitting: true });

    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
  });
});
