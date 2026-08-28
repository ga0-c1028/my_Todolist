import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppHeader } from './AppHeader';

vi.mock('../../../entities/user', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../../features/auth-logout', () => ({
  useLogout: vi.fn(),
}));

import { useAuthStore } from '../../../entities/user';
import { useLogout } from '../../../features/auth-logout';

const fakeUser = {
  id: 'u1',
  name: '홍길동',
  email: 'a@b.com',
  createdAt: '',
  updatedAt: '',
};

function renderHeader(initialEntries: string[] = ['/todos']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AppHeader />
    </MemoryRouter>,
  );
}

describe('AppHeader', () => {
  const mutate = vi.fn();

  beforeEach(() => {
    vi.mocked(useAuthStore).mockImplementation(((selector: (state: { user: typeof fakeUser; isAuthenticated: boolean }) => unknown) =>
      selector({ user: fakeUser, isAuthenticated: true })) as typeof useAuthStore);
    vi.mocked(useLogout).mockReturnValue({ mutate, isPending: false } as unknown as ReturnType<typeof useLogout>);
  });

  it('renders the brand and nav links with correct targets', () => {
    renderHeader();
    expect(screen.getAllByText('my_Todolist')[0]).toBeInTheDocument();

    expect(screen.getByRole('link', { name: '할일 목록' })).toHaveAttribute('href', '/todos');
    expect(screen.getByRole('link', { name: '카테고리 관리' })).toHaveAttribute('href', '/categories');
    expect(screen.getByRole('link', { name: '회원 정보' })).toHaveAttribute('href', '/profile');
  });

  it('marks the current nav link as active', () => {
    renderHeader(['/todos']);
    expect(screen.getByRole('link', { name: '할일 목록' })).toHaveClass('app-header__nav-link--active');
    expect(screen.getByRole('link', { name: '카테고리 관리' })).not.toHaveClass('app-header__nav-link--active');
    expect(screen.getByRole('link', { name: '회원 정보' })).not.toHaveClass('app-header__nav-link--active');
  });

  it("renders the user's name", () => {
    renderHeader();
    expect(screen.getAllByText(/홍길동/)[0]).toBeInTheDocument();
  });

  it('toggles the desktop dropdown when the user trigger is clicked', async () => {
    const user = userEvent.setup();
    renderHeader();

    expect(screen.queryByText('회원 정보 수정')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '홍길동 ▾' }));
    expect(screen.getByText('회원 정보 수정')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '홍길동 ▾' }));
    expect(screen.queryByText('회원 정보 수정')).not.toBeInTheDocument();
  });

  it('calls mutate when 로그아웃 is clicked in the desktop dropdown', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole('button', { name: '홍길동 ▾' }));
    await user.click(screen.getByRole('button', { name: '로그아웃' }));

    expect(mutate).toHaveBeenCalled();
  });

  it('opens the mobile overlay with all 4 items when the hamburger is clicked', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole('button', { name: '메뉴 열기' }));

    expect(screen.getAllByText('할일 목록').length).toBeGreaterThan(0);
    expect(screen.getAllByText('카테고리 관리').length).toBeGreaterThan(0);
    expect(screen.getAllByText('회원 정보').length).toBeGreaterThan(0);
    expect(screen.getAllByText('로그아웃').length).toBeGreaterThan(0);
  });

  it('closes the mobile overlay when a Link item is clicked', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole('button', { name: '메뉴 열기' }));
    expect(screen.getAllByText('카테고리 관리')).toHaveLength(2);

    const links = screen.getAllByText('할일 목록');
    await user.click(links[links.length - 1]);

    expect(screen.getAllByText('카테고리 관리')).toHaveLength(1);
  });

  it('calls mutate and closes the overlay when 로그아웃 is clicked in the mobile overlay', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole('button', { name: '메뉴 열기' }));
    const logoutButtons = screen.getAllByText('로그아웃');
    await user.click(logoutButtons[logoutButtons.length - 1]);

    expect(mutate).toHaveBeenCalled();
    expect(screen.queryByText('회원 정보 수정')).not.toBeInTheDocument();
  });
});
