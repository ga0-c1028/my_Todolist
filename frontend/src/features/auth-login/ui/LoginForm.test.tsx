import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { LoginForm } from './LoginForm';

vi.mock('../../../entities/user', () => ({
  login: vi.fn(),
  useAuthStore: vi.fn(),
}));

import { login, useAuthStore } from '../../../entities/user';

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
  return render(<LoginForm onSuccess={onSuccess} />, { wrapper: Wrapper });
}

describe('LoginForm', () => {
  const authLogin = vi.fn();

  beforeEach(() => {
    vi.mocked(useAuthStore).mockImplementation(((selector: (state: { login: typeof authLogin }) => unknown) =>
      selector({ login: authLogin })) as typeof useAuthStore);
  });

  it('renders email/password inputs and a submit button', () => {
    renderForm();
    expect(screen.getByLabelText('이메일')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  });

  it('does not call login when fields are empty', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: '로그인' }));

    expect(await screen.findByText('이메일과 비밀번호를 모두 입력해주세요.')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('calls login with the entered values when both fields are filled', async () => {
    vi.mocked(login).mockResolvedValue({
      user: {
        id: '1',
        email: 'user@example.com',
        name: '홍길동',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      accessToken: 'at1',
      refreshToken: 'rt1',
    });
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('이메일'), 'user@example.com');
    await user.type(screen.getByLabelText('비밀번호'), 'password1');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({ email: 'user@example.com', password: 'password1' }),
    );
  });

  it('calls onSuccess when login resolves', async () => {
    vi.mocked(login).mockResolvedValue({
      user: {
        id: '1',
        email: 'user@example.com',
        name: '홍길동',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      accessToken: 'at1',
      refreshToken: 'rt1',
    });
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    renderForm(onSuccess);

    await user.type(screen.getByLabelText('이메일'), 'user@example.com');
    await user.type(screen.getByLabelText('비밀번호'), 'password1');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it('shows the unified error message when login is rejected, regardless of the underlying cause', async () => {
    vi.mocked(login).mockRejectedValue(new Error('이메일 또는 비밀번호가 올바르지 않습니다.'));
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('이메일'), 'user@example.com');
    await user.type(screen.getByLabelText('비밀번호'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    expect(
      await screen.findByText('이메일 또는 비밀번호가 올바르지 않습니다.'),
    ).toBeInTheDocument();
  });
});
