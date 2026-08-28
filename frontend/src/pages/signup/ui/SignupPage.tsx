import { Link, useNavigate } from 'react-router-dom';
import { SignupForm } from '../../../features/auth-signup';
import { useLocale } from '../../../shared/config';
import './SignupPage.css';

export function SignupPage() {
  const navigate = useNavigate();
  const { t } = useLocale();
  return (
    <div className="auth-page">
      <div className="auth-page__card">
        <h1>{t('signup.title')}</h1>
        <SignupForm onSuccess={() => navigate('/login')} />
        <p className="auth-page__switch">
          {t('signup.haveAccount')} <Link to="/login">{t('signup.loginLink')}</Link>
        </p>
      </div>
    </div>
  );
}
