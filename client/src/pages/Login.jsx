import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaGoogle, FaShieldAlt } from 'react-icons/fa';
import Logo from '../components/Logo';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      setTimeout(() => {
        localStorage.setItem('token', 'sample-token-12345');
        localStorage.setItem('user', JSON.stringify({ email: formData.email }));
        navigate('/dashboard');
      }, 1000);
    } catch (err) {
      setError('Invalid email or password');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    console.log('Google Sign-in clicked');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-white relative overflow-hidden px-4">
      {/* Glowing background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-transparent to-cyan-100/20"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-200/10 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 p-6">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <Logo size="default" />
            </div>
            <h2 className="text-sm text-gray-600 font-medium">Staff Login</h2>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
              <p className="font-medium">{error}</p>
            </div>
          )}
          
          {/* Google Sign-in Button */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-white border-2 border-gray-300 text-gray-700 font-semibold py-2 px-3 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 mb-4 shadow-sm text-sm"
          >
            <FaGoogle className="h-4 w-4 text-red-500" />
            Sign in with Google
          </button>
          
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-gray-400 text-sm" />
              </div>
              <input
                className="pl-8 w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
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
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-400 text-sm" />
              </div>
              <input
                className="pl-8 w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                id="password"
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <input 
                  id="remember" 
                  type="checkbox" 
                  className="h-3 w-3 text-blue-500 focus:ring-blue-500 border-gray-300 rounded bg-white"
                />
                <label htmlFor="remember" className="ml-2 block text-gray-600">
                  Remember me
                </label>
              </div>
              <div>
                <a href="#" className="text-blue-500 hover:text-blue-600 font-medium">
                  Forgot password?
                </a>
              </div>
            </div>
            
            <button
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg flex items-center justify-center transition-all duration-200 text-sm"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : 'Sign In'}
            </button>
          </form>
          
          <div className="text-center mt-6">
            <p className="text-gray-600 text-xs">
              For passengers, go to{' '}
              <Link to="/" className="text-blue-500 hover:text-blue-600 font-medium">
                main page
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;