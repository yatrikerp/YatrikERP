import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaGoogle, FaUserTie, FaUserShield, FaUserCog, FaUserAlt } from 'react-icons/fa';
import Logo from '../components/Logo';

const roles = [
  { key: 'passenger', label: 'Passenger', icon: <FaUserAlt className="text-blue-600 h-5 w-5" />, color: 'border-blue-600' },
  { key: 'depot', label: 'Depot Manager', icon: <FaUserCog className="text-green-600 h-5 w-5" />, color: 'border-green-600' },
  { key: 'admin', label: 'Admin', icon: <FaUserShield className="text-purple-600 h-5 w-5" />, color: 'border-purple-600' },
  { key: 'crew', label: 'Crew', icon: <FaUserTie className="text-orange-600 h-5 w-5" />, color: 'border-orange-600' },
];

const rolePlaceholders = {
  passenger: 'Passenger Login',
  depot: 'Depot Manager Login',
  admin: 'Admin Login',
  crew: 'Crew Login',
};

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('passenger');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('token', 'sample-token-12345');
      localStorage.setItem('user', JSON.stringify({ email: formData.email, role }));
      navigate('/dashboard');
    }, 1000);
  };

  const handleGoogleSignIn = () => {
    // Google Sign-in logic here
    console.log('Google Sign-in clicked');
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <div className="card flex-row" style={{ maxWidth: '900px', width: '100%', overflow: 'hidden', padding: 0 }}>
        {/* Left: Logo and Role Selection */}
        <div className="flex-col flex-center" style={{ flex: 1, borderRight: '1px solid var(--color-border)', padding: '2.5rem 1.5rem', background: 'var(--color-bg)' }}>
          <Logo size="default" className="mb-6" />
          <div style={{ width: '100%' }}>
            <div className="title text-center mb-4" style={{ fontSize: '1.25rem' }}>Login as</div>
            <div className="flex-col" style={{ gap: '0.75rem', display: 'flex' }}>
              {roles.map(r => (
                <button
                  key={r.key}
                  className={`btn btn-secondary ${role === r.key ? 'active' : ''}`}
                  style={{ borderColor: role === r.key ? 'var(--color-primary)' : 'var(--color-border)', background: role === r.key ? 'var(--color-card-hover)' : '#fff', color: 'var(--color-text)' }}
                  onClick={() => setRole(r.key)}
                  type="button"
                >
                  {r.icon}
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Right: Login Form */}
        <div className="flex-col flex-center" style={{ flex: 1, padding: '2.5rem 2.5rem', background: 'var(--color-bg)' }}>
          <div className="mb-6 text-center">
            <div className="title mb-1" style={{ fontSize: '1.3rem' }}>{rolePlaceholders[role]}</div>
            <div className="subtitle">Sign in to your {roles.find(r => r.key === role).label} account</div>
          </div>
          {error && (
            <div className="alert mb-4">
              <p className="font-medium">{error}</p>
            </div>
          )}
          <button
            onClick={handleGoogleSignIn}
            className="btn btn-secondary mb-4"
            style={{ width: '100%', marginBottom: '1em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5em' }}
            type="button"
          >
            <FaGoogle style={{ color: '#dc3545' }} />
            Sign in with Google
          </button>
          <div className="relative mb-4" style={{ position: 'relative', width: '100%' }}>
            <div style={{ borderTop: '1px solid var(--color-border)', width: '100%' }}></div>
            <div className="text-center" style={{ position: 'absolute', left: 0, right: 0, top: '-0.7em', background: 'var(--color-bg)', color: 'var(--color-text-secondary)', fontSize: '0.85em' }}>or</div>
          </div>
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <input
              className="input"
              id="email"
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              className="input"
              id="password"
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button
              className="btn"
              type="submit"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div className="text-center mt-6">
            <p className="text-secondary" style={{ fontSize: '0.95em' }}>
              Don&apos;t have an account?{' '}
              <Link to="/register" style={{ color: 'var(--color-primary)', textDecoration: 'underline', fontWeight: 500 }}>
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;