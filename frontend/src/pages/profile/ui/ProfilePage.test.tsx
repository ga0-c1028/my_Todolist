import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ProfilePage } from './ProfilePage';

vi.mock('../../../entities/user', () => ({
  useAuthStore: vi.fn(),
  deleteMe: vi.fn(),
}));

vi.mock('../../../features/auth-logout', () => ({
  useLogout: vi.fn(),
}));

vi.mock('../../../features/profile-edit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../features/profile-edit')>();
  return { ...actual, useUpdateProfile: vi.fn(), useDeleteAccount: vi.fn() };
});

import { useAuthStore } from '../../../entities/user';
import { useLogout } from '../../../features/auth-logout';
import { useUpdateProfile, useDeleteAccount } from '../../../features/profile-edit';

const fakeUser = { id: 'u1', name: '홍길동', email: 'a@b.com', createdAt: '', updatedAt: '' };

function renderPage() {
  return render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>,
  );
}

describe('ProfilePage', () => {
  const mutate = vi.fn();
  const deleteMutate = vi.fn();

  beforeEach(() => {
    mutate.mockClear();
    deleteMutate.mockClear();
    vi.mocked(useAuthStore).mockImplementation(((selector: (state: { user: typeof fakeUser; isAuthenticated: boolean }) => unknown) =>
      selector({ user: fakeUser, isAuthenticated: true })) as typeof useAuthStore);
    vi.mocked(useLogout).mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useLogout>);
    vi.mocked(useUpdateProfile).mockReturnValue({
      mutate,
      isPending: false,
      isSuccess: false,
      error: null,
    } as unknown as ReturnType<typeof useUpdateProfile>);
    vi.mocked(useDeleteAccount).mockReturnValue({
      mutate: deleteMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteAccount>);
  });

  it('renders the heading and the profile form fields pre-filled with the user data', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: '회원 정보 수정' })).toBeInTheDocument();
    expect(screen.getByLabelText('이메일')).toHaveValue('a@b.com');
    expect(screen.getByLabelText('이름')).toHaveValue('홍길동');
  });

  it('calls mutate with the expected payload when the form is submitted', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.clear(screen.getByLabelText('이름'));
    await user.type(screen.getByLabelText('이름'), '새이름');
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(mutate).toHaveBeenCalledWith({ name: '새이름' });
  });

  it('clicking 회원 탈퇴 opens a confirmation dialog without calling the delete mutation', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '회원 탈퇴' }));

    expect(screen.getByText('정말 탈퇴하시겠어요?')).toBeInTheDocument();
    expect(deleteMutate).not.toHaveBeenCalled();
  });

  it('confirming the dialog calls the delete mutation and closes the dialog', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '회원 탈퇴' }));
    await user.click(screen.getByRole('button', { name: '탈퇴' }));

    expect(deleteMutate).toHaveBeenCalled();
    expect(screen.queryByText('정말 탈퇴하시겠어요?')).not.toBeInTheDocument();
  });

  it('cancelling the dialog does not call the delete mutation and closes the dialog', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '회원 탈퇴' }));
    await user.click(screen.getByRole('button', { name: '취소' }));

    expect(deleteMutate).not.toHaveBeenCalled();
    expect(screen.queryByText('정말 탈퇴하시겠어요?')).not.toBeInTheDocument();
  });
});
