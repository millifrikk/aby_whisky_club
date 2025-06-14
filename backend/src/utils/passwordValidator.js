/**
 * Enhanced password validation utility using admin settings
 */

// Common weak passwords to check against
const COMMON_PASSWORDS = new Set([
  'password', 'password123', '123456', '12345678', 'qwerty', 'abc123',
  'password1', 'admin', 'letmein', 'welcome', 'monkey', '1234567890',
  'football', 'iloveyou', '1234567', 'princess', 'login', 'welcome123',
  'solo', 'qwerty123', 'passw0rd', 'hello', 'charlie', 'aa123456',
  'donald', 'password!', 'qwerty1', '123456789', 'welcome1'
]);

/**
 * Validates password against comprehensive rules
 * @param {string} password - The password to validate
 * @param {Object} rules - Password complexity rules from settings
 * @param {string} username - Username to check against (optional)
 * @param {string} email - Email to check against (optional)
 * @returns {Object} Validation result with isValid and errors array
 */
function validatePasswordComplexity(password, rules, username = null, email = null) {
  const errors = [];
  
  if (!password || typeof password !== 'string') {
    return { isValid: false, errors: ['Password is required'] };
  }

  // Parse rules if they're JSON string
  let complexityRules = rules;
  if (typeof rules === 'string') {
    try {
      complexityRules = JSON.parse(rules);
    } catch (e) {
      complexityRules = getDefaultPasswordRules();
    }
  }

  // Use defaults if rules not properly configured
  if (!complexityRules || typeof complexityRules !== 'object') {
    complexityRules = getDefaultPasswordRules();
  }

  // Length validation
  if (password.length < (complexityRules.min_length || 8)) {
    errors.push(`Password must be at least ${complexityRules.min_length || 8} characters long`);
  }

  if (password.length > (complexityRules.max_length || 128)) {
    errors.push(`Password must be no more than ${complexityRules.max_length || 128} characters long`);
  }

  // Character requirements
  if (complexityRules.require_uppercase !== false) {
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
  }

  if (complexityRules.require_lowercase !== false) {
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
  }

  if (complexityRules.require_numbers !== false) {
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
  }

  if (complexityRules.require_special_chars !== false) {
    const allowedSpecialChars = complexityRules.allowed_special_chars || '@$!%*?&#+\\-_.,~';
    const specialCharRegex = new RegExp(`[${escapeRegExp(allowedSpecialChars)}]`);
    
    if (!specialCharRegex.test(password)) {
      errors.push(`Password must contain at least one special character (${allowedSpecialChars})`);
    }
  }

  // Security checks
  if (complexityRules.prevent_common_passwords !== false) {
    if (COMMON_PASSWORDS.has(password.toLowerCase())) {
      errors.push('Password is too common and easily guessable');
    }
  }

  if (complexityRules.prevent_username_in_password !== false && username) {
    if (username.length >= 3 && password.toLowerCase().includes(username.toLowerCase())) {
      errors.push('Password cannot contain your username');
    }
  }

  if (complexityRules.prevent_username_in_password !== false && email) {
    const emailPrefix = email.split('@')[0];
    if (emailPrefix.length >= 3 && password.toLowerCase().includes(emailPrefix.toLowerCase())) {
      errors.push('Password cannot contain your email address');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password, complexityRules)
  };
}

/**
 * Calculate password strength score (0-5)
 */
function calculatePasswordStrength(password, rules) {
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
}

/**
 * Generate password validation regex from rules
 */
function generatePasswordRegex(rules) {
  let pattern = '^';
  
  if (rules.require_lowercase !== false) {
    pattern += '(?=.*[a-z])';
  }
  
  if (rules.require_uppercase !== false) {
    pattern += '(?=.*[A-Z])';
  }
  
  if (rules.require_numbers !== false) {
    pattern += '(?=.*\\d)';
  }
  
  if (rules.require_special_chars !== false) {
    const specialChars = escapeRegExp(rules.allowed_special_chars || '@$!%*?&#+\\-_.,~');
    pattern += `(?=.*[${specialChars}])`;
  }
  
  // Character set restriction
  const allowedChars = 'A-Za-z\\d' + escapeRegExp(rules.allowed_special_chars || '@$!%*?&#+\\-_.,~');
  pattern += `[${allowedChars}]`;
  
  // Length constraints
  const minLength = rules.min_length || 8;
  const maxLength = rules.max_length || 128;
  pattern += `{${minLength},${maxLength}}$`;
  
  return new RegExp(pattern);
}

/**
 * Get default password rules
 */
function getDefaultPasswordRules() {
  return {
    min_length: 8,
    max_length: 128,
    require_uppercase: true,
    require_lowercase: true,
    require_numbers: true,
    require_special_chars: true,
    allowed_special_chars: '@$!%*?&#+\\-_.,~',
    prevent_common_passwords: true,
    prevent_username_in_password: true
  };
}

/**
 * Escape special characters for regex
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get password requirements message for user display
 */
function getPasswordRequirementsMessage(rules) {
  const requirements = [];
  
  requirements.push(`${rules.min_length || 8}-${rules.max_length || 128} characters long`);
  
  if (rules.require_lowercase !== false) {
    requirements.push('at least one lowercase letter');
  }
  
  if (rules.require_uppercase !== false) {
    requirements.push('at least one uppercase letter');
  }
  
  if (rules.require_numbers !== false) {
    requirements.push('at least one number');
  }
  
  if (rules.require_special_chars !== false) {
    const chars = rules.allowed_special_chars || '@$!%*?&#+\\-_.,~';
    requirements.push(`at least one special character (${chars})`);
  }
  
  return `Password must contain: ${requirements.join(', ')}`;
}

module.exports = {
  validatePasswordComplexity,
  calculatePasswordStrength,
  generatePasswordRegex,
  getDefaultPasswordRules,
  getPasswordRequirementsMessage,
  COMMON_PASSWORDS
};