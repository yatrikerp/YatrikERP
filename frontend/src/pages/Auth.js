import React, { useState, useEffect, useCallback } from 'react';
import AuthLayout from '../components/Auth/AuthLayout';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaGoogle } from 'react-icons/fa';
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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  // Optimized login flow - no extra API calls for depot users
  const fetchProfileAndLogin = async (userFromLogin, token) => {
    try {
      // Ensure subsequent requests include Authorization header
      try { localStorage.setItem('token', token); } catch {}

      const email = (userFromLogin?.email || '').toLowerCase();
      const role = (userFromLogin?.role || '').toLowerCase();
      const isDepot = role === 'depot_manager' || /-depot@yatrik\.com$/.test(email) || /^depot-/.test(email);

      // For depot users, use the login response directly (no extra API call)
      let finalUser = userFromLogin;
      
      // Only fetch profile for non-depot users (passengers, admin, etc.)
      if (!isDepot) {
        const me = await apiFetch('/api/auth/me');
        if (me?.ok && me.data) {
          finalUser = me.data.data?.user || me.data.user || me.data;
        }
      }

      // Ensure the user object has the required fields for AuthContext.login
      if (!finalUser || typeof finalUser !== 'object') {
        finalUser = userFromLogin;
      }

      // Normalize the user object to match what AuthContext.login expects
      const normalizedUser = {
        ...finalUser,
        _id: finalUser._id || finalUser.id, // Handle both _id and id
        role: finalUser.role || role || 'passenger',
        email: finalUser.email || email,
        name: finalUser.name || finalUser.username || 'User'
      };

      // Validate that we have the minimum required fields
      if (!normalizedUser._id || !normalizedUser.role) {
        console.warn('Missing required user fields, using fallback:', normalizedUser);
        normalizedUser._id = normalizedUser._id || 'temp_' + Date.now();
        normalizedUser.role = normalizedUser.role || 'passenger';
      }

      login(normalizedUser, token);
    } catch (err) {
      console.warn('Profile fetch failed, using login data:', err);
      // If profile fails, normalize and proceed with login payload
      const fallbackUser = {
        ...userFromLogin,
        _id: userFromLogin._id || userFromLogin.id || 'temp_' + Date.now(),
        role: userFromLogin.role || 'passenger',
        email: userFromLogin.email || '',
        name: userFromLogin.name || userFromLogin.username || 'User'
      };
      login(fallbackUser, token);
    }
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

  // Preload authentication endpoints for instant performance
  useEffect(() => {
    const preloadAuthEndpoints = () => {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      // Preload Google OAuth
      const googleOAuthUrl = `${baseUrl}/api/auth/google?next=${encodeURIComponent(redirectTo)}`;
      const googleLink = document.createElement('link');
      googleLink.rel = 'prefetch';
      googleLink.href = googleOAuthUrl;
      document.head.appendChild(googleLink);
      
      // Preload depot authentication endpoint
      const depotAuthUrl = `${baseUrl}/api/depot-auth/login`;
      const depotLink = document.createElement('link');
      depotLink.rel = 'prefetch';
      depotLink.href = depotAuthUrl;
      document.head.appendChild(depotLink);
      
      // Preload regular authentication endpoint
      const authUrl = `${baseUrl}/api/auth/login`;
      const authLink = document.createElement('link');
      authLink.rel = 'prefetch';
      authLink.href = authUrl;
      document.head.appendChild(authLink);
      
      // Preload the callback route
      const callbackLink = document.createElement('link');
      callbackLink.rel = 'prefetch';
      callbackLink.href = '/oauth/callback';
      document.head.appendChild(callbackLink);
    };

    // Preload after a short delay to not block initial render
    const timer = setTimeout(preloadAuthEndpoints, 500);
    return () => clearTimeout(timer);
  }, [redirectTo]);



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
    
    // Immediate UI feedback
    setIsLoggingIn(true);
    toast.success('Signing in...', { duration: 1000 });
    
    try {
      const email = loginForm.email.trim().toLowerCase();
      // Accept both patterns: code-depot@yatrik.com or depot-code@yatrik.com
      const isDepotEmail = /^([a-z0-9]+-depot|depot-[a-z0-9]+)@yatrik\.com$/i.test(email);
      const url = isDepotEmail ? '/api/depot-auth/login' : '/api/auth/login';
      const body = isDepotEmail
        ? { username: email, password: loginForm.password }
        : { email, password: loginForm.password };

      console.log('[Auth] Login attempt:', { email, isDepotEmail, url, body });

      const res = await apiFetch(url, { method: 'POST', body: JSON.stringify(body) });
      console.log('[Auth] Login response:', res);
      
      if (!res.ok) { 
        console.error('[Auth] Login failed:', res.message);
        toast.error(res.message || 'Login failed'); 
        return; 
      }

      // Support both generic and depot-auth response shapes
      const user = res.data?.user || res.data?.data?.user;
      const token = res.data?.token || res.data?.data?.token;
      console.log('[Auth] Extracted user and token:', { user, token });
      
      if (user && token) {
        // Immediate login without waiting for profile fetch
        await fetchProfileAndLogin(user, token);
      } else {
        console.error('[Auth] Invalid response structure:', res.data);
        toast.error('Invalid response from server');
      }
    } catch (error) {
      console.error('[Auth] Login error:', error);
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

  // Forgot password handler
  const onSubmitForgotPassword = async (e) => {
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
  ) : (
    <span>Already with us? <button type="button" onClick={() => setMode('login')} className="font-medium text-primary-600 hover:text-primary-500 transition-colors" disabled={isLoggingIn || isSigningUp}>Sign in</button></span>
  );

  return (
    <AuthLayout title={title} subtitle={subtitle}>
      <div className="fade-in">
        {/* Tabs */}
        <div className="mb-6 grid grid-cols-2 rounded-lg border border-gray-200 overflow-hidden">
          <button type="button" onClick={() => setMode('login')} className={`py-2.5 text-sm font-medium transition-all duration-200 ${mode === 'login' ? 'bg-primary-50 text-primary-700' : 'bg-white text-neutral-600 hover:bg-gray-50'}`} disabled={isLoggingIn || isSigningUp}>Sign in</button>
          <button type="button" onClick={() => setMode('signup')} className={`py-2.5 text-sm font-medium transition-all duration-200 ${mode === 'signup' ? 'bg-primary-50 text-primary-700' : 'bg-white text-neutral-600 hover:bg-gray-50'}`} disabled={isLoggingIn || isSigningUp}>Create account</button>
        </div>

        {mode === 'login' ? (
          <div>
            {!showForgotPassword ? (
              <>
                <form className="space-y-6 login-form-compact" onSubmit={onSubmitLogin}>
                  <InputField id="email" label="Email address" type="email" autoComplete="email" value={loginForm.email} onChange={(e) => handleLoginChange('email', e.target.value)} error={loginErrors.email} disabled={isLoggingIn} />
                  <PasswordField id="password" label="Password" autoComplete="current-password" value={loginForm.password} onChange={(e) => handleLoginChange('password', e.target.value)} error={loginErrors.password} disabled={isLoggingIn} />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-neutral-600"><input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" /> Remember me</label>
                    <button type="button" onClick={() => setShowForgotPassword(true)} className="text-sm font-medium text-primary-600 hover:text-primary-500">Forgot password?</button>
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
                    <OAuthButton 
                      href={`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/auth/google?next=${encodeURIComponent(redirectTo)}`} 
                      ariaLabel="Sign in with Google" 
                      icon={<FaGoogle className="text-red-500" />}
                      disabled={isLoggingIn || isSigningUp}
                      className="transform hover:scale-105 active:scale-95 transition-transform duration-100"
                    >
                      Sign in with Google
                    </OAuthButton>
                  </div>
                </div>
              </>
            ) : (
              <div>
                {!forgotPasswordSuccess ? (
                  <form className="space-y-6" onSubmit={onSubmitForgotPassword}>
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
                    
                    <div className="flex gap-3">
                      <button 
                        type="button" 
                        onClick={() => setShowForgotPassword(false)}
                        className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Back to Sign in
                      </button>
                      <button type="submit" className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200" disabled={isResettingPassword}>
                        {isResettingPassword ? (
                          <div className="flex items-center justify-center space-x-2">
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
                        setShowForgotPassword(false);
                        setForgotPasswordSuccess(false);
                        setForgotPasswordForm({ email: '' });
                      }}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                    >
                      Back to Sign in
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
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
                  <OAuthButton 
                    href={`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/auth/google?next=${encodeURIComponent(redirectTo)}&mode=signup`} 
                    ariaLabel="Sign up with Google" 
                    icon={<FaGoogle className="text-red-500" />}
                    className="py-2 transform hover:scale-105 active:scale-95 transition-transform duration-100"
                    disabled={isLoggingIn || isSigningUp}
                  >
                    Sign up with Google
                  </OAuthButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default Auth;





