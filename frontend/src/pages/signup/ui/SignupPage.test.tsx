import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SignupPage } from './SignupPage';

vi.mock('../../../entities/user', () => ({
  signup: vi.fn(),
}));

import { signup } from '../../../entities/user';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<div data-testid="login-page" />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SignupPage', () => {
  it('renders the heading and signup form fields', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: '회원가입' })).toBeInTheDocument();
    expect(screen.getByLabelText('이메일')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호 (영문·숫자 포함 8자 이상)')).toBeInTheDocument();
    expect(screen.getByLabelText('이름')).toBeInTheDocument();
  });

  it('renders a link to /login', () => {
    renderPage();
    const link = screen.getByRole('link', { name: '로그인' });
    expect(link).toHaveAttribute('href', '/login');
  });

  it('navigates to /login after a successful signup', async () => {
    vi.mocked(signup).mockResolvedValue({
      id: '1',
      email: 'user@example.com',
      name: '홍길동',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('이메일'), 'user@example.com');
    await user.type(screen.getByLabelText('비밀번호 (영문·숫자 포함 8자 이상)'), 'password1');
    await user.type(screen.getByLabelText('이름'), '홍길동');
    await user.click(screen.getByRole('button', { name: '가입하기' }));

    await waitFor(() => expect(screen.getByTestId('login-page')).toBeInTheDocument());
  });
});
