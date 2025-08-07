import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaEnvelope, FaUserPlus, FaUserTie, FaUserShield, FaUserCog, FaUserAlt, FaGoogle } from 'react-icons/fa';
import Logo from '../components/Logo';

const roles = [
  { key: 'passenger', label: 'Passenger', icon: <FaUserAlt className="text-blue-600 h-5 w-5" />, color: 'border-blue-600' },
  { key: 'depot', label: 'Depot Manager', icon: <FaUserCog className="text-green-600 h-5 w-5" />, color: 'border-green-600' },
  { key: 'admin', label: 'Admin', icon: <FaUserShield className="text-purple-600 h-5 w-5" />, color: 'border-purple-600' },
  { key: 'crew', label: 'Crew', icon: <FaUserTie className="text-orange-600 h-5 w-5" />, color: 'border-orange-600' },
];

const rolePlaceholders = {
  passenger: 'Passenger Registration',
  depot: 'Depot Manager Registration',
  admin: 'Admin Registration',
  crew: 'Crew Registration',
};

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
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
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      navigate('/login');
    }, 1000);
  };

  const handleGoogleSignIn = () => {
    // Google Sign-in logic here
    console.log('Google Sign-in clicked');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-4xl mx-auto flex shadow-lg rounded-2xl overflow-hidden border border-gray-100">
        {/* Left: Logo and Role Selection */}
        <div className="w-1/2 bg-white flex flex-col items-center justify-center p-8 border-r border-gray-100">
          <Logo size="default" className="mb-8" />
          <div className="w-full">
            <div className="text-lg font-bold text-gray-900 mb-4 text-center">Register as</div>
            <div className="flex flex-col gap-3">
              {roles.map(r => (
                <button
                  key={r.key}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg border-2 ${role === r.key ? r.color + ' bg-gray-50' : 'border-gray-200'} transition font-medium text-gray-800 w-full justify-center focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  onClick={() => setRole(r.key)}
                >
                  {r.icon}
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Right: Register Form */}
        <div className="w-1/2 bg-white flex flex-col justify-center p-10">
          <div className="mb-6 text-center">
            <div className="text-xl font-bold text-gray-900 mb-1">{rolePlaceholders[role]}</div>
            <div className="text-sm text-gray-500">Create your {roles.find(r => r.key === role).label} account</div>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
              <p className="font-medium">{error}</p>
            </div>
          )}
          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-white border-2 border-gray-200 text-gray-700 font-semibold py-2 px-3 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 mb-4 shadow-sm text-sm"
          >
            <FaGoogle className="h-4 w-4 text-red-500" />
            Sign up with Google
          </button>
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-gray-400">or</span>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                id="name"
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="relative">
              <input
                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                id="email"
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="relative">
              <input
                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                id="password"
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
              />
            </div>
            <div className="relative">
              <input
                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength="6"
              />
            </div>
            <div className="flex items-center">
              <input 
                id="terms" 
                type="checkbox" 
                className="h-3 w-3 text-blue-500 focus:ring-blue-500 border-gray-300 rounded bg-white"
                required
              />
              <label htmlFor="terms" className="ml-2 block text-xs text-gray-600">
                I agree to the <a href="#" className="text-blue-500 hover:text-blue-600">Terms</a> and <a href="#" className="text-blue-500 hover:text-blue-600">Privacy</a>
              </label>
            </div>
            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 text-sm"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : <><FaUserPlus className="mr-2 h-4 w-4" /> Create Account</>}
            </button>
          </form>
          <div className="text-center mt-6">
            <p className="text-gray-600 text-xs">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;