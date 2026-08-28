import { useState, type JSX } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../../entities/user';
import { useLogout } from '../../../features/auth-logout';
import { getEnv } from '../../../shared/config';
import './AppHeader.css';

const NAV_ITEMS = [
  { label: '할일 목록', to: '/todos' },
  { label: '카테고리 관리', to: '/categories' },
  { label: '회원 정보', to: '/profile' },
];

export function AppHeader(): JSX.Element {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userName = useAuthStore((state) => state.user)?.name ?? '';
  const logout = useLogout();

  const handleLogout = () => {
    if (getEnv().isDev) console.log('[app-header] 로그아웃 클릭');
    logout.mutate();
  };

  return (
    <header className="app-header">
      <div className="app-header__desktop">
        <Link to="/todos" className="app-header__brand">
          my_Todolist
        </Link>
        <nav className="app-header__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                'app-header__nav-link' + (isActive ? ' app-header__nav-link--active' : '')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="app-header__user">
          <button
            type="button"
            className="app-header__user-button"
            onClick={() => setUserMenuOpen((open) => !open)}
          >
            {userName} ▾
          </button>
          {userMenuOpen && (
            <div className="app-header__dropdown">
              <Link
                to="/profile"
                className="app-header__dropdown-item"
                onClick={() => setUserMenuOpen(false)}
              >
                회원 정보 수정
              </Link>
              <button
                type="button"
                className="app-header__dropdown-item"
                onClick={handleLogout}
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="app-header__mobile">
        <button
          type="button"
          className="app-header__hamburger"
          aria-label="메뉴 열기"
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          ≡
        </button>
        <Link to="/todos" className="app-header__brand">
          my_Todolist
        </Link>
        <span className="app-header__user-indicator">{userName}</span>
      </div>

      {mobileMenuOpen && (
        <div className="app-header__mobile-overlay">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="app-header__mobile-item"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            className="app-header__mobile-item"
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
          >
            로그아웃
          </button>
        </div>
      )}
    </header>
  );
}
