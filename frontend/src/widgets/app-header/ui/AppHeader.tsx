import { useState, type JSX } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../../entities/user';
import { useLogout } from '../../../features/auth-logout';
import { getEnv, useLocale, useTheme, SUPPORTED_LOCALES, type Locale } from '../../../shared/config';
import './AppHeader.css';

export function AppHeader(): JSX.Element {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userName = useAuthStore((state) => state.user)?.name ?? '';
  const logout = useLogout();
  const { locale, setLocale, messages, t } = useLocale();
  const { theme, toggleTheme } = useTheme();

  const NAV_ITEMS = [
    { label: t('header.navTodos'), to: '/todos' },
    { label: t('header.navCategories'), to: '/categories' },
    { label: t('header.navProfile'), to: '/profile' },
  ];

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
        <select
          className="app-header__locale-select"
          aria-label="language"
          value={locale}
          onChange={(event) => setLocale(event.target.value as Locale)}
        >
          {SUPPORTED_LOCALES.map((code) => (
            <option key={code} value={code}>
              {messages.locale[code]}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="app-header__theme-toggle"
          aria-label={theme === 'light' ? t('theme.toDark') : t('theme.toLight')}
          onClick={toggleTheme}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
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
                {t('header.editProfile')}
              </Link>
              <button
                type="button"
                className="app-header__dropdown-item"
                onClick={handleLogout}
              >
                {t('header.logout')}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="app-header__mobile">
        <button
          type="button"
          className="app-header__hamburger"
          aria-label={t('header.menuOpen')}
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
          <div className="app-header__mobile-item app-header__mobile-controls">
            <select
              className="app-header__locale-select"
              aria-label="language"
              value={locale}
              onChange={(event) => setLocale(event.target.value as Locale)}
            >
              {SUPPORTED_LOCALES.map((code) => (
                <option key={code} value={code}>
                  {messages.locale[code]}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="app-header__theme-toggle"
              aria-label={theme === 'light' ? t('theme.toDark') : t('theme.toLight')}
              onClick={toggleTheme}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
          <button
            type="button"
            className="app-header__mobile-item"
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
          >
            {t('header.logout')}
          </button>
        </div>
      )}
    </header>
  );
}
