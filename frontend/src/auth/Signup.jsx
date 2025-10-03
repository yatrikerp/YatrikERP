import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'passenger'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Email validation states
  const [emailStatus, setEmailStatus] = useState('idle'); // 'idle', 'checking', 'available', 'exists', 'error'
  const [emailMessage, setEmailMessage] = useState('');
  
  const { signup } = useAuth();
  const navigate = useNavigate();
  const emailTimeoutRef = useRef(null);

  // Email validation function
  const validateEmail = async (email) => {
    console.log('🔍 validateEmail called with:', email);
    
    if (!email || email.length < 5) {
      console.log('❌ Email too short or empty');
      setEmailStatus('idle');
      setEmailMessage('');
      return;
    }

    // Basic email validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format');
      setEmailStatus('error');
      setEmailMessage('Invalid email format');
      return;
    }

    console.log('✅ Email validation passed, proceeding with API call');
    setEmailStatus('checking');
    setEmailMessage('Checking email...');

    try {
      console.log('📡 Making API call to /api/auth/check-email via apiFetch');
      const res = await apiFetch('/api/auth/check-email', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      if (!res.ok) {
        throw new Error(res.message || `HTTP error! status: ${res.status}`);
      }

      const data = res.data || {};
      console.log('📦 Response data:', data);
      const success = data.success ?? true;
      const exists = data.exists ?? data.data?.exists ?? false;
      
      if (success) {
        if (exists) {
          console.log('❌ Email exists');
          setEmailStatus('exists');
          setEmailMessage('❌ Email already exists');
        } else {
          console.log('✅ Email available');
          setEmailStatus('available');
          setEmailMessage('✅ Email available');
        }
      } else {
        console.log('❌ API returned error:', data.error);
        setEmailStatus('error');
        setEmailMessage(data.error || 'Error checking email');
      }
    } catch (error) {
      console.error('❌ Email validation error:', error);
      setEmailStatus('error');
      setEmailMessage(`Network error: ${error.message}`);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    console.log('📝 Form field changed:', name, '=', value);
    
    setFormData({
      ...formData,
      [name]: value
    });
    setError(''); // Clear error when user types

    // Handle email validation with debouncing
    if (name === 'email') {
      console.log('📧 Email field changed, setting up validation timeout');
      
      // Clear previous timeout
      if (emailTimeoutRef.current) {
        clearTimeout(emailTimeoutRef.current);
        console.log('⏰ Cleared previous timeout');
      }

      // Set new timeout for email validation
      emailTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Timeout triggered, calling validateEmail');
        validateEmail(value);
      }, 300); // 300ms delay to avoid too many API calls
      
      console.log('⏰ New timeout set for 300ms');
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (emailTimeoutRef.current) {
        clearTimeout(emailTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    // Check if email is available
    if (emailStatus === 'exists') {
      setError('Email already exists. Please use a different email.');
      setIsLoading(false);
      return;
    }

    try {
      await signup(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Compute disabled state for other fields
  const otherDisabled = emailStatus !== 'available';

  // Get border color based on email status
  const getEmailBorderColor = () => {
    switch (emailStatus) {
      case 'available':
        return 'border-green-500 focus:ring-green-500';
      case 'exists':
        return 'border-red-500 focus:ring-red-500';
      case 'error':
        return 'border-red-500 focus:ring-red-500';
      case 'checking':
        return 'border-blue-500 focus:ring-blue-500';
      default:
        return 'border-gray-300 focus:ring-blue-500';
    }
  };

  // Get text color for email message
  const getEmailMessageColor = () => {
    switch (emailStatus) {
      case 'available':
        return 'text-green-600';
      case 'exists':
        return 'text-red-600';
      case 'error':
        return 'text-red-600';
      case 'checking':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Account
          </h1>
          <p className="text-gray-600">
            Join Yatrik for seamless bus travel experience
          </p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={otherDisabled}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${getEmailBorderColor()}`}
                  placeholder="Enter your email address"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {emailStatus === 'checking' && (
                    <Loader2 size={20} className="text-blue-500 animate-spin" />
                  )}
                  {emailStatus === 'available' && (
                    <CheckCircle size={20} className="text-green-500" />
                  )}
                  {emailStatus === 'exists' && (
                    <XCircle size={20} className="text-red-500" />
                  )}
                  {emailStatus === 'error' && (
                    <XCircle size={20} className="text-red-500" />
                  )}
                </div>
              </div>
              {emailMessage && (
                <div className={`mt-2 text-sm ${getEmailMessageColor()}`}>
                  {emailMessage}
                </div>
              )}
              {/* Temporary test button */}
              <button
                type="button"
                onClick={() => {
                  console.log('🧪 Manual test triggered');
                  validateEmail(formData.email);
                }}
                className="mt-2 px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Test Email Validation
              </button>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                disabled={otherDisabled}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter your mobile number"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Account Type
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={otherDisabled}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="passenger">Passenger</option>
                <option value="driver">Driver</option>
                <option value="conductor">Conductor</option>
                <option value="depot_manager">Depot Manager</option>
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={otherDisabled}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors pr-12"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={otherDisabled}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors pr-12"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || otherDisabled || emailStatus === 'checking'}
              className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:from-red-600 hover:to-pink-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-red-600 hover:text-red-700 font-medium hover:underline transition-colors"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;