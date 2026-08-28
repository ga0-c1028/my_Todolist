import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LoginForm } from '../../../features/auth-login';
import { useLocale } from '../../../shared/config';
import './LoginPage.css';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLocale();
  const from = (location.state as { from?: string } | null)?.from ?? '/todos';
  return (
    <div className="auth-page">
      <div className="auth-page__card">
        <h1>{t('login.title')}</h1>
        <LoginForm onSuccess={() => navigate(from, { replace: true })} />
        <p className="auth-page__switch">
          {t('login.noAccount')} <Link to="/signup">{t('login.signupLink')}</Link>
        </p>
      </div>
    </div>
  );
}
