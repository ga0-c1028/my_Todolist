import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from './LoginPage';

vi.mock('../../../entities/user', () => ({
  login: vi.fn(),
  useAuthStore: vi.fn(),
}));

import { login, useAuthStore } from '../../../entities/user';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<div data-testid="signup-page" />} />
          <Route path="/todos" element={<div data-testid="todos-page" />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LoginPage', () => {
  const authLogin = vi.fn();

  beforeEach(() => {
    vi.mocked(useAuthStore).mockImplementation(((selector: (state: { login: typeof authLogin }) => unknown) =>
      selector({ login: authLogin })) as typeof useAuthStore);
  });

  it('renders the heading and login form fields', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument();
    expect(screen.getByLabelText('이메일')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
  });

  it('renders a link to /signup', () => {
    renderPage();
    const link = screen.getByRole('link', { name: '회원가입' });
    expect(link).toHaveAttribute('href', '/signup');
  });

  it('navigates to /todos after a successful login', async () => {
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
    renderPage();

    await user.type(screen.getByLabelText('이메일'), 'user@example.com');
    await user.type(screen.getByLabelText('비밀번호'), 'password1');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => expect(screen.getByTestId('todos-page')).toBeInTheDocument());
  });

  it('shows an error and stays on /login when login is rejected', async () => {
    vi.mocked(login).mockRejectedValue(new Error('이메일 또는 비밀번호가 올바르지 않습니다.'));
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('이메일'), 'user@example.com');
    await user.type(screen.getByLabelText('비밀번호'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    expect(
      await screen.findByText('이메일 또는 비밀번호가 올바르지 않습니다.'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('todos-page')).not.toBeInTheDocument();
  });
});
