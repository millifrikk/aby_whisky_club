/**
 * Two-Factor Authentication utilities using TOTP (Time-based One-Time Password)
 */

const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * Generate a new 2FA secret for a user
 */
function generateTwoFactorSecret(userEmail, serviceName = 'Åby Whisky Club') {
  const secret = speakeasy.generateSecret({
    name: `${serviceName} (${userEmail})`,
    issuer: serviceName,
    length: 32
  });

  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url,
    qrCodeUrl: null // Will be generated separately
  };
}

/**
 * Generate QR code for 2FA setup
 */
async function generateQRCode(otpauthUrl) {
  try {
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Verify TOTP token
 */
function verifyTwoFactorToken(secret, token, window = 1) {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: window // Allow 1 step before/after current time
  });
}

/**
 * Generate backup codes for 2FA recovery
 */
function generateBackupCodes(count = 8) {
  const codes = [];
  
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  
  return codes;
}

/**
 * Hash backup codes for secure storage
 */
async function hashBackupCodes(codes) {
  const hashedCodes = [];
  
  for (const code of codes) {
    const hashedCode = await bcrypt.hash(code, 12);
    hashedCodes.push(hashedCode);
  }
  
  return hashedCodes;
}

/**
 * Verify backup code
 */
async function verifyBackupCode(plainCode, hashedCodes) {
  for (let i = 0; i < hashedCodes.length; i++) {
    const isValid = await bcrypt.compare(plainCode, hashedCodes[i]);
    if (isValid) {
      return i; // Return index of used code for removal
    }
  }
  return -1; // Code not found or invalid
}

/**
 * Remove used backup code
 */
function removeUsedBackupCode(hashedCodes, usedIndex) {
  const updatedCodes = [...hashedCodes];
  updatedCodes.splice(usedIndex, 1);
  return updatedCodes;
}

/**
 * Check if 2FA is required for user
 */
function is2FARequired(user, sitewideEnabled = false) {
  // If site-wide 2FA is disabled, only check individual user preference
  if (!sitewideEnabled) {
    return user.two_factor_enabled || false;
  }
  
  // If site-wide is enabled, user can still choose to enable/disable
  return user.two_factor_enabled || false;
}

/**
 * Format backup codes for display
 */
function formatBackupCodesForDisplay(codes) {
  return codes.map((code, index) => ({
    id: index + 1,
    code: code.match(/.{1,4}/g).join('-'), // Format as XXXX-XXXX
    used: false
  }));
}

/**
 * Validate 2FA token format
 */
function isValidTokenFormat(token) {
  // TOTP tokens are typically 6 digits
  return /^\d{6}$/.test(token);
}

/**
 * Validate backup code format
 */
function isValidBackupCodeFormat(code) {
  // Remove hyphens and check if it's 8 hex characters
  const cleanCode = code.replace(/-/g, '');
  return /^[A-F0-9]{8}$/i.test(cleanCode);
}

/**
 * Generate 2FA setup data for user
 */
async function generateSetupData(userEmail) {
  const secretData = generateTwoFactorSecret(userEmail);
  const qrCodeUrl = await generateQRCode(secretData.otpauthUrl);
  const backupCodes = generateBackupCodes();
  
  return {
    secret: secretData.secret,
    qrCodeUrl,
    backupCodes: formatBackupCodesForDisplay(backupCodes),
    backupCodesRaw: backupCodes // For hashing
  };
}

/**
 * Create 2FA verification result
 */
function createVerificationResult(isValid, method = 'totp', metadata = {}) {
  return {
    isValid,
    method, // 'totp' or 'backup'
    timestamp: new Date(),
    ...metadata
  };
}

/**
 * Check if 2FA setup is complete
 */
function is2FASetupComplete(user) {
  return !!(user.two_factor_enabled && user.two_factor_secret);
}

/**
 * Get 2FA status for user
 */
function get2FAStatus(user, sitewideEnabled = false) {
  return {
    sitewideEnabled,
    userEnabled: user.two_factor_enabled || false,
    setupComplete: is2FASetupComplete(user),
    hasBackupCodes: !!(user.two_factor_backup_codes),
    lastUsed: user.two_factor_last_used,
    isRequired: is2FARequired(user, sitewideEnabled)
  };
}

module.exports = {
  generateTwoFactorSecret,
  generateQRCode,
  verifyTwoFactorToken,
  generateBackupCodes,
  hashBackupCodes,
  verifyBackupCode,
  removeUsedBackupCode,
  is2FARequired,
  formatBackupCodesForDisplay,
  isValidTokenFormat,
  isValidBackupCodeFormat,
  generateSetupData,
  createVerificationResult,
  is2FASetupComplete,
  get2FAStatus
};