import { useState } from 'react';

function SignupForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess(data);
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div>{error}</div>}

      <div>
        <label htmlFor="signup-username">Username</label>
        <input
          type="text"
          id="signup-username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Choose a username"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="signup-email">Email</label>
        <input
          type="email"
          id="signup-email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="signup-password">Password</label>
        <input
          type="password"
          id="signup-password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Create a password (min 8 chars)"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="signup-password-confirm">Confirm Password</label>
        <input
          type="password"
          id="signup-password-confirm"
          name="password_confirmation"
          value={formData.password_confirmation}
          onChange={handleChange}
          placeholder="Confirm your password"
          required
          disabled={isLoading}
        />
      </div>

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  );
}

export default SignupForm;