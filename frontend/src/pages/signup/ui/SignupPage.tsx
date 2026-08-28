import { Link, useNavigate } from 'react-router-dom';
import { SignupForm } from '../../../features/auth-signup';
import './SignupPage.css';

export function SignupPage() {
  const navigate = useNavigate();
  return (
    <div className="auth-page">
      <div className="auth-page__card">
        <h1>회원가입</h1>
        <SignupForm onSuccess={() => navigate('/login')} />
        <p className="auth-page__switch">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  );
}
