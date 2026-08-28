import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { SignupForm } from './SignupForm';

vi.mock('../../../entities/user', () => ({
  signup: vi.fn(),
}));

import { signup } from '../../../entities/user';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function renderForm(onSuccess?: () => void) {
  const Wrapper = createWrapper();
  return render(<SignupForm onSuccess={onSuccess} />, { wrapper: Wrapper });
}

describe('SignupForm', () => {
  it('renders email/password/name inputs and a submit button', () => {
    renderForm();
    expect(screen.getByLabelText('이메일')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호 (영문·숫자 포함 8자 이상)')).toBeInTheDocument();
    expect(screen.getByLabelText('이름')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '가입하기' })).toBeInTheDocument();
  });

  it('shows a validation error for an invalid email without calling signup', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('이메일'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: '가입하기' }));

    expect(await screen.findByText('올바른 이메일 형식이 아닙니다.')).toBeInTheDocument();
    expect(signup).not.toHaveBeenCalled();
  });

  it('shows a validation error for a too-short password without calling signup', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('이메일'), 'user@example.com');
    await user.type(screen.getByLabelText('비밀번호 (영문·숫자 포함 8자 이상)'), 'short1');
    await user.type(screen.getByLabelText('이름'), '홍길동');
    await user.click(screen.getByRole('button', { name: '가입하기' }));

    expect(
      await screen.findByText('비밀번호는 영문·숫자를 포함해 8자 이상이어야 합니다.'),
    ).toBeInTheDocument();
    expect(signup).not.toHaveBeenCalled();
  });

  it('shows a validation error for an invalid name without calling signup', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('이메일'), 'user@example.com');
    await user.type(screen.getByLabelText('비밀번호 (영문·숫자 포함 8자 이상)'), 'password1');
    await user.click(screen.getByRole('button', { name: '가입하기' }));

    expect(
      await screen.findByText('이름은 1자 이상 30자 이하로 입력해주세요.'),
    ).toBeInTheDocument();
    expect(signup).not.toHaveBeenCalled();
  });

  it('calls signup with the entered values when everything is valid', async () => {
    vi.mocked(signup).mockResolvedValue({
      id: '1',
      email: 'user@example.com',
      name: '홍길동',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('이메일'), 'user@example.com');
    await user.type(screen.getByLabelText('비밀번호 (영문·숫자 포함 8자 이상)'), 'password1');
    await user.type(screen.getByLabelText('이름'), '홍길동');
    await user.click(screen.getByRole('button', { name: '가입하기' }));

    await waitFor(() =>
      expect(signup).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password1',
        name: '홍길동',
      }),
    );
  });

  it('shows a success message and calls onSuccess when signup resolves', async () => {
    vi.mocked(signup).mockResolvedValue({
      id: '1',
      email: 'user@example.com',
      name: '홍길동',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    renderForm(onSuccess);

    await user.type(screen.getByLabelText('이메일'), 'user@example.com');
    await user.type(screen.getByLabelText('비밀번호 (영문·숫자 포함 8자 이상)'), 'password1');
    await user.type(screen.getByLabelText('이름'), '홍길동');
    await user.click(screen.getByRole('button', { name: '가입하기' }));

    expect(await screen.findByText('가입이 완료되었습니다. 로그인해주세요.')).toBeInTheDocument();
    expect(onSuccess).toHaveBeenCalled();
  });

  it('shows the server error message when signup rejects with a duplicate-email error', async () => {
    vi.mocked(signup).mockRejectedValue(new Error('이미 가입된 이메일입니다.'));
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('이메일'), 'user@example.com');
    await user.type(screen.getByLabelText('비밀번호 (영문·숫자 포함 8자 이상)'), 'password1');
    await user.type(screen.getByLabelText('이름'), '홍길동');
    await user.click(screen.getByRole('button', { name: '가입하기' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('이미 가입된 이메일입니다.');
  });
});
