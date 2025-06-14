const { User, SystemSetting } = require('../models');
const { 
  generateSetupData, 
  verifyTwoFactorToken, 
  get2FAStatus,
  is2FARequired
} = require('../utils/twoFactorAuth');

class TwoFactorController {
  // Get 2FA status for current user
  static async getStatus(req, res) {
    try {
      const user = await User.findByPk(req.user.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if 2FA is enabled site-wide
      const sitewideEnabled = await SystemSetting.getSetting('enable_two_factor_auth', false);
      
      const status = get2FAStatus(user, sitewideEnabled);
      
      res.json({
        success: true,
        status: {
          ...status,
          remainingBackupCodes: user.getRemainingBackupCodes()
        }
      });
    } catch (error) {
      console.error('2FA status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get 2FA status'
      });
    }
  }

  // Setup 2FA for user (generate secret and QR code)
  static async setupInit(req, res) {
    try {
      const user = await User.findByPk(req.user.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if 2FA is enabled site-wide
      const sitewideEnabled = await SystemSetting.getSetting('enable_two_factor_auth', false);
      
      if (!sitewideEnabled) {
        return res.status(403).json({
          success: false,
          message: 'Two-factor authentication is not enabled on this site'
        });
      }

      if (user.two_factor_enabled) {
        return res.status(400).json({
          success: false,
          message: '2FA is already enabled for this user'
        });
      }

      const setupData = await generateSetupData(user.email);
      
      // Store the secret temporarily in session or temporary field
      // For security, we'll send it back but not save it until verification
      res.json({
        success: true,
        setup: {
          qrCodeUrl: setupData.qrCodeUrl,
          secret: setupData.secret,
          backupCodes: setupData.backupCodes
        }
      });
    } catch (error) {
      console.error('2FA setup init error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initialize 2FA setup'
      });
    }
  }

  // Verify and enable 2FA
  static async setupVerify(req, res) {
    try {
      const { token, secret, backupCodes } = req.body;
      
      if (!token || !secret) {
        return res.status(400).json({
          success: false,
          message: 'Token and secret are required'
        });
      }

      const user = await User.findByPk(req.user.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.two_factor_enabled) {
        return res.status(400).json({
          success: false,
          message: '2FA is already enabled for this user'
        });
      }

      // Verify the token with the provided secret
      const isValid = verifyTwoFactorToken(secret, token);
      
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid verification token'
        });
      }

      // Enable 2FA for the user
      await user.enable2FA(secret, backupCodes);
      
      res.json({
        success: true,
        message: '2FA has been successfully enabled',
        status: user.get2FAStatus()
      });
    } catch (error) {
      console.error('2FA setup verify error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify and enable 2FA'
      });
    }
  }

  // Disable 2FA
  static async disable(req, res) {
    try {
      const { password, token } = req.body;
      
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to disable 2FA'
        });
      }

      const user = await User.findByPk(req.user.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Invalid password'
        });
      }

      if (!user.two_factor_enabled) {
        return res.status(400).json({
          success: false,
          message: '2FA is not enabled for this user'
        });
      }

      // If 2FA is enabled, require 2FA token to disable
      if (token) {
        const verification = await user.verify2FA(token);
        if (!verification.success) {
          return res.status(400).json({
            success: false,
            message: 'Invalid 2FA token'
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: '2FA token is required to disable 2FA'
        });
      }

      // Disable 2FA
      await user.disable2FA();
      
      res.json({
        success: true,
        message: '2FA has been successfully disabled'
      });
    } catch (error) {
      console.error('2FA disable error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to disable 2FA'
      });
    }
  }

  // Regenerate backup codes
  static async regenerateBackupCodes(req, res) {
    try {
      const { password, token } = req.body;
      
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required'
        });
      }

      const user = await User.findByPk(req.user.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Invalid password'
        });
      }

      if (!user.two_factor_enabled) {
        return res.status(400).json({
          success: false,
          message: '2FA is not enabled for this user'
        });
      }

      // Verify 2FA token
      if (token) {
        const verification = await user.verify2FA(token);
        if (!verification.success) {
          return res.status(400).json({
            success: false,
            message: 'Invalid 2FA token'
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: '2FA token is required'
        });
      }

      // Generate new backup codes
      const newCodes = await user.regenerateBackupCodes();
      const { formatBackupCodesForDisplay } = require('../utils/twoFactorAuth');
      
      res.json({
        success: true,
        message: 'Backup codes have been regenerated',
        backupCodes: formatBackupCodesForDisplay(newCodes)
      });
    } catch (error) {
      console.error('2FA regenerate codes error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to regenerate backup codes'
      });
    }
  }

  // Verify 2FA token (for login or sensitive operations)
  static async verifyToken(req, res) {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required'
        });
      }

      const user = await User.findByPk(req.user.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.two_factor_enabled) {
        return res.status(400).json({
          success: false,
          message: '2FA is not enabled for this user'
        });
      }

      const verification = await user.verify2FA(token);
      
      if (verification.success) {
        res.json({
          success: true,
          message: '2FA token verified successfully',
          method: verification.method,
          ...(verification.remaining_codes !== undefined && {
            remainingBackupCodes: verification.remaining_codes
          })
        });
      } else {
        res.status(400).json({
          success: false,
          message: verification.error || 'Invalid 2FA token'
        });
      }
    } catch (error) {
      console.error('2FA verify token error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify 2FA token'
      });
    }
  }
}

module.exports = TwoFactorController;