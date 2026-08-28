import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { RequireAuth } from './RequireAuth';

vi.mock('../../entities/user', () => ({
  useAuthStore: vi.fn(),
}));

import { useAuthStore } from '../../entities/user';

function LoginMarker() {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  return (
    <div data-testid="login-page">
      {from ?? ''}
    </div>
  );
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path={path}
          element={
            <RequireAuth>
              <div data-testid="protected-content">secret</div>
            </RequireAuth>
          }
        />
        <Route path="/login" element={<LoginMarker />} />
      </Routes>
    </MemoryRouter>,
  );
}

function mockAuthState(state: { isAuthenticated: boolean; hasHydrated: boolean }) {
  vi.mocked(useAuthStore).mockImplementation(((
    selector: (s: typeof state) => unknown,
  ) => selector(state)) as typeof useAuthStore);
}

describe('RequireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing while not hydrated, even if authenticated', () => {
    mockAuthState({ isAuthenticated: true, hasHydrated: false });
    renderAt('/todos');

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });

  it('renders nothing while not hydrated and not authenticated', () => {
    mockAuthState({ isAuthenticated: false, hasHydrated: false });
    renderAt('/todos');

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });

  it('redirects to /login when hydrated and not authenticated', () => {
    mockAuthState({ isAuthenticated: false, hasHydrated: true });
    renderAt('/todos');

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renders children when hydrated and authenticated', () => {
    mockAuthState({ isAuthenticated: true, hasHydrated: true });
    renderAt('/todos');

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('passes the current path as location.state.from on redirect', () => {
    mockAuthState({ isAuthenticated: false, hasHydrated: true });
    renderAt('/categories');

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.getByText('/categories')).toBeInTheDocument();
  });
});
