const { User, SystemSetting } = require('../models');
const { generateToken } = require('../middleware/auth');
const { Op } = require('sequelize');
const emailService = require('../services/emailService');
const crypto = require('crypto');

class AuthController {
  // User registration
  static async register(req, res) {
    try {
      const { username, email, password, first_name, last_name } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { email: email },
            { username: username }
          ]
        }
      });

      if (existingUser) {
        return res.status(409).json({
          error: 'User already exists',
          message: existingUser.email === email 
            ? 'Email is already registered' 
            : 'Username is already taken'
        });
      }

      // Check if registration is allowed
      const allowRegistration = await SystemSetting.getSetting('allow_registration', true);
      if (!allowRegistration) {
        return res.status(403).json({
          error: 'Registration disabled',
          message: 'New user registration is currently disabled. Please contact an administrator.'
        });
      }

      // Check registration settings
      const registrationApprovalRequired = await SystemSetting.getSetting('registration_approval_required', false);
      const requireEmailVerification = await SystemSetting.getSetting('require_email_verification', false);
      
      // Determine approval status
      const approvalStatus = registrationApprovalRequired ? 'pending' : 'approved';
      
      // Determine email verification status
      const emailVerified = !requireEmailVerification; // If verification not required, mark as verified
      
      // Create new user
      const user = await User.create({
        username,
        email,
        password_hash: password, // Will be hashed by the model hook
        first_name,
        last_name,
        role: 'member', // Default role
        approval_status: approvalStatus,
        approval_date: approvalStatus === 'approved' ? new Date() : null,
        email_verified: emailVerified
      });

      // Send email verification if required
      if (requireEmailVerification && !emailVerified) {
        user.generateEmailVerificationToken();
        await user.save();
        
        try {
          await emailService.sendEmailVerification(
            user.email,
            user.first_name || user.username,
            user.email_verification_token
          );
        } catch (emailError) {
          console.error('Email verification sending failed:', emailError);
        }
      }

      // Send welcome email if user is approved and doesn't need verification
      if (approvalStatus === 'approved' && emailVerified) {
        try {
          await emailService.sendWelcomeEmail(
            user.email,
            user.first_name || user.username
          );
        } catch (emailError) {
          console.error('Welcome email sending failed:', emailError);
        }
      }

      if (registrationApprovalRequired) {
        // User needs approval - don't generate token or log them in
        const message = requireEmailVerification 
          ? 'Registration submitted successfully. Please check your email for verification and wait for admin approval.'
          : 'Your account is pending approval by an administrator. You will be notified when your account is approved.';
          
        res.status(201).json({
          message: 'Registration submitted successfully',
          user: user.toSafeObject(),
          requiresApproval: true,
          requiresEmailVerification: requireEmailVerification,
          approvalMessage: message
        });
      } else if (requireEmailVerification) {
        // Email verification required but no approval needed
        res.status(201).json({
          message: 'Registration successful',
          user: user.toSafeObject(),
          requiresApproval: false,
          requiresEmailVerification: true,
          verificationMessage: 'Please check your email and click the verification link to complete your registration.'
        });
      } else {
        // Generate token and log user in (no approval or verification needed)
        const token = generateToken({ 
          userId: user.id, 
          email: user.email, 
          role: user.role 
        });

        // Update last login
        await user.update({ last_login: new Date() });

        res.status(201).json({
          message: 'User registered successfully',
          user: user.toSafeObject(),
          token,
          requiresApproval: false,
          requiresEmailVerification: false
        });
      }

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Registration failed',
        message: 'An error occurred during registration'
      });
    }
  }

  // User login
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({ 
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid email or password'
        });
      }

      // Check if account is locked
      if (user.isAccountLocked()) {
        const lockTimeRemaining = Math.ceil((user.account_locked_until.getTime() - new Date().getTime()) / (1000 * 60));
        return res.status(423).json({
          error: 'Account locked',
          message: `Account is temporarily locked due to too many failed login attempts. Please try again in ${lockTimeRemaining} minute(s).`,
          lockedUntil: user.account_locked_until
        });
      }

      // Check if account is active
      if (!user.is_active) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Account is inactive. Please contact an administrator.'
        });
      }

      // Check approval status
      if (user.approval_status === 'pending') {
        return res.status(401).json({
          error: 'Account pending approval',
          message: 'Your account is pending approval by an administrator. Please wait for approval before signing in.'
        });
      }

      if (user.approval_status === 'rejected') {
        return res.status(401).json({
          error: 'Account rejected',
          message: 'Your account registration has been rejected. Please contact an administrator for more information.'
        });
      }

      // Check email verification status
      if (!user.email_verified) {
        return res.status(401).json({
          error: 'Email not verified',
          message: 'Please verify your email address before signing in. Check your email for a verification link.'
        });
      }

      // Validate password
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        // Get security settings
        const { getSecuritySettings } = require('../utils/securityUtils');
        const securitySettings = await getSecuritySettings();
        
        // Increment failed attempts with dynamic settings
        await user.incrementFailedAttempts(
          securitySettings.loginAttemptLimit,
          securitySettings.accountLockoutDuration
        );
        
        const remainingAttempts = securitySettings.loginAttemptLimit - user.failed_login_attempts;
        const lockoutDuration = securitySettings.accountLockoutDuration;
        
        const message = user.isAccountLocked() 
          ? `Account has been temporarily locked due to too many failed login attempts. Please try again in ${lockoutDuration} minutes.`
          : remainingAttempts > 0 
            ? `Invalid email or password. ${remainingAttempts} attempt(s) remaining before account is locked.`
            : 'Invalid email or password';
            
        return res.status(401).json({
          error: 'Authentication failed',
          message,
          remainingAttempts: user.isAccountLocked() ? 0 : remainingAttempts
        });
      }

      // Check if 2FA is required
      const sitewideEnabled = await SystemSetting.getSetting('enable_two_factor_auth', false);
      const requires2FA = user.two_factor_enabled && sitewideEnabled;

      if (requires2FA) {
        // 2FA is required - don't complete login yet
        return res.json({
          message: '2FA verification required',
          requires2FA: true,
          tempUserId: user.id, // Temporary identifier for 2FA verification
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            two_factor_enabled: user.two_factor_enabled
          }
        });
      }

      // Successful login - reset failed attempts
      if (user.failed_login_attempts > 0) {
        await user.resetFailedAttempts();
      }

      // Generate token
      const token = generateToken({ 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      });

      // Update last login
      await user.update({ last_login: new Date() });

      res.json({
        message: 'Login successful',
        user: user.toSafeObject(),
        token
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Login failed',
        message: 'An error occurred during login'
      });
    }
  }

  // Complete 2FA login
  static async complete2FALogin(req, res) {
    try {
      const { tempUserId, token } = req.body;

      if (!tempUserId || !token) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'User ID and 2FA token are required'
        });
      }

      const user = await User.findByPk(tempUserId);
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'Invalid user ID'
        });
      }

      if (!user.two_factor_enabled) {
        return res.status(400).json({
          error: '2FA not enabled',
          message: '2FA is not enabled for this user'
        });
      }

      // Verify 2FA token
      const verification = await user.verify2FA(token);
      
      if (!verification.success) {
        return res.status(400).json({
          error: '2FA verification failed',
          message: verification.error || 'Invalid 2FA token'
        });
      }

      // Successful 2FA - complete login
      if (user.failed_login_attempts > 0) {
        await user.resetFailedAttempts();
      }

      // Generate token
      const authToken = generateToken({ 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      });

      // Update last login
      await user.update({ last_login: new Date() });

      res.json({
        message: '2FA verification successful',
        user: user.toSafeObject(),
        token: authToken,
        twoFactorMethod: verification.method,
        ...(verification.remaining_codes !== undefined && {
          remainingBackupCodes: verification.remaining_codes
        })
      });

    } catch (error) {
      console.error('2FA login completion error:', error);
      res.status(500).json({
        error: 'Login failed',
        message: 'An error occurred during 2FA verification'
      });
    }
  }

  // Get current user profile
  static async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password_hash'] },
        include: [
          {
            model: require('../models').Rating,
            as: 'ratings',
            limit: 5,
            order: [['created_at', 'DESC']],
            include: [
              {
                model: require('../models').Whisky,
                as: 'whisky',
                attributes: ['id', 'name', 'distillery']
              }
            ]
          }
        ]
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User profile not found'
        });
      }

      res.json({
        user: user.toJSON()
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: 'Failed to fetch profile',
        message: 'An error occurred while fetching user profile'
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const { first_name, last_name, bio, whisky_preferences } = req.body;
      
      const user = await User.findByPk(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User profile not found'
        });
      }

      // Update allowed fields
      const updatedUser = await user.update({
        first_name,
        last_name,
        bio,
        whisky_preferences
      });

      res.json({
        message: 'Profile updated successfully',
        user: updatedUser.toSafeObject()
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        error: 'Failed to update profile',
        message: 'An error occurred while updating profile'
      });
    }
  }

  // Change password
  static async changePassword(req, res) {
    try {
      const { current_password, new_password } = req.body;
      
      const user = await User.findByPk(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User not found'
        });
      }

      // Validate current password
      const isValidPassword = await user.validatePassword(current_password);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Current password is incorrect'
        });
      }

      // Update password
      await user.update({ password_hash: new_password });

      res.json({
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        error: 'Failed to change password',
        message: 'An error occurred while changing password'
      });
    }
  }

  // Logout (for future session management)
  static async logout(req, res) {
    try {
      // For JWT, logout is mainly handled client-side by removing the token
      // But we can add session invalidation here if using Redis sessions
      
      res.json({
        message: 'Logout successful'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: 'Logout failed',
        message: 'An error occurred during logout'
      });
    }
  }

  // Refresh token
  static async refreshToken(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password_hash'] }
      });

      if (!user || !user.is_active) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'User not found or inactive'
        });
      }

      // Generate new token
      const token = generateToken({ 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      });

      res.json({
        message: 'Token refreshed successfully',
        user: user.toJSON(),
        token
      });

    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({
        error: 'Token refresh failed',
        message: 'An error occurred while refreshing token'
      });
    }
  }

  // Get member directory (for authenticated users)
  static async getMemberDirectory(req, res) {
    try {
      // Check if member directory is enabled
      const memberDirectoryVisible = await SystemSetting.getSetting('member_directory_visible', false);
      
      if (!memberDirectoryVisible) {
        return res.status(403).json({
          error: 'Directory disabled',
          message: 'Member directory is currently disabled'
        });
      }

      // Get all active users with basic profile info
      const users = await User.findAll({
        where: { 
          is_active: true,
          approval_status: 'approved'
        },
        attributes: [
          'id', 'username', 'first_name', 'last_name', 'bio', 'profile_image', 'created_at'
        ],
        order: [
          ['first_name', 'ASC'],
          ['last_name', 'ASC'],
          ['username', 'ASC']
        ]
      });

      res.json({
        users: users.map(user => ({
          id: user.id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          bio: user.bio,
          profile_image: user.profile_image,
          created_at: user.created_at,
          rating_count: 0, // TODO: Add rating stats later
          avg_rating: null // TODO: Add rating stats later
        })),
        total: users.length
      });

    } catch (error) {
      console.error('Get member directory error:', error);
      res.status(500).json({
        error: 'Failed to fetch member directory',
        message: 'An error occurred while fetching the member directory'
      });
    }
  }

  // Request password reset
  static async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ where: { email: email.toLowerCase() } });

      if (!user) {
        // Don't reveal that email doesn't exist for security
        return res.json({
          message: 'If an account with that email exists, a password reset link has been sent.'
        });
      }

      // Generate password reset token
      user.generatePasswordResetToken();
      await user.save();

      // Send password reset email
      try {
        await emailService.sendPasswordResetEmail(
          user.email,
          user.first_name || user.username,
          user.password_reset_token
        );
      } catch (emailError) {
        console.error('Password reset email sending failed:', emailError);
      }

      res.json({
        message: 'If an account with that email exists, a password reset link has been sent.'
      });

    } catch (error) {
      console.error('Request password reset error:', error);
      res.status(500).json({
        error: 'Password reset request failed',
        message: 'An error occurred while processing the password reset request'
      });
    }
  }

  // Reset password with token
  static async resetPassword(req, res) {
    try {
      const { token, new_password } = req.body;

      const user = await User.findOne({ 
        where: { password_reset_token: token } 
      });

      if (!user || !user.isPasswordResetTokenValid(token)) {
        return res.status(400).json({
          error: 'Invalid or expired token',
          message: 'The password reset token is invalid or has expired'
        });
      }

      // Update password and clear reset token
      user.password_hash = new_password; // Will be hashed by model hook
      user.clearPasswordResetToken();
      await user.save();

      res.json({
        message: 'Password has been reset successfully'
      });

    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        error: 'Password reset failed',
        message: 'An error occurred while resetting the password'
      });
    }
  }

  // Verify email address
  static async verifyEmail(req, res) {
    try {
      const { token } = req.body;

      const user = await User.findOne({ 
        where: { email_verification_token: token } 
      });

      if (!user || !user.isEmailVerificationTokenValid(token)) {
        return res.status(400).json({
          error: 'Invalid or expired token',
          message: 'The email verification token is invalid or has expired'
        });
      }

      // Verify email and clear verification token
      user.clearEmailVerificationToken();
      await user.save();

      // Send welcome email if user is approved
      if (user.approval_status === 'approved') {
        try {
          await emailService.sendWelcomeEmail(
            user.email,
            user.first_name || user.username
          );
        } catch (emailError) {
          console.error('Welcome email sending failed:', emailError);
        }
      }

      res.json({
        message: 'Email verified successfully',
        user: user.toSafeObject()
      });

    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({
        error: 'Email verification failed',
        message: 'An error occurred while verifying the email'
      });
    }
  }

  // Resend email verification
  static async resendEmailVerification(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ 
        where: { 
          email: email.toLowerCase(),
          email_verified: false 
        } 
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'No unverified user found with that email address'
        });
      }

      // Generate new verification token
      user.generateEmailVerificationToken();
      await user.save();

      // Send verification email
      try {
        await emailService.sendEmailVerification(
          user.email,
          user.first_name || user.username,
          user.email_verification_token
        );
      } catch (emailError) {
        console.error('Email verification sending failed:', emailError);
        return res.status(500).json({
          error: 'Email sending failed',
          message: 'Failed to send verification email'
        });
      }

      res.json({
        message: 'Verification email sent successfully'
      });

    } catch (error) {
      console.error('Resend email verification error:', error);
      res.status(500).json({
        error: 'Failed to resend verification email',
        message: 'An error occurred while resending the verification email'
      });
    }
  }

  // Update notification preferences
  static async updateNotificationPreferences(req, res) {
    try {
      const { email_notifications_enabled } = req.body;
      
      const user = await User.findByPk(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User profile not found'
        });
      }

      await user.update({ email_notifications_enabled });

      res.json({
        message: 'Notification preferences updated successfully',
        user: user.toSafeObject()
      });

    } catch (error) {
      console.error('Update notification preferences error:', error);
      res.status(500).json({
        error: 'Failed to update notification preferences',
        message: 'An error occurred while updating notification preferences'
      });
    }
  }

  // Get password requirements
  static async getPasswordRequirements(req, res) {
    try {
      const { getSecuritySettings } = require('../utils/securityUtils');
      const securitySettings = await getSecuritySettings();
      
      // Default password complexity rules if not set
      const defaultRules = {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventCommonPasswords: true,
        preventPersonalInfo: true
      };
      
      const passwordComplexity = securitySettings.passwordComplexity || defaultRules;
      
      res.json({
        requirements: {
          minLength: passwordComplexity.minLength || 8,
          requireUppercase: passwordComplexity.requireUppercase !== false,
          requireLowercase: passwordComplexity.requireLowercase !== false,
          requireNumbers: passwordComplexity.requireNumbers !== false,
          requireSpecialChars: passwordComplexity.requireSpecialChars !== false,
          preventCommonPasswords: passwordComplexity.preventCommonPasswords !== false,
          preventPersonalInfo: passwordComplexity.preventPersonalInfo !== false
        }
      });

    } catch (error) {
      console.error('Get password requirements error:', error);
      res.status(500).json({
        error: 'Failed to get password requirements',
        message: 'An error occurred while fetching password requirements'
      });
    }
  }

  // Get session information
  static async getSessionInfo(req, res) {
    try {
      const { getSecuritySettings } = require('../utils/securityUtils');
      const securitySettings = await getSecuritySettings();
      
      const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'email', 'last_login', 'created_at']
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User not found'
        });
      }

      // Calculate session expiry based on settings
      const sessionTimeoutHours = securitySettings.sessionTimeoutHours;
      const idleTimeoutMinutes = securitySettings.idleTimeoutMinutes;
      
      // For JWT, we need to decode the token to get issued time
      const jwt = require('jsonwebtoken');
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];
      
      let sessionExpiry = null;
      let idleExpiry = null;
      
      if (token) {
        try {
          const decoded = jwt.decode(token);
          const issuedAt = new Date(decoded.iat * 1000);
          sessionExpiry = new Date(issuedAt.getTime() + (sessionTimeoutHours * 60 * 60 * 1000));
          idleExpiry = new Date(Date.now() + (idleTimeoutMinutes * 60 * 1000));
        } catch (decodeError) {
          console.warn('Could not decode JWT for session info:', decodeError.message);
        }
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          lastLogin: user.last_login
        },
        session: {
          sessionTimeoutHours,
          idleTimeoutMinutes,
          sessionExpiry,
          idleExpiry,
          requiresRefresh: sessionExpiry && sessionExpiry < new Date(Date.now() + (30 * 60 * 1000)) // 30 minutes
        }
      });

    } catch (error) {
      console.error('Get session info error:', error);
      res.status(500).json({
        error: 'Failed to get session info',
        message: 'An error occurred while fetching session information'
      });
    }
  }
}

module.exports = AuthController;
