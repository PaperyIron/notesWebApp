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
    <div className="login-page">
      {/* Main container */}
      <div className="login-container">
        
        {/* Header */}
        <div className="login-header">
          <h1>NoteTaker</h1>
          <p>Simple Notes</p>
        </div>

        {/* Tab buttons */}
        <div className="login-tabs">
          <button
            onClick={() => setIsLogin(true)}
            className={`login-tab ${isLogin ? 'active' : ''}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`login-tab ${!isLogin ? 'active' : ''}`}
          >
            Sign Up
          </button>
        </div>

        {/* Form area */}
        <div className="login-form-area">
          {isLogin ? (
            <LoginForm onSuccess={handleSuccess} />
          ) : (
            <SignupForm onSuccess={handleSuccess} />
          )}
        </div>

        {/* Footer */}
        <div className="login-footer">
          {isLogin ? (
            <span>
              Don't have an account?{' '}
              <button onClick={() => setIsLogin(false)}>
                Create one
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button onClick={() => setIsLogin(true)}>
                Sign in
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;