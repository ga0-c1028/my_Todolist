import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LoginForm } from '../../../features/auth-login';
import './LoginPage.css';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/todos';
  return (
    <div className="auth-page">
      <div className="auth-page__card">
        <h1>로그인</h1>
        <LoginForm onSuccess={() => navigate(from, { replace: true })} />
        <p className="auth-page__switch">
          계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </p>
      </div>
    </div>
  );
}
