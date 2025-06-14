import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useSecuritySettings = () => {
  const { user } = useAuth();
  const [passwordRequirements, setPasswordRequirements] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch password requirements
  useEffect(() => {
    fetchPasswordRequirements();
  }, []);

  // Monitor session info if user is authenticated
  useEffect(() => {
    if (user) {
      fetchSessionInfo();
      // Check session every 5 minutes
      const interval = setInterval(fetchSessionInfo, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchPasswordRequirements = async () => {
    try {
      const response = await fetch('/api/auth/password-requirements');
      const data = await response.json();
      
      if (data.success) {
        setPasswordRequirements(data.requirements);
      } else {
        setError('Failed to load password requirements');
      }
    } catch (err) {
      console.error('Error fetching password requirements:', err);
      setError('Failed to load password requirements');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/auth/session-info', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSessionInfo(data.sessionInfo);
      }
    } catch (err) {
      console.error('Error fetching session info:', err);
    }
  };

  const validatePassword = (password, username = '', email = '') => {
    if (!passwordRequirements) {
      return { isValid: false, errors: ['Password requirements not loaded'] };
    }

    const errors = [];
    const { minLength, complexityRequired, rules } = passwordRequirements;

    // Basic length check
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }

    // Complexity checks if enabled
    if (complexityRequired && rules) {
      if (rules.require_uppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }

      if (rules.require_lowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      }

      if (rules.require_numbers && !/\d/.test(password)) {
        errors.push('Password must contain at least one number');
      }

      if (rules.require_special_chars) {
        const allowedChars = rules.allowed_special_chars || '@$!%*?&#+\\-_.,~';
        const specialCharRegex = new RegExp(`[${escapeRegExp(allowedChars)}]`);
        
        if (!specialCharRegex.test(password)) {
          errors.push(`Password must contain at least one special character (${allowedChars})`);
        }
      }

      if (rules.prevent_username_in_password && username && username.length >= 3) {
        if (password.toLowerCase().includes(username.toLowerCase())) {
          errors.push('Password cannot contain your username');
        }
      }

      if (rules.prevent_username_in_password && email && email.includes('@')) {
        const emailPrefix = email.split('@')[0];
        if (emailPrefix.length >= 3 && password.toLowerCase().includes(emailPrefix.toLowerCase())) {
          errors.push('Password cannot contain your email address');
        }
      }

      if (rules.max_length && password.length > rules.max_length) {
        errors.push(`Password must be no more than ${rules.max_length} characters long`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength: calculatePasswordStrength(password)
    };
  };

  const calculatePasswordStrength = (password) => {
    let score = 0;
    
    // Length bonus
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Character variety
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z\d]/.test(password)) score++;
    
    // Bonus for very strong passwords
    if (password.length >= 16 && score >= 4) score++;
    
    return Math.min(score, 5);
  };

  const getPasswordStrengthLabel = (strength) => {
    switch (strength) {
      case 0:
      case 1:
        return 'Very Weak';
      case 2:
        return 'Weak';
      case 3:
        return 'Fair';
      case 4:
        return 'Good';
      case 5:
        return 'Strong';
      default:
        return 'Unknown';
    }
  };

  const getPasswordStrengthColor = (strength) => {
    switch (strength) {
      case 0:
      case 1:
        return 'text-red-600';
      case 2:
        return 'text-orange-600';
      case 3:
        return 'text-yellow-600';
      case 4:
        return 'text-blue-600';
      case 5:
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPasswordRequirementsMessage = () => {
    if (!passwordRequirements || !passwordRequirements.complexityRequired) {
      return `Password must be at least ${passwordRequirements?.minLength || 8} characters long`;
    }

    return passwordRequirements.message || 'Password must meet complexity requirements';
  };

  const isSessionExpiring = () => {
    if (!sessionInfo) return false;
    return sessionInfo.needsRefreshWarning;
  };

  const getTimeUntilExpiry = () => {
    if (!sessionInfo) return null;
    
    const expiryTime = sessionInfo.timeoutHours - sessionInfo.sessionAge;
    return Math.max(0, expiryTime);
  };

  // Helper function to escape regex special characters
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  return {
    passwordRequirements,
    sessionInfo,
    loading,
    error,
    validatePassword,
    calculatePasswordStrength,
    getPasswordStrengthLabel,
    getPasswordStrengthColor,
    getPasswordRequirementsMessage,
    isSessionExpiring,
    getTimeUntilExpiry,
    refreshRequirements: fetchPasswordRequirements,
    refreshSessionInfo: fetchSessionInfo
  };
};

export default useSecuritySettings;