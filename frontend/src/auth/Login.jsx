import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import '../styles/login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'create'

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });
      if (!res.ok) {
        throw new Error(res.message || 'Login failed');
      }
      const user = res.data.data?.user || res.data.user;
      const token = res.data.data?.token || res.data.token;
      if (user && token) {
        login(user, token);
        navigate('/dashboard');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-wrap">
        <section className="login-left" aria-hidden="true">
          <div className="login-circle">
            <div className="login-route login-route--h">
              <div className="login-marker login-marker--left" />
              <div className="login-bus login-bus--h" />
              <div className="login-marker login-marker--right" />
            </div>
            <div className="login-route login-route--v">
              <div className="login-marker login-marker--top" />
              <div className="login-bus login-bus--v" />
              <div className="login-marker login-marker--bottom" />
            </div>
            <div className="login-letter-y" aria-label="Y">Y</div>
          </div>
        </section>

        <section className="login-right">
          <div className={`login-card ${activeTab === 'create' ? 'is-create' : ''}`} role="dialog" aria-label="Yatrik authentication">
            <header className="login-card__header">
              <h1 className="login-title">Yatrik Account</h1>
              <div className="login-tabs" role="tablist" aria-label="Authentication tabs">
                <button
                  role="tab"
                  aria-selected={activeTab === 'login'}
                  className={`login-tab ${activeTab === 'login' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('login')}
                >
                  Sign in
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === 'create'}
                  className={`login-tab ${activeTab === 'create' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('create')}
                >
                  Create account
                </button>
                <span className={`login-tabs__indicator ${activeTab === 'create' ? 'to-right' : ''}`} aria-hidden="true" />
              </div>
            </header>

            <div className="login-slider" aria-live="polite">
              <div className="login-slide">
                <form onSubmit={handleSubmit} className="login-form" autoComplete="on">
                  {error && (
                    <div className="login-alert" role="alert">{error}</div>
                  )}

                  <label htmlFor="email" className="login-label">Email address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="login-input"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="admin@yatrik.com"
                    required
                    aria-required="true"
                  />

                  <label htmlFor="password" className="login-label">Password</label>
                  <div className="login-password">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      className="login-input"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      aria-required="true"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="login-eye"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div className="login-row">
                    <label className="login-remember">
                      <input type="checkbox" />
                      <span>Remember me</span>
                    </label>
                    <Link to="/forgot-password" className="login-link">Forgot password?</Link>
                  </div>

                  <button type="submit" disabled={isLoading} className="login-btn login-btn--primary">
                    {isLoading ? 'Signing in…' : 'Sign in'}
                  </button>
                </form>

                <div className="login-divider-text" aria-hidden="true">or continue with</div>

                <button className="login-btn login-btn--google" aria-label="Continue with Google">
                  <svg className="login-g" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              </div>

              <div className="login-slide">
                <SignupForm onSuccess={() => navigate('/dashboard')} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;

// Subcomponent: SignupForm

function SignupForm({ onSuccess }) {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: formData.name, email: formData.email, phone: formData.phone, password: formData.password })
      });
      if (!res.ok) {
        throw new Error(res.message || 'Signup failed');
      }
      const user = res.data.data?.user || res.data.user;
      const token = res.data.data?.token || res.data.token;
      if (user && token) {
        login(user, token);
      }
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form" autoComplete="on">
      {error && <div className="login-alert" role="alert">{error}</div>}

      <label htmlFor="su-name" className="login-label">Full name</label>
      <input id="su-name" name="name" type="text" className="login-input" value={formData.name} onChange={handleChange} required />

      <label htmlFor="su-email" className="login-label">Email address</label>
      <input id="su-email" name="email" type="email" className="login-input" value={formData.email} onChange={handleChange} required />

      <label htmlFor="su-password" className="login-label">Password</label>
      <div className="login-password">
        <input id="su-password" name="password" type={showPassword ? 'text' : 'password'} className="login-input" value={formData.password} onChange={handleChange} required />
        <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} className="login-eye" onClick={() => setShowPassword(!showPassword)}>
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <label htmlFor="su-confirm" className="login-label">Confirm password</label>
      <div className="login-password">
        <input id="su-confirm" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} className="login-input" value={formData.confirmPassword} onChange={handleChange} required />
        <button type="button" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'} className="login-eye" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <button type="submit" disabled={isLoading} className="login-btn login-btn--primary">{isLoading ? 'Creating account…' : 'Create account'}</button>

      <div className="login-divider-text" aria-hidden="true">or continue with</div>
      <button className="login-btn login-btn--google" aria-label="Continue with Google">
        <svg className="login-g" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span>Sign up with Google</span>
      </button>
    </form>
  );
}
