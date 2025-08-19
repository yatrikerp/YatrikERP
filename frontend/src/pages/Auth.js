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
  
  // Loading states for instant feedback
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  
  // Form validation states
  const [loginErrors, setLoginErrors] = useState({});
  const [signupErrors, setSignupErrors] = useState({});
  
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

  // Fetch authoritative profile after login to ensure role/depotId are present
  const fetchProfileAndLogin = async (userFromLogin, token) => {
    const me = await apiFetch('/api/auth/me');
    let finalUser = userFromLogin;
    if (me.ok && me.data) {
      // Prefer server profile if available
      finalUser = me.data.data?.user || me.data.user || me.data;
    }
    login(finalUser, token);
    const role = (finalUser.role || 'passenger').toUpperCase();
    const dest = role === 'ADMIN' ? '/admin' : role === 'CONDUCTOR' ? '/conductor' : role === 'DRIVER' ? '/driver' : role === 'DEPOT_MANAGER' ? '/depot' : redirectTo;
    console.log('[Auth] post-login profile role redirect:', { role, dest });
    // Navigate after state updates propagate a tick
    setTimeout(() => navigate(dest, { replace: true }), 0);
  };

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

  const title = 'Yatrik Account';
  const subtitle = isLogin ? (
    <span>New here? <button type="button" onClick={() => setMode('signup')} className="font-medium text-primary-600 hover:text-primary-500 transition-colors" disabled={isLoggingIn || isSigningUp}>Create an account</button></span>
  ) : (
    <span>Already with us? <button type="button" onClick={() => setMode('login')} className="font-medium text-primary-600 hover:text-primary-500 transition-colors" disabled={isLoggingIn || isSigningUp}>Sign in</button></span>
  );

  return (
    <AuthLayout title={title} subtitle={subtitle}>
      <div className="fade-in">
        {/* Tabs */}
        <div className="mb-6 grid grid-cols-2 rounded-lg border border-gray-200 overflow-hidden">
          <button type="button" onClick={() => setMode('login')} className={`py-2.5 text-sm font-medium transition-all duration-200 ${isLogin ? 'bg-primary-50 text-primary-700' : 'bg-white text-neutral-600 hover:bg-gray-50'}`} disabled={isLoggingIn || isSigningUp}>Sign in</button>
          <button type="button" onClick={() => setMode('signup')} className={`py-2.5 text-sm font-medium transition-all duration-200 ${!isLogin ? 'bg-primary-50 text-primary-700' : 'bg-white text-neutral-600 hover:bg-gray-50'}`} disabled={isLoggingIn || isSigningUp}>Create account</button>
        </div>

        {isLogin ? (
          <div>
            <form className="space-y-6 login-form-compact" onSubmit={onSubmitLogin}>
              <InputField id="email" label="Email address" type="email" autoComplete="email" value={loginForm.email} onChange={(e) => handleLoginChange('email', e.target.value)} error={loginErrors.email} disabled={isLoggingIn} />
              <PasswordField id="password" label="Password" autoComplete="current-password" value={loginForm.password} onChange={(e) => handleLoginChange('password', e.target.value)} error={loginErrors.password} disabled={isLoggingIn} />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-neutral-600"><input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" /> Remember me</label>
                <Link to="#" className="text-sm font-medium text-primary-600 hover:text-primary-500">Forgot password?</Link>
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
                  href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/google?next=${encodeURIComponent(redirectTo)}`} 
                  ariaLabel="Sign in with Google" 
                  icon={<FaGoogle className="text-red-500" />}
                  disabled={isLoggingIn || isSigningUp}
                >
                  Sign in with Google
                </OAuthButton>
              </div>
            </div>
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
                    href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/google?next=${encodeURIComponent(redirectTo)}&mode=signup`} 
                    ariaLabel="Sign up with Google" 
                    icon={<FaGoogle className="text-red-500" />}
                    className="py-2"
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


