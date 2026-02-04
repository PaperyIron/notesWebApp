import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import SignupForm from '../components/SignupForm';

function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleSuccess = (userData) => {
    console.log('User logged in:', userData);
    navigate('/dashboard');
  };

  return (
    <div>
      <div>
        <h1>Notes</h1>
      </div>

      <div>
        <button onClick={() => setIsLogin(true)}>
          Sign In
        </button>
        <button onClick={() => setIsLogin(false)}>
          Sign Up
        </button>
      </div>

      <div>
        {isLogin ? (
          <LoginForm onSuccess={handleSuccess} />
        ) : (
          <SignupForm onSuccess={handleSuccess} />
        )}
      </div>

      <div>
        {isLogin ? (
          <p>
            Don't have an account?{' '}
            <button onClick={() => setIsLogin(false)}>
              Create one
            </button>
          </p>
        ) : (
          <p>
            Already have an account?{' '}
            <button onClick={() => setIsLogin(true)}>
              Sign in
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

export default LoginPage;