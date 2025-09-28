import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import RoleTestPanel from '../components/Common/RoleTestPanel';
import { handleGoogleAuth } from '../config/googleAuth';
import ErrorPopup from '../components/Common/ErrorPopup';
import { validateField, PHONE_VALIDATION, PASSWORD_VALIDATION } from '../utils/validation';
import ValidationFeedback from '../components/Common/ValidationFeedback';
import loginImage from '../assets/login.png';
import '../styles/login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, setError] = useState('');
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState('error');
  
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
    
    // Validation checks
    if (!formData.email.trim()) {
      setErrorMessage('Please enter your email address');
      setErrorType('warning');
      setShowErrorPopup(true);
      return;
    }
    
    if (!formData.password.trim()) {
      setErrorMessage('Please enter your password');
      setErrorType('warning');
      setShowErrorPopup(true);
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });
      
      if (!res.ok) {
        // Handle different error types
        let errorType = 'error';
        let errorMsg = res.message || 'Login failed';
        
        if (res.status === 401) {
          errorType = 'warning';
          errorMsg = 'Invalid email or password. Please check your credentials.';
        } else if (res.status === 423) {
          errorType = 'warning';
          errorMsg = 'Account is temporarily locked due to too many failed attempts. Please try again later.';
        } else if (res.status === 429) {
          errorType = 'warning';
          errorMsg = 'Too many login attempts. Please wait a moment before trying again.';
        } else if (res.status >= 500) {
          errorType = 'error';
          errorMsg = 'Server error. Please try again later.';
        }
        
        throw new Error(errorMsg);
      }
      
      const user = res.data.data?.user || res.data.user;
      const token = res.data.data?.token || res.data.token;
      
      if (user && token) {
        // Log user data for debugging
        console.log('Login successful - User data received:', {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          depotId: user.depotId
        });
        
        // OPTIMIZED: Immediate UI response - don't await login
        login(user, token).catch(err => 
          console.error('Background login processing failed:', err)
        );
        
        // OPTIMIZED: Navigate immediately for fastest performance
        navigate('/dashboard');
        
        // OPTIMIZED: Show success message in background
        setTimeout(() => {
          setErrorMessage(`Welcome back, ${user.name}! Redirecting to dashboard...`);
          setErrorType('success');
          setShowErrorPopup(true);
        }, 100);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      const errorMsg = err.message || 'Login failed. Please try again.';
      setError(errorMsg);
      setErrorMessage(errorMsg);
      setErrorType('error');
      setShowErrorPopup(true);
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Error Popup */}
      <ErrorPopup
        show={showErrorPopup}
        message={errorMessage}
        type={errorType}
        duration={3000}
        onClose={() => setShowErrorPopup(false)}
      />
      
      {/* Temporary Role Test Panel for debugging */}
      <RoleTestPanel />
      
      <div className="login-wrap">
        <section className="login-left" aria-hidden="true">
          <div className="login-illustration">
            <img src={loginImage} alt="Transport Dashboard" className="login-image" />
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

                  <button type="submit" disabled={isLoading} className="login-btn login-btn--primary transform transition-all duration-150 hover:scale-105 active:scale-95">
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      'Sign in'
                    )}
                  </button>
                </form>

                <div className="login-divider-text" aria-hidden="true">or continue with</div>

                <button 
                  type="button"
                  className="login-btn login-btn--google" 
                  aria-label="Continue with Google"
                  onClick={handleGoogleAuth}
                >
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
  // Track email availability status for disabling other fields
  const [emailStatus, setEmailStatus] = useState('idle'); // idle | checking | available | exists | error
  const [emailMessage, setEmailMessage] = useState('');
  const emailTimeoutRef = React.useRef(null);
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
  const [, setError] = useState('');
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState('error');
  const [touchedFields, setTouchedFields] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
    
    // Mark field as touched
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    
    // Real-time validation
    if (name === 'name') {
      const errors = validateField('name', value);
      setFieldErrors(prev => ({ ...prev, name: errors }));
    } else if (name === 'email') {
      const errors = validateField('email', value);
      setFieldErrors(prev => ({ ...prev, email: errors }));
      // Debounced email availability check
      if (emailTimeoutRef.current) clearTimeout(emailTimeoutRef.current);
      emailTimeoutRef.current = setTimeout(async () => {
        if (!value || errors.length > 0) {
          setEmailStatus('idle');
          setEmailMessage('');
          return;
        }
        try {
          setEmailStatus('checking');
          setEmailMessage('Checking email...');
          const res = await apiFetch('/api/auth/check-email', {
            method: 'POST',
            body: JSON.stringify({ email: value })
          });
          if (res.ok && res.data?.exists === false) {
            setEmailStatus('available');
            setEmailMessage('Email available');
          } else if (res.ok && (res.data?.exists === true || res.data?.message?.includes('exists'))) {
            setEmailStatus('exists');
            setEmailMessage('Email already exists');
          } else {
            setEmailStatus('error');
            setEmailMessage(res.message || 'Error checking email');
          }
        } catch (err) {
          setEmailStatus('error');
          setEmailMessage(err.message || 'Error checking email');
        }
      }, 300);
    } else if (name === 'phone') {
      const errors = validateField('phone', value);
      setFieldErrors(prev => ({ ...prev, phone: errors }));
    } else if (name === 'password') {
      const errors = validateField('password', value);
      setFieldErrors(prev => ({ ...prev, password: errors }));
    } else if (name === 'confirmPassword') {
      // For confirm password, we don't need to validate against backend rules
      // Just track that it's been touched
    }
  };

  const otherDisabled = emailStatus !== 'available';

  const showPopup = (message, type = 'error') => {
    setErrorMessage(message);
    setErrorType(type);
    setShowErrorPopup(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Comprehensive validation checks
    const nameErrors = validateField('name', formData.name);
    if (nameErrors.length > 0) {
      showPopup(nameErrors[0], 'warning');
      return;
    }
    
    const emailErrors = validateField('email', formData.email);
    if (emailErrors.length > 0) {
      showPopup(emailErrors[0], 'warning');
      return;
    }
    
    // Phone validation with detailed checks
    if (!formData.phone.trim()) {
      showPopup('Please enter your mobile number', 'warning');
      return;
    }
    
    if (!PHONE_VALIDATION.test(formData.phone)) {
      showPopup(PHONE_VALIDATION.description, 'warning');
      return;
    }
    
    // Password validation with detailed checks
    if (!formData.password.trim()) {
      showPopup('Please enter a password', 'warning');
      return;
    }
    
    if (!PASSWORD_VALIDATION.test(formData.password)) {
      showPopup(PASSWORD_VALIDATION.description, 'warning');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      showPopup('Passwords do not match. Please try again.', 'warning');
      return;
    }
    
    
    setIsLoading(true);
    setError('');

    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: formData.name, email: formData.email, phone: formData.phone, password: formData.password })
      });
      
      if (!res.ok) {
        // Handle different error types
        let errorType = 'error';
        let errorMsg = res.message || 'Signup failed';
        
        if (res.status === 400) {
          errorType = 'warning';
          if (res.message?.includes('email')) {
            errorMsg = 'This email is already registered. Please use a different email or try logging in.';
          } else if (res.message?.includes('phone')) {
            errorMsg = 'This phone number is already registered. Please use a different number.';
          } else {
            errorMsg = 'Please check your input and try again.';
          }
        } else if (res.status === 422) {
          errorType = 'warning';
          errorMsg = 'Invalid email format. Please enter a valid email address.';
        } else if (res.status >= 500) {
          errorType = 'error';
          errorMsg = 'Server error. Please try again later.';
        }
        
        throw new Error(errorMsg);
      }
      
      const user = res.data.data?.user || res.data.user;
      const token = res.data.data?.token || res.data.token;
      
      if (user && token) {
        // Show success message
        showPopup(`Account created successfully! Welcome, ${user.name}!`, 'success');
        
        // Login the user
        login(user, token);
        
        // Navigate after a short delay to show success message
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      }
    } catch (err) {
      showPopup(err.message || 'Signup failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Error Popup for Signup */}
      <ErrorPopup
        show={showErrorPopup}
        message={errorMessage}
        type={errorType}
        duration={4000}
        onClose={() => setShowErrorPopup(false)}
      />
      
      <form onSubmit={handleSubmit} className="login-form" autoComplete="on">

      <label htmlFor="su-name" className="login-label">Full name</label>
      <input 
        id="su-name" 
        name="name" 
        type="text" 
        className="login-input" 
        value={formData.name} 
        onChange={handleChange} 
        disabled={otherDisabled}
        placeholder="Enter your full name"
        required 
      />
      <ValidationFeedback
        field="name"
        value={formData.name}
        isValid={!fieldErrors.name || fieldErrors.name.length === 0}
        isTouched={touchedFields.name}
        errorMessage={fieldErrors.name?.[0]}
        successMessage="Name format is valid"
      />

      <label htmlFor="su-email" className="login-label">Email address</label>
      <input 
        id="su-email" 
        name="email" 
        type="email" 
        className="login-input" 
        value={formData.email} 
        onChange={handleChange} 
        placeholder="admin@yatrik.com"
        required 
      />
      {emailMessage && (
        <div className={`login-hint ${emailStatus === 'exists' ? 'text-red-600' : emailStatus === 'available' ? 'text-green-600' : 'text-gray-500'}`}>
          {emailMessage}
        </div>
      )}
      <ValidationFeedback
        field="email"
        value={formData.email}
        isValid={!fieldErrors.email || fieldErrors.email.length === 0}
        isTouched={touchedFields.email}
        errorMessage={fieldErrors.email?.[0]}
        successMessage="Email format is valid"
      />
      

      <label htmlFor="su-phone" className="login-label">Mobile number</label>
      <input 
        id="su-phone" 
        name="phone" 
        type="tel" 
        className="login-input" 
        value={formData.phone} 
        onChange={handleChange} 
        disabled={otherDisabled}
        placeholder="+91 9876543210"
        pattern="\+91[6-9][0-9]{9}"
        title="Please enter a valid mobile number in format (+91) followed by 10 digits starting with 6-9"
        maxLength="13"
        required 
      />
      <ValidationFeedback
        field="phone"
        value={formData.phone}
        isValid={!fieldErrors.phone || fieldErrors.phone.length === 0}
        isTouched={touchedFields.phone}
        errorMessage={fieldErrors.phone?.[0]}
        successMessage="Mobile number format is valid"
      />

      <label htmlFor="su-password" className="login-label">Password</label>
      <div className="login-password">
        <input 
          id="su-password" 
          name="password" 
          type={showPassword ? 'text' : 'password'} 
          className="login-input" 
          value={formData.password} 
          onChange={handleChange} 
          disabled={otherDisabled}
          placeholder="Enter strong password"
          required 
        />
        <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} className="login-eye" onClick={() => setShowPassword(!showPassword)}>
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      <ValidationFeedback
        field="password"
        value={formData.password}
        isValid={!fieldErrors.password || fieldErrors.password.length === 0}
        isTouched={touchedFields.password}
        errorMessage={fieldErrors.password?.[0]}
        successMessage="Password meets security requirements"
      />

      <label htmlFor="su-confirm" className="login-label">Confirm password</label>
      <div className="login-password">
        <input 
          id="su-confirm" 
          name="confirmPassword" 
          type={showConfirmPassword ? 'text' : 'password'} 
          className="login-input" 
          value={formData.confirmPassword} 
          onChange={handleChange} 
          disabled={otherDisabled}
          placeholder="Confirm your password"
          required 
        />
        <button type="button" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'} className="login-eye" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      <ValidationFeedback
        field="confirmPassword"
        value={formData.confirmPassword}
        isValid={formData.password === formData.confirmPassword && formData.confirmPassword.trim() !== ''}
        isTouched={touchedFields.confirmPassword}
        errorMessage={formData.confirmPassword.trim() !== '' && formData.password !== formData.confirmPassword ? 'Passwords do not match' : ''}
        successMessage="Passwords match"
      />

      <button type="submit" disabled={isLoading || otherDisabled || emailStatus === 'checking'} className="login-btn login-btn--primary">
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Creating account...</span>
          </div>
        ) : (
          'Create account'
        )}
      </button>

      <div className="login-divider-text" aria-hidden="true">or continue with</div>
      <button 
        type="button"
        className="login-btn login-btn--google" 
        aria-label="Continue with Google"
        onClick={handleGoogleAuth}
      >
        <svg className="login-g" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span>Sign up with Google</span>
      </button>
      </form>
    </>
  );
}
