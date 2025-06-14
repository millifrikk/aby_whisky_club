import React, { useState, useEffect } from 'react';
import { useSecuritySettings } from '../../hooks/useSecuritySettings';

const PasswordInput = ({ 
  value, 
  onChange, 
  placeholder = "Enter password", 
  showStrength = true,
  showRequirements = true,
  username = '',
  email = '',
  className = '',
  name = 'password',
  id = 'password',
  autoComplete = 'current-password',
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [validation, setValidation] = useState({ isValid: false, errors: [], strength: 0 });
  const { 
    passwordRequirements, 
    validatePassword, 
    getPasswordStrengthLabel, 
    getPasswordStrengthColor,
    getPasswordRequirementsMessage,
    loading 
  } = useSecuritySettings();

  // Validate password whenever it changes
  useEffect(() => {
    if (value && passwordRequirements) {
      const result = validatePassword(value, username, email);
      setValidation(result);
    } else {
      setValidation({ isValid: false, errors: [], strength: 0 });
    }
  }, [value, username, email, passwordRequirements, validatePassword]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getStrengthBarColor = (strength) => {
    switch (strength) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-orange-500';
      case 3:
        return 'bg-yellow-500';
      case 4:
        return 'bg-blue-500';
      case 5:
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStrengthBarWidth = (strength) => {
    return `${(strength / 5) * 100}%`;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-300 rounded mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Password Input Field */}
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`
            w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent pr-10
            ${validation.isValid && value ? 'border-green-500' : validation.errors.length > 0 && value ? 'border-red-500' : 'border-gray-300'}
            ${className}
          `}
          name={name}
          id={id}
          autoComplete={autoComplete}
          {...props}
        />
        
        {/* Show/Hide Password Button */}
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          tabIndex={-1}
        >
          {showPassword ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.05 6.05M9.878 9.878a3 3 0 105.303 5.303m0 0L19.95 19.95M6.05 6.05L8.464 8.464M6.05 6.05a11.997 11.997 0 0115.9 0M17.536 15.536a3 3 0 01-4.242-4.242" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Password Strength Indicator */}
      {showStrength && value && (
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600">Password strength:</span>
            <span className={getPasswordStrengthColor(validation.strength)}>
              {getPasswordStrengthLabel(validation.strength)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getStrengthBarColor(validation.strength)}`}
              style={{ width: getStrengthBarWidth(validation.strength) }}
            ></div>
          </div>
        </div>
      )}

      {/* Password Requirements */}
      {showRequirements && passwordRequirements && (
        <div className="text-xs text-gray-600">
          <p className="mb-1">Password requirements:</p>
          <p>{getPasswordRequirementsMessage()}</p>
        </div>
      )}

      {/* Validation Errors */}
      {validation.errors.length > 0 && value && (
        <div className="text-xs text-red-600 space-y-1">
          {validation.errors.map((error, index) => (
            <div key={index} className="flex items-center space-x-1">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Success Indicator */}
      {validation.isValid && value && (
        <div className="text-xs text-green-600 flex items-center space-x-1">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Password meets all requirements</span>
        </div>
      )}
    </div>
  );
};

export default PasswordInput;