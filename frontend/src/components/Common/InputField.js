import React from 'react';

const InputField = ({ id, label, type = 'text', value, onChange, autoComplete, icon = null, required = true, placeholder, className = '', error, disabled, maxLength, pattern, ...otherProps }) => {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            {icon}
          </span>
        )}
        <input
          id={id}
          name={id}
          type={type}
          autoComplete={autoComplete}
          required={required}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          pattern={pattern}
          {...otherProps}
          className={`appearance-none block w-full ${icon ? 'pl-10' : 'pl-3'} pr-3 py-3 border ${error ? 'border-red-300' : 'border-gray-300'} rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm text-gray-900 transition-colors ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default InputField;


