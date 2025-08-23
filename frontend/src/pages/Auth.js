import React, { useState, useEffect, useCallback } from 'react';
import AuthLayout from '../components/Auth/AuthLayout';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FaGoogle, FaTwitter } from 'react-icons/fa';
import { SiMicrosoft } from 'react-icons/si';
import InputField from '../components/Common/InputField';
import PasswordField from '../components/Common/PasswordField';
import OAuthButton from '../components/Common/OAuthButton';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Auth = ({ initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode === 'signup' ? 'signup' : 'login');
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('next') || '/pax';
  
  // Form states with immediate validation
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [forgotPasswordForm, setForgotPasswordForm] = useState({ email: '' });
  
  // Loading states for instant feedback
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  // Form validation states
  const [loginErrors, setLoginErrors] = useState({});
  const [signupErrors, setSignupErrors] = useState({});
  const [forgotPasswordErrors, setForgotPasswordErrors] = useState({});
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  
  // Fetch authoritative profile after login to ensure role/depotId are present
  const fetchProfileAndLogin = async (userFromLogin, token) => {
    const me = await apiFetch('/api/auth/me');
    let finalUser = userFromLogin;
    if (me.ok && me.data) {
      // Prefer server profile if available
      finalUser = me.data.data?.user || me.data.user || me.data;
    }
    login(finalUser, token);
    // Don't navigate here - let the useEffect handle it
  };

  // Navigate after successful login/signup
  useEffect(() => {
    if (user) {
      const role = (user.role || 'passenger').toUpperCase();
      const dest = role === 'ADMIN' ? '/admin' : 
                   role === 'CONDUCTOR' ? '/conductor' : 
                   role === 'DRIVER' ? '/driver' : 
                   role === 'DEPOT_MANAGER' ? '/depot' : 
                   redirectTo;
      console.log('[Auth] existing session redirect:', { role, dest });
      navigate(dest, { replace: true });
    }
  }, [user, navigate, redirectTo]);

  const isLogin = mode === 'login';

  // Comprehensive form validation
  const validateLoginForm = useCallback(() => {
    const errors = {};
    if (!loginForm.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginForm.email.trim())) errors.email = 'Please enter a valid email address';
    if (!loginForm.password) errors.password = 'Password is required';
    else if (loginForm.password.length < 6) errors.password = 'Password must be at least 6 characters';
    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  }, [loginForm]);

  const validateSignupForm = useCallback(() => {
    const errors = {};
    if (!signupForm.name.trim()) errors.name = 'Full name is required';
    else if (signupForm.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
    else if (!/^[a-zA-Z\s]+$/.test(signupForm.name.trim())) errors.name = 'Name can only contain letters and spaces';
    if (!signupForm.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupForm.email.trim())) errors.email = 'Please enter a valid email address';
    if (!signupForm.phone.trim()) errors.phone = 'Phone number is required';
    else if (!/^[\+]?[^\s]{7,16}$/.test(signupForm.phone.trim())) errors.phone = 'Please enter a valid phone number';
    if (!signupForm.password) errors.password = 'Password is required';
    else if (signupForm.password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (!signupForm.confirmPassword) errors.confirmPassword = 'Please confirm your password';
    else if (signupForm.password !== signupForm.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setSignupErrors(errors);
    return Object.keys(errors).length === 0;
  }, [signupForm]);

  const validateForgotPasswordForm = useCallback(() => {
    const errors = {};
    if (!forgotPasswordForm.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotPasswordForm.email.trim())) errors.email = 'Please enter a valid email address';
    setForgotPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  }, [forgotPasswordForm]);

  // Fast login with immediate UI feedback
  const onSubmitLogin = async (e) => {
    e.preventDefault();
    if (!validateLoginForm()) return;
    setIsLoggingIn(true);
    try {
      const res = await apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(loginForm) });
      if (!res.ok) { toast.error(res.message || 'Login failed'); return; }
      const user = res.data.data?.user || res.data.user;
      const token = res.data.data?.token || res.data.token;
      if (user && token) {
        toast.success('Signing in...');
        await fetchProfileAndLogin(user, token);
      } else {
        toast.error('Invalid response from server');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Fast signup with immediate UI feedback
  const onSubmitSignup = async (e) => {
    e.preventDefault();
    if (!validateSignupForm()) return;
    setIsSigningUp(true);
    try {
      const payload = { name: signupForm.name, email: signupForm.email, phone: signupForm.phone, password: signupForm.password };
      const res = await apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
      if (!res.ok) { toast.error(res.message || 'Registration failed'); return; }
      const user = res.data.data?.user || res.data.user;
      const token = res.data.data?.token || res.data.token;
      if (user && token) {
        toast.success('Account created successfully!');
        await fetchProfileAndLogin(user, token);
      } else {
        toast.error('Invalid response from server');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsSigningUp(false);
    }
  };

  // Optimized form change handlers
  const handleLoginChange = useCallback((field, value) => {
    setLoginForm(prev => ({ ...prev, [field]: value }));
    if (loginErrors[field]) setLoginErrors(prev => ({ ...prev, [field]: '' }));
    if (field === 'email' && value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) setLoginErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    if (field === 'password' && value && value.length < 6) setLoginErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters' }));
  }, [loginErrors]);

  const handleSignupChange = useCallback((field, value) => {
    setSignupForm(prev => ({ ...prev, [field]: value }));
    if (signupErrors[field]) setSignupErrors(prev => ({ ...prev, [field]: '' }));
  }, [signupErrors]);

  const handleForgotPasswordChange = useCallback((field, value) => {
    setForgotPasswordForm(prev => ({ ...prev, [field]: value }));
    if (forgotPasswordErrors[field]) setForgotPasswordErrors(prev => ({ ...prev, [field]: '' }));
  }, [forgotPasswordErrors]);

  const title = 'Yatrik Account';
  const subtitle = mode === 'login' ? (
    <span>New here? <button type="button" onClick={() => setMode('signup')} className="font-medium text-primary-600 hover:text-primary-500 transition-colors" disabled={isLoggingIn || isSigningUp}>Create an account</button></span>
  ) : mode === 'signup' ? (
    <span>Already with us? <button type="button" onClick={() => setMode('login')} className="font-medium text-primary-600 hover:text-primary-500 transition-colors" disabled={isLoggingIn || isSigningUp}>Sign in</button></span>
  ) : (
    <span>Remember your password? <button type="button" onClick={() => setMode('login')} className="font-medium text-primary-600 hover:text-primary-500 transition-colors" disabled={isResettingPassword}>Sign in</button></span>
  );

  return (
    <AuthLayout title={title} subtitle={subtitle}>
      <div className="fade-in">
        {/* Tabs */}
        <div className="mb-6 grid grid-cols-3 rounded-lg border border-gray-200 overflow-hidden">
          <button type="button" onClick={() => setMode('login')} className={`py-2.5 text-sm font-medium transition-all duration-200 ${mode === 'login' ? 'bg-primary-50 text-primary-700' : 'bg-white text-neutral-600 hover:bg-gray-50'}`} disabled={isLoggingIn || isSigningUp || isResettingPassword}>Sign in</button>
          <button type="button" onClick={() => setMode('signup')} className={`py-2.5 text-sm font-medium transition-all duration-200 ${mode === 'signup' ? 'bg-primary-50 text-primary-700' : 'bg-white text-neutral-600 hover:bg-gray-50'}`} disabled={isLoggingIn || isSigningUp || isResettingPassword}>Create account</button>
          <button type="button" onClick={() => setMode('forgot')} className={`py-2.5 text-sm font-medium transition-all duration-200 ${mode === 'forgot' ? 'bg-primary-50 text-primary-700' : 'bg-white text-neutral-600 hover:bg-gray-50'}`} disabled={isLoggingIn || isSigningUp || isResettingPassword}>Forgot Password</button>
        </div>

        {mode === 'login' ? (
          <div>
            <form className="space-y-6 login-form-compact" onSubmit={onSubmitLogin}>
              <InputField id="email" label="Email address" type="email" autoComplete="email" value={loginForm.email} onChange={(e) => handleLoginChange('email', e.target.value)} error={loginErrors.email} disabled={isLoggingIn} />
              <PasswordField id="password" label="Password" autoComplete="current-password" value={loginForm.password} onChange={(e) => handleLoginChange('password', e.target.value)} error={loginErrors.password} disabled={isLoggingIn} />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-neutral-600"><input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" /> Remember me</label>
                <button type="button" onClick={() => setMode('forgot')} className="text-sm font-medium text-primary-600 hover:text-primary-500">Forgot password?</button>
              </div>
              <div>
                <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 btn-transition login-form-compact" disabled={isLoggingIn}>
                  {isLoggingIn ? (<div className="flex items-center space-x-2"><LoadingSpinner size="sm" color="white" /><span>Signing in...</span></div>) : ('Sign in')}
                </button>
              </div>
            </form>
            
            <div className="mt-6 login-form-compact">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>
              <div className="mt-6">
                <div className="text-center mb-3">
                  <p className="text-sm text-gray-600 mb-1">Quick sign-in for passengers</p>
                  <p className="text-xs text-gray-500">Staff members: Use email/password above</p>
                </div>
                <OAuthButton 
                  href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/google?next=${encodeURIComponent(redirectTo)}`} 
                  ariaLabel="Sign in with Google" 
                  icon={<FaGoogle className="text-red-500" />}
                  disabled={isLoggingIn || isSigningUp}
                >
                  Sign in with Google
                </OAuthButton>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Google sign-in is available for passengers only
                </p>
              </div>
            </div>
          </div>
        ) : mode === 'signup' ? (
          <div>
            <div className="max-w-lg mx-auto">
              <form className="space-y-2 login-form-compact" onSubmit={onSubmitSignup}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InputField id="name" label="Full Name" type="text" autoComplete="name" value={signupForm.name} onChange={(e) => handleSignupChange('name', e.target.value)} error={signupErrors.name} disabled={isSigningUp} />
                  <InputField id="email" label="Email address" type="email" autoComplete="email" value={signupForm.email} onChange={(e) => handleSignupChange('email', e.target.value)} error={signupErrors.email} disabled={isSigningUp} />
                  <InputField id="phone" label="Phone Number" type="tel" autoComplete="tel" value={signupForm.phone} onChange={(e) => handleSignupChange('phone', e.target.value)} error={signupErrors.phone} disabled={isSigningUp} />
                  <PasswordField id="password" label="Password" autoComplete="new-password" value={signupForm.password} onChange={(e) => handleSignupChange('password', e.target.value)} error={signupErrors.password} disabled={isSigningUp} />
                </div>
                <PasswordField id="confirmPassword" label="Confirm Password" autoComplete="new-password" value={signupForm.confirmPassword} onChange={(e) => handleSignupChange('confirmPassword', e.target.value)} error={signupErrors.confirmPassword} disabled={isSigningUp} />
                <div>
                  <button type="submit" className="w-full flex justify-center py-1.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 btn-transition login-form-compact" disabled={isSigningUp}>
                    {isSigningUp ? (<div className="flex items-center space-x-2"><LoadingSpinner size="sm" color="white" /><span>Creating account...</span></div>) : ('Create Account')}
                  </button>
                </div>
              </form>
              
              <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="text-center mb-3">
                    <p className="text-sm text-gray-600 mb-1">Quick sign-up for passengers</p>
                    <p className="text-xs text-gray-500">Staff members: Use form above</p>
                  </div>
                  <OAuthButton 
                    href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/google?next=${encodeURIComponent(redirectTo)}&mode=signup`} 
                    ariaLabel="Sign up with Google" 
                    icon={<FaGoogle className="text-red-500" />}
                    className="py-2"
                    disabled={isLoggingIn || isSigningUp}
                  >
                    Sign up with Google (Passengers Only)
                  </OAuthButton>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Google sign-up is available for passengers only. Staff members must use email/password registration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : mode === 'forgot' ? (
          <div>
            <div className="max-w-lg mx-auto">
              {!forgotPasswordSuccess ? (
                <form className="space-y-6" onSubmit={async (e) => {
                  e.preventDefault();
                  if (!validateForgotPasswordForm()) return;
                  setIsResettingPassword(true);
                  try {
                    const res = await apiFetch('/api/auth/forgot-password', { 
                      method: 'POST', 
                      body: JSON.stringify({ email: forgotPasswordForm.email }) 
                    });
                    if (res.ok) {
                      setForgotPasswordSuccess(true);
                      toast.success('Password reset email sent! Check your inbox.');
                    } else {
                      toast.error(res.message || 'Failed to send reset email');
                    }
                  } catch (error) {
                    toast.error('Network error. Please try again.');
                  } finally {
                    setIsResettingPassword(false);
                  }
                }}>
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Reset your password</h3>
                    <p className="text-sm text-gray-600 mt-1">Enter your email address and we'll send you a link to reset your password.</p>
                  </div>
                  
                  <InputField 
                    id="email" 
                    label="Email address" 
                    type="email" 
                    autoComplete="email" 
                    value={forgotPasswordForm.email} 
                    onChange={(e) => handleForgotPasswordChange('email', e.target.value)} 
                    error={forgotPasswordErrors.email} 
                    disabled={isResettingPassword} 
                  />
                  
                  <div>
                    <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200" disabled={isResettingPassword}>
                      {isResettingPassword ? (
                        <div className="flex items-center space-x-2">
                          <LoadingSpinner size="sm" color="white" />
                          <span>Sending...</span>
                        </div>
                      ) : (
                        'Send reset link'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Check your email</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    We've sent a password reset link to <strong>{forgotPasswordForm.email}</strong>
                  </p>
                  <button 
                    type="button" 
                    onClick={() => {
                      setMode('login');
                      setForgotPasswordSuccess(false);
                      setForgotPasswordForm({ email: '' });
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                  >
                    Back to sign in
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </AuthLayout>
  );
};

export default Auth;


