import React, { useState, useEffect, useCallback, useRef } from 'react';
import AuthLayout from '../components/Auth/AuthLayout';
import MobileAuthLayout from '../components/Auth/MobileAuthLayout';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaGoogle } from 'react-icons/fa';
import InputField from '../components/Common/InputField';
import PasswordField from '../components/Common/PasswordField';
import OAuthButton from '../components/Common/OAuthButton';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import useMobileDetection from '../hooks/useMobileDetection';
import toast from 'react-hot-toast';

const Auth = ({ initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode === 'signup' ? 'signup' : 'login');
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('next') || '/pax';
  const { isMobile } = useMobileDetection();
  
  // Form states with immediate validation
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [forgotPasswordForm, setForgotPasswordForm] = useState({ email: '' });
  const [signupType, setSignupType] = useState('passenger'); // 'passenger', 'vendor', 'student'
  
  // Vendor registration form - email will auto-append @vendor.com
  const [vendorForm, setVendorForm] = useState({ companyName: '', email: '@vendor.com', password: '', panNumber: '', phone: '', companyType: 'other' });
  const [vendorErrors, setVendorErrors] = useState({});
  const [isRegisteringVendor, setIsRegisteringVendor] = useState(false);
  
  // Student registration form
  const [studentForm, setStudentForm] = useState({ name: '', email: '', phone: '', password: '', aadhaarNumber: '', dateOfBirth: '', institution: { name: '', type: 'other' }, passType: 'student_concession' });
  const [studentErrors, setStudentErrors] = useState({});
  const [isRegisteringStudent, setIsRegisteringStudent] = useState(false);
  
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
  
  // Email validation states
  const [emailStatus, setEmailStatus] = useState('idle'); // 'idle', 'checking', 'available', 'exists', 'error'
  const [emailMessage, setEmailMessage] = useState('');
  const emailTimeoutRef = useRef(null);

  // Disable all non-email fields until email is confirmed available
  const otherDisabled = emailStatus !== 'available';

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
  
  // Optimized login flow - no extra API calls for depot users
  const fetchProfileAndLogin = async (userFromLogin, token) => {
    try {
      // Ensure subsequent requests include Authorization header
      try { localStorage.setItem('token', token); } catch {}

      const email = (userFromLogin?.email || '').toLowerCase();
      const role = (userFromLogin?.role || '').toLowerCase();
      const roleType = userFromLogin?.roleType || 'internal';
      const isDepot = role === 'depot_manager' || /-depot@yatrik\.com$/.test(email) || /^depot-/.test(email);
      const isVendor = role === 'vendor' || (roleType === 'external' && role === 'vendor');
      const isStudent = role === 'student' || (roleType === 'external' && role === 'student');

      // For depot users, vendors, and students, use the login response directly (no extra API call)
      // The login response already contains all necessary user data
      let finalUser = userFromLogin;
      
      // Only fetch profile for regular users (passengers, admin, etc.) - skip for vendors/students
      if (!isDepot && !isVendor && !isStudent) {
        try {
          const me = await apiFetch('/api/auth/me', {
            suppressError: true,
            suppressLogout: true
          });
          if (me?.ok && me.data) {
            finalUser = me.data.data?.user || me.data.user || me.data;
          }
        } catch (error) {
          console.warn('[Auth] /api/auth/me failed, using login response:', error);
          // Continue with userFromLogin if /me fails
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
      // Check for pending booking from popular routes
      const pendingBooking = localStorage.getItem('pendingBooking');
      const returnUrl = searchParams.get('return');
      const nextUrl = searchParams.get('next');
      const authRedirectPath = sessionStorage.getItem('authRedirectPath');
      
      // If passenger with pending booking, redirect to booking choice
      if (pendingBooking && (user.role || 'passenger').toUpperCase() === 'PASSENGER') {
        console.log('[Auth] Found pending booking, redirecting to booking-choice');
        try {
          const bookingContext = JSON.parse(pendingBooking);
          navigate('/booking-choice', { 
            replace: true,
            state: { bookingContext }
          });
          sessionStorage.removeItem('authRedirectPath');
          return;
        } catch (e) {
          console.error('Error parsing pending booking:', e);
          localStorage.removeItem('pendingBooking');
        }
      }
      
      // If there's a return URL
      if (returnUrl) {
        console.log('[Auth] Using return URL:', returnUrl);
        navigate(returnUrl, { replace: true });
        sessionStorage.removeItem('authRedirectPath');
        return;
      }

      // If there's an explicit next URL (from protected admin pages)
      if (nextUrl) {
        console.log('[Auth] Using next URL:', nextUrl);
        navigate(nextUrl, { replace: true });
        sessionStorage.removeItem('authRedirectPath');
        return;
      }
      
      // If backend provided a redirect path, use it
      if (authRedirectPath) {
        console.log('[Auth] Using backend redirect path:', authRedirectPath);
        navigate(authRedirectPath, { replace: true });
        sessionStorage.removeItem('authRedirectPath');
        return;
      }
      
      // Auto-redirect based on role and roleType
      const role = (user.role || 'passenger').toLowerCase();
      const roleType = user.roleType || 'internal';
      
      let dest = redirectTo;
      
      // Internal users → /dashboard/{role}
      if (roleType === 'internal') {
        if (role === 'admin') dest = '/admin';
        else if (role === 'depot_manager') dest = '/depot';
        else if (role === 'conductor') dest = '/conductor';
        else if (role === 'driver') dest = '/driver';
        else dest = `/dashboard/${role}`;
      } 
      // External users → specific routes
      else {
        if (role === 'vendor') dest = '/vendor/dashboard';
        else if (role === 'student') dest = '/student/dashboard';
        else dest = '/passenger/dashboard';
      }
      
      console.log('[Auth] Auto-redirect:', { role, roleType, dest });
      navigate(dest, { replace: true });
    }
  }, [user, navigate, redirectTo, searchParams]);

  // Preload authentication endpoints for instant performance
  useEffect(() => {
    const preloadAuthEndpoints = () => {
      // Preload the callback route (frontend route) - this is safe to prefetch
      const callbackLink = document.createElement('link');
      callbackLink.rel = 'prefetch';
      callbackLink.href = '/oauth/callback';
      document.head.appendChild(callbackLink);
    };

    // Preload after a short delay to not block initial render
    const timer = setTimeout(preloadAuthEndpoints, 500);
    return () => clearTimeout(timer);
  }, [redirectTo]);



  // Comprehensive form validation - supports email, phone, or aadhaar
  const validateLoginForm = useCallback(() => {
    const errors = {};
    const identifier = loginForm.email.trim();
    
    if (!identifier) {
      errors.email = 'Email, Phone, or Aadhaar is required';
    } else {
      // Accept email, phone (10 digits), or aadhaar (12 digits)
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      const isPhone = /^[0-9]{10}$/.test(identifier);
      const isAadhaar = /^[0-9]{12}$/.test(identifier);
      
      if (!isEmail && !isPhone && !isAadhaar) {
        errors.email = 'Please enter a valid Email, Phone (10 digits), or Aadhaar (12 digits)';
      }
    }
    
    if (!loginForm.password) errors.password = 'Password is required';
    else if (loginForm.password.length < 8) errors.password = 'Password must be at least 8 characters';
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
    if (!signupForm.phone.trim()) errors.phone = 'Mobile number is required';
    else if (!/^[6-9][0-9]{9}$/.test(signupForm.phone.trim())) errors.phone = 'Enter valid 10-digit Indian mobile number';
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
      const identifierRaw = loginForm.email.trim();
      const email = identifierRaw.toLowerCase();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const isPhone = /^[0-9]{10}$/.test(identifierRaw);
      const isAadhaar = /^[0-9]{12}$/.test(identifierRaw);
      
      // Use login endpoint - auto-detects role (supports vendors and students)
      const loginUrl = '/api/auth/login';
      let body = {};
      
      if (isEmail) {
        body = { email, password: loginForm.password };
      } else if (isPhone) {
        body = { email: identifierRaw, password: loginForm.password }; // Use email field for phone
      } else if (isAadhaar) {
        body = { email: identifierRaw, password: loginForm.password }; // Use email field for Aadhaar
      } else {
        // Fallback to email format
        body = { email: identifierRaw, password: loginForm.password };
      }
      
      console.log('[Auth] Login attempt:', { identifierRaw, email, isEmail, isPhone, isAadhaar, loginUrl });

      const res = await apiFetch(loginUrl, { method: 'POST', body: JSON.stringify(body) });

      console.log('[Auth] Login response:', res);
      
      // apiFetch returns { ok: boolean, data: {...}, message: string }
      if (!res.ok) { 
        console.error('[Auth] Login failed:', res.message || res.data?.message);
        toast.error(res.message || res.data?.message || 'Login failed'); 
        setIsLoggingIn(false);
        return; 
      }

      // Unified login response structure
      // Response from backend: { success: true, token, user, redirectPath }
      let user = res.data?.user;
      let token = res.data?.token;
      let redirectPath = res.data?.redirectPath;
      
      // Handle vendor login response structure (vendor field as fallback)
      if (!user && res.data?.vendor) {
        const v = res.data.vendor;
        user = {
          _id: v._id || v.id,
          name: v.companyName || v.name,
          email: v.email || '',
          phone: v.phone,
          role: 'vendor',
          roleType: 'external',
          status: v.status,
          vendorId: v._id || v.id,
          companyName: v.companyName
        };
        token = res.data.token || token;
        redirectPath = res.data.redirectPath || '/vendor/dashboard';
      }
      
      if (!user || !token) {
        console.error('[Auth] Login response missing user or token:', { user, token, data: res.data });
        toast.error('Invalid response from server');
        setIsLoggingIn(false);
        return;
      }

      // Driver shape: { data: { token, driver: { ... } } }
      if (!user && res.data?.data?.driver) {
        const d = res.data.data.driver;
        user = {
          _id: d.id || d._id,
          name: d.name,
          email: d.email || '',
          role: 'driver',
          depotId: d.depotId,
          currentDuty: d.currentDuty
        };
        token = res.data.data.token;
      }

      // Conductor shape: { data: { token, conductor: { ... } } }
      if (!user && res.data?.data?.conductor) {
        const c = res.data.data.conductor;
        user = {
          _id: c.id || c._id,
          name: c.name,
          email: c.email || '',
          role: 'conductor',
          depotId: c.depotId,
          currentDuty: c.currentDuty
        };
        token = res.data.data.token;
      }

      // Handle vendor response structure if needed
      if (!user && res.data?.data?.vendor) {
        const v = res.data.data.vendor;
        user = {
          _id: v.id || v._id,
          name: v.companyName || v.name,
          email: v.email || '',
          phone: v.phone,
          role: 'vendor',
          roleType: 'external',
          status: v.status,
          vendorId: v._id || v.id,
          companyName: v.companyName
        };
        token = res.data.data.token || token;
      }

      // Ensure user has role (unified login should always provide it)
      if (user && !user.role) {
        user.role = 'passenger'; // Default fallback
      }

      // Ensure vendor users have vendorId set and roleType
      if (user && user.role === 'vendor') {
        if (!user.vendorId && user._id) {
          user.vendorId = user._id;
        }
        if (!user.roleType) {
          user.roleType = 'external';
        }
        // Ensure redirectPath is set for vendors if not already set
        if (!redirectPath) {
          redirectPath = '/vendor/dashboard';
        }
      }

      // Ensure student users have studentId set and roleType
      if (user && (user.role === 'student' || user.role === 'STUDENT')) {
        // Normalize role to lowercase
        user.role = 'student';
        if (!user.studentId && user._id) {
          user.studentId = user._id;
        }
        if (!user.roleType) {
          user.roleType = 'external';
        }
        // Ensure redirectPath is set for students if not already set
        if (!redirectPath) {
          redirectPath = '/student/dashboard';
        }
      }

      console.log('[Auth] Extracted user and token:', { user, token, redirectPath });
      
      if (user && token) {
        // Store redirect path if provided by backend
        if (redirectPath) {
          sessionStorage.setItem('authRedirectPath', redirectPath);
        }
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
      const payload = { name: signupForm.name, email: signupForm.email, phone: '+91' + signupForm.phone, password: signupForm.password, role: 'passenger' };
      const res = await apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
      if (!res.ok) {
        const msg = res.message || res.data?.message;
        const firstError = Array.isArray(res.data?.errors) && res.data.errors.length > 0 ? (res.data.errors[0]?.msg || res.data.errors[0]?.message) : undefined;
        const details = res.data?.details || res.data?.error;
        const finalMsg = msg || firstError || details || 'Registration failed';
        toast.error(finalMsg);
        return;
      }
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

  // Vendor email validation timeout ref
  const vendorEmailTimeoutRef = useRef(null);
  const [vendorEmailStatus, setVendorEmailStatus] = useState('idle'); // 'idle', 'checking', 'available', 'exists', 'error'
  const [vendorEmailMessage, setVendorEmailMessage] = useState('');

  // Check vendor email availability
  const checkVendorEmail = useCallback(async (email) => {
    // Normalize email - ensure it has @vendor.com
    let normalizedEmail = email.toLowerCase().trim();
    
    if (!normalizedEmail) {
      setVendorEmailStatus('idle');
      setVendorEmailMessage('');
      return;
    }

    // Auto-append @vendor.com if needed
    if (!normalizedEmail.includes('@')) {
      normalizedEmail = normalizedEmail + '@vendor.com';
    } else if (normalizedEmail.endsWith('@')) {
      normalizedEmail = normalizedEmail + 'vendor.com';
    } else if (!normalizedEmail.endsWith('@vendor.com') && normalizedEmail.includes('@')) {
      // If user typed a different domain, replace it with @vendor.com
      const emailParts = normalizedEmail.split('@');
      if (emailParts.length === 2) {
        normalizedEmail = emailParts[0] + '@vendor.com';
      }
    }

    // Validate email format - use same regex as backend (more lenient)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setVendorEmailStatus('idle');
      setVendorEmailMessage('');
      return; // Don't show error while typing
    }

    setVendorEmailStatus('checking');
    setVendorEmailMessage('Checking availability...');

    try {
      console.log('🔍 Checking email:', normalizedEmail);
      const response = await apiFetch('/api/auth/check-email', {
        method: 'POST',
        body: JSON.stringify({ email: normalizedEmail }),
        suppressError: true // Don't show global error toast for email checks
      });

      console.log('📧 Email check response:', response);

      // apiFetch returns { ok, status, data, message }
      if (!response.ok) {
        // 400 error means invalid format - just reset to idle
        if (response.status === 400) {
          console.warn('Email validation error (400):', response.data?.error);
          setVendorEmailStatus('idle');
          setVendorEmailMessage('');
        } else {
          setVendorEmailStatus('error');
          setVendorEmailMessage(response.message || 'Error checking email');
        }
        return;
      }

      // Success response
      const responseData = response.data;
      
      if (responseData && responseData.success !== undefined) {
        if (responseData.exists) {
          setVendorEmailStatus('exists');
          setVendorEmailMessage(responseData.message || 'Email already registered');
          setVendorErrors(prev => ({ ...prev, email: responseData.message || 'Email already registered' }));
        } else {
          setVendorEmailStatus('available');
          setVendorEmailMessage('Email is available');
          setVendorErrors(prev => ({ ...prev, email: '' }));
        }
      } else {
        setVendorEmailStatus('error');
        setVendorEmailMessage('Unexpected response format');
      }
    } catch (error) {
      console.error('Email check error:', error);
      setVendorEmailStatus('error');
      setVendorEmailMessage('Error checking email availability');
    }
  }, []);

  // Vendor form handlers
  const handleVendorChange = useCallback((field, value) => {
    if (field === 'email') {
      // Extract only the name part (before @) - remove any @vendor.com or other domain
      let namePart = value;
      
      // Remove @vendor.com if present
      if (namePart.includes('@')) {
        namePart = namePart.split('@')[0];
      }
      
      // Remove any special characters that shouldn't be in email name
      namePart = namePart.replace(/[^a-zA-Z0-9._-]/g, '');
      
      // Always append @vendor.com automatically
      const emailValue = namePart + '@vendor.com';

      setVendorForm(prev => ({ ...prev, [field]: emailValue }));
      
      // Clear previous timeout
      if (vendorEmailTimeoutRef.current) {
        clearTimeout(vendorEmailTimeoutRef.current);
      }

      // Clear error
      if (vendorErrors.email) {
        setVendorErrors(prev => ({ ...prev, email: '' }));
      }

      // Debounce email validation (only if name part is not empty)
      if (namePart.length > 0) {
        vendorEmailTimeoutRef.current = setTimeout(() => {
          checkVendorEmail(emailValue);
        }, 500);
      } else {
        setVendorEmailStatus('idle');
        setVendorEmailMessage('');
      }
    } else {
      setVendorForm(prev => ({ ...prev, [field]: value }));
      if (vendorErrors[field]) {
        setVendorErrors(prev => ({ ...prev, [field]: '' }));
      }
    }
  }, [vendorErrors, checkVendorEmail]);

  // Cleanup vendor email timeout on unmount
  useEffect(() => {
    return () => {
      if (vendorEmailTimeoutRef.current) {
        clearTimeout(vendorEmailTimeoutRef.current);
      }
    };
  }, []);

  // Student form handlers
  const handleStudentChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setStudentForm(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setStudentForm(prev => ({ ...prev, [field]: value }));
    }
    if (studentErrors[field]) {
      setStudentErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Vendor registration handler
  const onSubmitVendor = async (e) => {
    e.preventDefault();
    
    // Ensure email has @vendor.com domain
    let finalEmail = vendorForm.email.toLowerCase().trim();
    if (!finalEmail.includes('@')) {
      finalEmail = finalEmail + '@vendor.com';
    } else if (!finalEmail.endsWith('@vendor.com')) {
      // If user typed a different domain, replace it with @vendor.com
      const emailParts = finalEmail.split('@');
      if (emailParts.length === 2) {
        finalEmail = emailParts[0] + '@vendor.com';
      }
    }
    
    // Extract name part from email
    const emailNamePart = finalEmail.split('@')[0];
    
    // Validation
    const errors = {};
    if (!vendorForm.companyName.trim()) errors.companyName = 'Company name is required';
    
    // Email validation
    if (!emailNamePart || emailNamePart.trim() === '' || emailNamePart === '@vendor.com') {
      errors.email = 'Email name is required';
    } else if (!/^[a-zA-Z0-9._-]+$/.test(emailNamePart)) {
      errors.email = 'Email name can only contain letters, numbers, dots, hyphens, and underscores';
    } else if (!finalEmail.endsWith('@vendor.com')) {
      errors.email = 'Email must end with @vendor.com';
    } else if (vendorEmailStatus === 'exists') {
      errors.email = vendorEmailMessage || 'Email already registered. Please use a different name.';
    } else if (vendorEmailStatus === 'checking') {
      errors.email = 'Please wait while we check email availability';
    } else if (vendorEmailStatus === 'idle' && emailNamePart.length > 0) {
      // If email name is provided but not checked yet, trigger check
      errors.email = 'Please wait for email validation';
    }
    
    if (!vendorForm.password) errors.password = 'Password is required';
    else if (vendorForm.password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (!vendorForm.panNumber.trim()) errors.panNumber = 'PAN number is required';
    else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(vendorForm.panNumber.toUpperCase())) errors.panNumber = 'Invalid PAN format (e.g., ABCDE1234F)';
    if (!vendorForm.phone.trim()) errors.phone = 'Phone is required';
    else if (!/^[6-9]\d{9}$/.test(vendorForm.phone)) errors.phone = 'Invalid phone number';
    
    // Prevent registration if email already exists
    if (vendorEmailStatus === 'exists') {
      toast.error('This email is already registered. Please use a different name.');
      setVendorErrors(prev => ({ ...prev, email: vendorEmailMessage || 'Email already registered' }));
      return;
    }
    
    if (Object.keys(errors).length > 0) {
      setVendorErrors(errors);
      return;
    }
    
    setIsRegisteringVendor(true);
    try {
      const payload = {
        companyName: vendorForm.companyName.trim(),
        email: finalEmail,
        password: vendorForm.password,
        panNumber: vendorForm.panNumber.toUpperCase().trim(),
        phone: vendorForm.phone.trim(),
        companyType: vendorForm.companyType
      };
      
      const res = await apiFetch('/api/auth/register-vendor', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        // Check if it's an email exists error with wrong password
        if (res.data?.emailExists) {
          toast.error('Email already registered. Please use the correct password to login.');
          // Switch to login mode
          setMode('login');
          setSignupType('passenger');
          // Pre-fill login form with email
          setLoginForm({ email: finalEmail, password: vendorForm.password });
        } else {
          toast.error(res.message || res.data?.message || 'Vendor registration failed');
        }
        return;
      }
      
      // Check response structure - backend returns { success, message, data: { vendor, token }, redirectPath }
      const responseData = res.data;
      const vendorData = responseData?.data?.vendor;
      const token = responseData?.data?.token || responseData?.token;
      
      // Check if auto-login happened
      if (responseData?.autoLogin && token && vendorData) {
        toast.success('Welcome back! You have been automatically logged in.');
        const vendorUserData = {
          _id: vendorData._id,
          name: vendorData.companyName,
          email: vendorData.email,
          role: 'vendor',
          roleType: 'external',
          status: vendorData.status,
          vendorId: vendorData._id
        };
        await fetchProfileAndLogin(vendorUserData, token);
      } else if (token && vendorData) {
        // New registration with auto-approval
        toast.success('Vendor account created and approved!');
        const vendorUserData = {
          _id: vendorData._id,
          name: vendorData.companyName,
          email: vendorData.email,
          role: 'vendor',
          roleType: 'external',
          status: vendorData.status,
          vendorId: vendorData._id
        };
        await fetchProfileAndLogin(vendorUserData, token);
      } else {
        // New registration pending approval
        toast.success('Vendor registration submitted. Pending admin approval.');
        setMode('login');
        setSignupType('passenger');
        setVendorForm({ companyName: '', email: '@vendor.com', password: '', panNumber: '', phone: '', companyType: 'other' });
        setVendorEmailStatus('idle');
        setVendorEmailMessage('');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsRegisteringVendor(false);
    }
  };

  // Student registration handler
  const onSubmitStudent = async (e) => {
    e.preventDefault();
    
    // Validation
    const errors = {};
    if (!studentForm.name.trim()) errors.name = 'Name is required';
    if (!studentForm.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentForm.email)) errors.email = 'Invalid email format';
    if (!studentForm.phone.trim()) errors.phone = 'Phone is required';
    else if (!/^[6-9]\d{9}$/.test(studentForm.phone)) errors.phone = 'Invalid phone number';
    if (!studentForm.password) errors.password = 'Password is required';
    else if (studentForm.password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (!studentForm.aadhaarNumber.trim()) errors.aadhaarNumber = 'Aadhaar number is required';
    else if (!/^\d{12}$/.test(studentForm.aadhaarNumber)) errors.aadhaarNumber = 'Aadhaar must be 12 digits';
    if (!studentForm.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
    if (!studentForm.institution.name.trim()) errors.institutionName = 'Institution name is required';
    
    if (Object.keys(errors).length > 0) {
      setStudentErrors(errors);
      return;
    }
    
    setIsRegisteringStudent(true);
    try {
      const payload = {
        name: studentForm.name.trim(),
        email: studentForm.email.toLowerCase().trim(),
        phone: studentForm.phone.trim(),
        password: studentForm.password,
        aadhaarNumber: studentForm.aadhaarNumber.trim(),
        dateOfBirth: studentForm.dateOfBirth,
        institution: {
          name: studentForm.institution.name.trim(),
          type: studentForm.institution.type
        },
        passType: studentForm.passType
      };
      
      const res = await apiFetch('/api/auth/register-student', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        toast.error(res.message || res.data?.message || 'Student registration failed');
        return;
      }
      
      if (res.data?.token) {
        toast.success('Student pass created and approved!');
        const studentData = {
          _id: res.data.data.studentPass._id,
          name: res.data.data.studentPass.name,
          email: studentForm.email,
          role: 'student',
          roleType: 'external',
          status: res.data.data.studentPass.status
        };
        await fetchProfileAndLogin(studentData, res.data.token);
      } else {
        toast.success('Student pass application submitted. Pending approval.');
        setMode('login');
        setSignupType('passenger');
        setStudentForm({ name: '', email: '', phone: '', password: '', aadhaarNumber: '', dateOfBirth: '', institution: { name: '', type: 'other' }, passType: 'student_concession' });
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsRegisteringStudent(false);
    }
  };

  // Optimized form change handlers
  const handleLoginChange = useCallback((field, value) => {
    setLoginForm(prev => ({ ...prev, [field]: value }));
    if (loginErrors[field]) setLoginErrors(prev => ({ ...prev, [field]: '' }));
    
    if (field === 'email') {
      const identifier = value.trim();
      if (identifier) {
        // Accept email, phone (10 digits), or aadhaar (12 digits)
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
        const isPhone = /^[0-9]{10}$/.test(identifier);
        const isAadhaar = /^[0-9]{12}$/.test(identifier);
        
        if (!isEmail && !isPhone && !isAadhaar && identifier.length > 0) {
          setLoginErrors(prev => ({ ...prev, email: 'Enter Email, Phone (10 digits), or Aadhaar (12 digits)' }));
        }
      }
    }
    
      if (field === 'password' && value && value.length < 8) {
      setLoginErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters' }));
    }
  }, [loginErrors]);

  const handleSignupChange = useCallback((field, value) => {
    setSignupForm(prev => ({ ...prev, [field]: value }));
    if (signupErrors[field]) setSignupErrors(prev => ({ ...prev, [field]: '' }));
    
    // Handle email validation with debouncing
    if (field === 'email') {
      console.log('📧 Email field changed:', value);
      
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
  }, [signupErrors]);

  const handleForgotPasswordChange = useCallback((field, value) => {
    setForgotPasswordForm(prev => ({ ...prev, [field]: value }));
    if (forgotPasswordErrors[field]) setForgotPasswordErrors(prev => ({ ...prev, [field]: '' }));
  }, [forgotPasswordErrors]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (emailTimeoutRef.current) {
        clearTimeout(emailTimeoutRef.current);
      }
    };
  }, []);

  // Special handler for phone field to restrict to numbers only
  const handlePhoneChange = useCallback((e) => {
    let value = e.target.value;
    
    // Extract only numbers
    const numbersOnly = value.replace(/[^0-9]/g, '');
    
    if (numbersOnly.length > 0) {
      // If user types 10 digits, show them as-is (no +91 prefix in display)
      if (numbersOnly.length <= 10) {
        value = numbersOnly;
      }
      // If user types more than 10 digits, take only first 10
      else {
        value = numbersOnly.slice(0, 10);
      }
    } else {
      value = '';
    }
    
    setSignupForm(prev => ({ ...prev, phone: value }));
    
    // Real-time validation
    if (value.trim()) {
      // Check if it's exactly 10 digits
      if (value.length === 10) {
        // Check if it starts with 6, 7, 8, or 9
        if (/^[6-9]/.test(value)) {
          setSignupErrors(prev => ({ ...prev, phone: '' }));
        } else {
          setSignupErrors(prev => ({ ...prev, phone: 'Mobile number must start with 6, 7, 8, or 9' }));
        }
      } else if (value.length < 10) {
        setSignupErrors(prev => ({ ...prev, phone: 'Enter 10-digit mobile number' }));
      } else {
        setSignupErrors(prev => ({ ...prev, phone: 'Enter valid 10-digit Indian mobile number' }));
      }
    } else {
      setSignupErrors(prev => ({ ...prev, phone: '' }));
    }
  }, []);



  const title = 'Yatrik Account';
  const subtitle = mode === 'login' ? (
    <span>New here? <button type="button" onClick={() => setMode('signup')} className="font-medium text-primary-600 hover:text-primary-500 transition-colors" disabled={isLoggingIn || isSigningUp}>Create an account</button></span>
  ) : (
    <span>Already with us? <button type="button" onClick={() => setMode('login')} className="font-medium text-primary-600 hover:text-primary-500 transition-colors" disabled={isLoggingIn || isSigningUp}>Sign in</button></span>
  );

  const LayoutComponent = isMobile ? MobileAuthLayout : AuthLayout;
  
  return (
    <LayoutComponent title={title} subtitle={subtitle}>
      <div className="fade-in">
        {/* Tabs */}
        <div className="mb-3 grid grid-cols-2 rounded-lg border border-gray-200 overflow-hidden">
          <button type="button" onClick={() => setMode('login')} className={`py-1.5 text-xs font-medium transition-all duration-200 ${mode === 'login' ? 'bg-primary-50 text-primary-700' : 'bg-white text-neutral-600 hover:bg-gray-50'}`} disabled={isLoggingIn || isSigningUp}>Sign in</button>
          <button type="button" onClick={() => setMode('signup')} className={`py-1.5 text-xs font-medium transition-all duration-200 ${mode === 'signup' ? 'bg-primary-50 text-primary-700' : 'bg-white text-neutral-600 hover:bg-gray-50'}`} disabled={isLoggingIn || isSigningUp}>Create account</button>
        </div>

        {mode === 'login' ? (
          <div>
            {!showForgotPassword ? (
              <>
                <form className="space-y-3 login-form-compact" onSubmit={onSubmitLogin}>
                  <InputField 
                    id="email" 
                    label="Email / Phone / Aadhaar" 
                    type="text" 
                    autoComplete="email" 
                    value={loginForm.email} 
                    onChange={(e) => handleLoginChange('email', e.target.value)} 
                    error={loginErrors.email} 
                    disabled={isLoggingIn}
                    placeholder="Email, Phone (10 digits), or Aadhaar (12 digits)"
                  />
                  <p className="text-xs text-gray-500 -mt-3 mb-1">
                    System will automatically detect your account type
                  </p>
                  <PasswordField id="password" label="Password" autoComplete="current-password" value={loginForm.password} onChange={(e) => handleLoginChange('password', e.target.value)} error={loginErrors.password} disabled={isLoggingIn} />
                  <div className="flex items-center justify-between -mt-1">
                    <label className="flex items-center gap-1.5 text-xs text-neutral-600"><input type="checkbox" className="h-3 w-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500" /> Remember me</label>
                    <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs font-medium text-primary-600 hover:text-primary-500">Forgot password?</button>
                  </div>
                  <div className="-mt-1">
                    <button type="submit" className="w-full flex justify-center py-1.5 px-4 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 btn-transition login-form-compact" disabled={isLoggingIn}>
                      {isLoggingIn ? (<div className="flex items-center space-x-2"><LoadingSpinner size="sm" color="white" /><span>Signing in...</span></div>) : ('Sign in')}
                    </button>
                  </div>
                </form>
                
                <div className="mt-3 login-form-compact">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-white text-gray-500">or</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <OAuthButton 
                      href={`${(((typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL) || process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/$/, ''))}/api/auth/google?next=${encodeURIComponent(redirectTo)}`} 
                      ariaLabel="Sign in with Google" 
                      icon={<FaGoogle className="text-red-500" />}
                      disabled={isLoggingIn || isSigningUp}
                      className="transform hover:scale-105 active:scale-95 transition-transform duration-100 mobile-google-signin py-1.5 text-xs"
                    >
                      Sign in with Google
                    </OAuthButton>
                  </div>
                </div>

                {/* Quick Access Section */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center mb-2">Quick Access Registration</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signup');
                        setSignupType('vendor');
                      }}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md text-xs font-medium text-blue-700 transition-all duration-200 hover:shadow-sm"
                      disabled={isLoggingIn || isSigningUp || isRegisteringVendor || isRegisteringStudent}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Vendor
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signup');
                        setSignupType('student');
                      }}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md text-xs font-medium text-purple-700 transition-all duration-200 hover:shadow-sm"
                      disabled={isLoggingIn || isSigningUp || isRegisteringVendor || isRegisteringStudent}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                      Student
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-1.5">
                    Click to register as Vendor or Student
                  </p>
                </div>
              </>
            ) : (
              <div>
                {!forgotPasswordSuccess ? (
                  <form className="space-y-3 login-form-compact" onSubmit={onSubmitForgotPassword}>
                    <div className="text-center mb-3">
                      <h3 className="text-sm font-medium text-gray-900">Reset your password</h3>
                      <p className="text-xs text-gray-600 mt-0.5">Enter your email address and we'll send you a link to reset your password.</p>
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
                    
                    <div className="flex gap-2">
                      <button 
                        type="button" 
                        onClick={() => setShowForgotPassword(false)}
                        className="flex-1 py-1.5 px-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-xs"
                      >
                        Back to Sign in
                      </button>
                      <button type="submit" className="flex-1 py-1.5 px-3 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200" disabled={isResettingPassword}>
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
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">Check your email</h3>
                    <p className="text-xs text-gray-600 mb-3">
                      We've sent a password reset link to <strong>{forgotPasswordForm.email}</strong>
                    </p>
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotPasswordSuccess(false);
                        setForgotPasswordForm({ email: '' });
                      }}
                      className="px-3 py-1.5 text-xs bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
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
              {/* Registration Type Selector */}
              {signupType !== 'passenger' && (
                <div className="mb-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSignupType('passenger')}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    disabled={isSigningUp || isRegisteringVendor || isRegisteringStudent}
                  >
                    ← Back to Passenger Registration
                  </button>
                </div>
              )}

              {/* Vendor Registration Form */}
              {signupType === 'vendor' ? (
                <form className="space-y-2 login-form-compact" onSubmit={onSubmitVendor}>
                  <div className="mb-2">
                    <h3 className="text-sm font-semibold text-gray-900">Vendor Registration</h3>
                    <p className="text-xs text-gray-600 mt-0.5">Register your business to start selling</p>
                  </div>
                  
                  <InputField
                    id="companyName"
                    label="Company Name *"
                    type="text"
                    value={vendorForm.companyName}
                    onChange={(e) => handleVendorChange('companyName', e.target.value)}
                    error={vendorErrors.companyName}
                    disabled={isRegisteringVendor}
                    placeholder="Enter company name"
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">
                        Email * <span className="text-gray-400">(@vendor.com)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="vendorEmail"
                          value={vendorForm.email === '@vendor.com' ? '' : vendorForm.email.replace('@vendor.com', '')}
                          onChange={(e) => {
                            // Only allow editing the name part - filter invalid characters
                            const namePart = e.target.value.replace(/[^a-zA-Z0-9._-]/g, '');
                            handleVendorChange('email', namePart);
                          }}
                          onBlur={(e) => {
                            // Ensure @vendor.com is always appended on blur if name exists
                            const namePart = e.target.value.replace(/[^a-zA-Z0-9._-]/g, '');
                            if (namePart) {
                              handleVendorChange('email', namePart);
                            } else {
                              // If empty, set to @vendor.com placeholder
                              setVendorForm(prev => ({ ...prev, email: '@vendor.com' }));
                            }
                          }}
                          className={`w-full px-2 py-1.5 pr-24 text-xs border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                            vendorErrors.email ? 'border-red-500' : 'border-gray-300'
                          } ${isRegisteringVendor ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                          placeholder="company"
                          disabled={isRegisteringVendor}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
                          @vendor.com
                        </span>
                      </div>
                      {vendorErrors.email && (
                        <p className="text-xs text-red-600 mt-0.5">{vendorErrors.email}</p>
                      )}
                      {!vendorErrors.email && vendorEmailStatus === 'checking' && (
                        <p className="text-xs text-blue-600 mt-0.5">Checking availability...</p>
                      )}
                      {!vendorErrors.email && vendorEmailStatus === 'available' && (
                        <p className="text-xs text-green-600 mt-0.5">✓ {vendorEmailMessage}</p>
                      )}
                      {!vendorErrors.email && vendorEmailStatus === 'exists' && (
                        <p className="text-xs text-red-600 mt-0.5">✗ {vendorEmailMessage}</p>
                      )}
                      {!vendorErrors.email && vendorEmailStatus === 'error' && vendorEmailMessage && (
                        <p className="text-xs text-red-600 mt-0.5">✗ {vendorEmailMessage}</p>
                      )}
                    </div>
                    
                    <InputField
                      id="vendorPhone"
                      label="Phone *"
                      type="tel"
                      value={vendorForm.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                        handleVendorChange('phone', value);
                      }}
                      error={vendorErrors.phone}
                      disabled={isRegisteringVendor}
                      placeholder="9876543210"
                      maxLength="10"
                    />
                  </div>
                  
                  <InputField
                    id="panNumber"
                    label="PAN Number *"
                    type="text"
                    value={vendorForm.panNumber}
                    onChange={(e) => handleVendorChange('panNumber', e.target.value.toUpperCase())}
                    error={vendorErrors.panNumber}
                    disabled={isRegisteringVendor}
                    placeholder="ABCDE1234F"
                    maxLength="10"
                  />
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Company Type</label>
                    <select
                      value={vendorForm.companyType}
                      onChange={(e) => handleVendorChange('companyType', e.target.value)}
                      disabled={isRegisteringVendor}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="other">Other</option>
                      <option value="manufacturer">Manufacturer</option>
                      <option value="supplier">Supplier</option>
                      <option value="service_provider">Service Provider</option>
                    </select>
                  </div>
                  
                  <PasswordField
                    id="vendorPassword"
                    label="Password *"
                    value={vendorForm.password}
                    onChange={(e) => handleVendorChange('password', e.target.value)}
                    error={vendorErrors.password}
                    disabled={isRegisteringVendor}
                  />
                  
                  <div>
                    <button
                      type="submit"
                      className="w-full flex justify-center py-1.5 px-4 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                      disabled={isRegisteringVendor}
                    >
                      {isRegisteringVendor ? (
                        <div className="flex items-center space-x-2">
                          <LoadingSpinner size="sm" color="white" />
                          <span>Registering...</span>
                        </div>
                      ) : (
                        'Register as Vendor'
                      )}
                    </button>
                  </div>
                </form>
              ) : signupType === 'student' ? (
                <form className="space-y-2 login-form-compact" onSubmit={onSubmitStudent}>
                  <div className="mb-2">
                    <h3 className="text-sm font-semibold text-gray-900">Student Pass Registration</h3>
                    <p className="text-xs text-gray-600 mt-0.5">Apply for a student concession pass</p>
                  </div>
                  
                  <InputField
                    id="studentName"
                    label="Full Name *"
                    type="text"
                    value={studentForm.name}
                    onChange={(e) => handleStudentChange('name', e.target.value)}
                    error={studentErrors.name}
                    disabled={isRegisteringStudent}
                    placeholder="Enter your full name"
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <InputField
                      id="studentEmail"
                      label="Email *"
                      type="email"
                      value={studentForm.email}
                      onChange={(e) => handleStudentChange('email', e.target.value)}
                      error={studentErrors.email}
                      disabled={isRegisteringStudent}
                      placeholder="student@example.com"
                    />
                    
                    <InputField
                      id="studentPhone"
                      label="Phone *"
                      type="tel"
                      value={studentForm.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                        handleStudentChange('phone', value);
                      }}
                      error={studentErrors.phone}
                      disabled={isRegisteringStudent}
                      placeholder="9876543210"
                      maxLength="10"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <InputField
                      id="aadhaarNumber"
                      label="Aadhaar Number *"
                      type="text"
                      value={studentForm.aadhaarNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 12);
                        handleStudentChange('aadhaarNumber', value);
                      }}
                      error={studentErrors.aadhaarNumber}
                      disabled={isRegisteringStudent}
                      placeholder="123456789012"
                      maxLength="12"
                    />
                    
                    <InputField
                      id="dateOfBirth"
                      label="Date of Birth *"
                      type="date"
                      value={studentForm.dateOfBirth}
                      onChange={(e) => handleStudentChange('dateOfBirth', e.target.value)}
                      error={studentErrors.dateOfBirth}
                      disabled={isRegisteringStudent}
                    />
                  </div>
                  
                  <InputField
                    id="institutionName"
                    label="Institution Name *"
                    type="text"
                    value={studentForm.institution.name}
                    onChange={(e) => handleStudentChange('institution.name', e.target.value)}
                    error={studentErrors.institutionName}
                    disabled={isRegisteringStudent}
                    placeholder="School/College/University name"
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Institution Type</label>
                      <select
                        value={studentForm.institution.type}
                        onChange={(e) => handleStudentChange('institution.type', e.target.value)}
                        disabled={isRegisteringStudent}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="other">Other</option>
                        <option value="school">School</option>
                        <option value="college">College</option>
                        <option value="university">University</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Pass Type</label>
                      <select
                        value={studentForm.passType}
                        onChange={(e) => handleStudentChange('passType', e.target.value)}
                        disabled={isRegisteringStudent}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="student_concession">Student Concession</option>
                        <option value="monthly">Monthly Pass</option>
                        <option value="annual">Annual Pass</option>
                      </select>
                    </div>
                  </div>
                  
                  <PasswordField
                    id="studentPassword"
                    label="Password *"
                    value={studentForm.password}
                    onChange={(e) => handleStudentChange('password', e.target.value)}
                    error={studentErrors.password}
                    disabled={isRegisteringStudent}
                  />
                  
                  <div>
                    <button
                      type="submit"
                      className="w-full flex justify-center py-1.5 px-4 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
                      disabled={isRegisteringStudent}
                    >
                      {isRegisteringStudent ? (
                        <div className="flex items-center space-x-2">
                          <LoadingSpinner size="sm" color="white" />
                          <span>Applying...</span>
                        </div>
                      ) : (
                        'Apply for Student Pass'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <form className="space-y-2 login-form-compact" onSubmit={onSubmitSignup}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <InputField id="name" label="Full Name" type="text" autoComplete="name" value={signupForm.name} onChange={(e) => handleSignupChange('name', e.target.value)} error={signupErrors.name} disabled={isSigningUp || otherDisabled} />
                      <div>
                        <InputField 
                          id="email" 
                          label="Email address" 
                          type="email" 
                          autoComplete="email" 
                          value={signupForm.email} 
                          onChange={(e) => handleSignupChange('email', e.target.value)} 
                          error={signupErrors.email} 
                          disabled={isSigningUp}
                          className={`${emailStatus === 'available' ? 'border-green-500' : emailStatus === 'exists' ? 'border-red-500' : emailStatus === 'checking' ? 'border-blue-500' : ''}`}
                        />
                        {emailMessage && (
                          <div className={`mt-1 text-sm ${emailStatus === 'available' ? 'text-green-600' : emailStatus === 'exists' ? 'text-red-600' : emailStatus === 'checking' ? 'text-blue-600' : 'text-gray-600'}`}>
                            {emailMessage}
                          </div>
                        )}
                      </div>
                      <InputField 
                        id="phone" 
                        label="Mobile Number" 
                        type="tel" 
                        autoComplete="tel" 
                        placeholder="9876543210" 
                        value={signupForm.phone} 
                        onChange={handlePhoneChange} 
                        error={signupErrors.phone} 
                        disabled={isSigningUp || otherDisabled}
                        maxLength="10"
                      />
                      <PasswordField id="password" label="Password" autoComplete="new-password" value={signupForm.password} onChange={(e) => handleSignupChange('password', e.target.value)} error={signupErrors.password} disabled={isSigningUp || otherDisabled} />
                    </div>
                    <PasswordField id="confirmPassword" label="Confirm Password" autoComplete="new-password" value={signupForm.confirmPassword} onChange={(e) => handleSignupChange('confirmPassword', e.target.value)} error={signupErrors.confirmPassword} disabled={isSigningUp || otherDisabled} />
                    <div>
                      <button type="submit" className="w-full flex justify-center py-1.5 px-4 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 btn-transition login-form-compact" disabled={isSigningUp || otherDisabled || emailStatus === 'checking'}>
                        {isSigningUp ? (<div className="flex items-center space-x-2"><LoadingSpinner size="sm" color="white" /><span>Creating account...</span></div>) : ('Create Account')}
                      </button>
                    </div>
                  </form>
                  
                  <div className="mt-3">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-white text-gray-500">or</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <OAuthButton 
                        href={`${(((typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL) || process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/$/, ''))}/api/auth/google?next=${encodeURIComponent(redirectTo)}&mode=signup`} 
                        ariaLabel="Sign up with Google" 
                        icon={<FaGoogle className="text-red-500" />}
                        className="py-1.5 text-xs transform hover:scale-105 active:scale-95 transition-transform duration-100 mobile-google-signin"
                        disabled={isLoggingIn || isSigningUp}
                      >
                        Sign up with Google
                      </OAuthButton>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </LayoutComponent>
  );
};

export default Auth;





