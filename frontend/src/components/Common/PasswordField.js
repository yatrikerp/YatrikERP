import React, { useState } from 'react';

const PasswordField = ({ id = 'password', label = 'Password', value, onChange, autoComplete = 'current-password', required = true, placeholder, className = '' }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required={required}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="appearance-none block w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-colors"
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.83-1.83A10.284 10.284 0 0019 10s-3-7-9-7a9.955 9.955 0 00-5.393 1.61L3.707 2.293z"/>
              <path d="M6.576 5.162A8.012 8.012 0 0110 4c4 0 6.882 3.182 7.71 5-.251.477-.642 1.111-1.177 1.79l-2.4-2.4A3 3 0 009.61 6.157l-3.034-2.995z"/>
              <path d="M13.132 14.27l-1.64-1.64a3 3 0 01-4.122-4.122L5.1 5.34A10.28 10.28 0 001 10s3 7 9 7a9.957 9.957 0 004.132-.73z"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 3c-6 0-9 7-9 7s3 7 9 7 9-7 9-7-3-7-9-7zm0 12a5 5 0 110-10 5 5 0 010 10z"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default PasswordField;


