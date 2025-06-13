const emailService = require('../services/emailService');
const eventReminderService = require('../services/eventReminderService');
const { SystemSetting } = require('../models');

class EmailController {
  // Test email configuration
  static async testEmailConfiguration(req, res) {
    try {
      const result = await emailService.testConfiguration();
      
      if (result.success) {
        res.json({
          message: result.message,
          status: 'success'
        });
      } else {
        res.status(400).json({
          error: 'Email test failed',
          message: result.message,
          status: 'error'
        });
      }

    } catch (error) {
      console.error('Email test error:', error);
      res.status(500).json({
        error: 'Email test failed',
        message: 'An error occurred while testing email configuration'
      });
    }
  }

  // Get email settings status
  static async getEmailStatus(req, res) {
    try {
      const emailSettings = await emailService.getEmailSettings();
      const isConfigured = await emailService.isReady();
      
      // Don't expose sensitive settings
      const safeSettings = {
        smtp_host: emailSettings.smtp_host ? '***configured***' : null,
        smtp_port: emailSettings.smtp_port,
        smtp_username: emailSettings.smtp_username ? '***configured***' : null,
        welcome_email_template: emailSettings.welcome_email_template ? 'configured' : null,
        event_reminder_days: emailSettings.event_reminder_days,
        rating_notification_enabled: emailSettings.rating_notification_enabled,
        weekly_digest_enabled: emailSettings.weekly_digest_enabled,
        email_signature: emailSettings.email_signature ? 'configured' : null
      };

      res.json({
        configured: isConfigured,
        settings: safeSettings,
        status: isConfigured ? 'operational' : 'not configured'
      });

    } catch (error) {
      console.error('Email status error:', error);
      res.status(500).json({
        error: 'Failed to get email status',
        message: 'An error occurred while checking email configuration'
      });
    }
  }

  // Reconfigure email service (admin only)
  static async reconfigureEmailService(req, res) {
    try {
      const success = await emailService.configureTransporter();
      
      if (success) {
        res.json({
          message: 'Email service reconfigured successfully',
          status: 'operational'
        });
      } else {
        res.status(400).json({
          error: 'Email configuration failed',
          message: 'Failed to configure email service with current settings'
        });
      }

    } catch (error) {
      console.error('Email reconfiguration error:', error);
      res.status(500).json({
        error: 'Email reconfiguration failed',
        message: 'An error occurred while reconfiguring email service'
      });
    }
  }

  // Send test welcome email (admin only)
  static async sendTestWelcomeEmail(req, res) {
    try {
      const { email, name } = req.body;
      
      const success = await emailService.sendWelcomeEmail(email, name || 'Test User');
      
      if (success) {
        res.json({
          message: 'Test welcome email sent successfully'
        });
      } else {
        res.status(400).json({
          error: 'Email sending failed',
          message: 'Failed to send test welcome email'
        });
      }

    } catch (error) {
      console.error('Send test welcome email error:', error);
      res.status(500).json({
        error: 'Email sending failed',
        message: 'An error occurred while sending test welcome email'
      });
    }
  }

  // Send test event reminder (admin only)
  static async sendTestEventReminder(req, res) {
    try {
      const { email, name, eventTitle, eventDate } = req.body;
      
      const success = await emailService.sendEventReminder(
        email, 
        name || 'Test User',
        eventTitle || 'Test Event',
        eventDate || new Date().toLocaleDateString()
      );
      
      if (success) {
        res.json({
          message: 'Test event reminder sent successfully'
        });
      } else {
        res.status(400).json({
          error: 'Email sending failed',
          message: 'Failed to send test event reminder'
        });
      }

    } catch (error) {
      console.error('Send test event reminder error:', error);
      res.status(500).json({
        error: 'Email sending failed',
        message: 'An error occurred while sending test event reminder'
      });
    }
  }

  // Send test rating notification (admin only)
  static async sendTestRatingNotification(req, res) {
    try {
      const { email, userName, whiskyName, raterName } = req.body;
      
      const success = await emailService.sendRatingNotification(
        email,
        userName || 'Test User',
        whiskyName || 'Test Whisky',
        raterName || 'Another User'
      );
      
      if (success) {
        res.json({
          message: 'Test rating notification sent successfully'
        });
      } else {
        res.status(400).json({
          error: 'Email sending failed',
          message: 'Failed to send test rating notification'
        });
      }

    } catch (error) {
      console.error('Send test rating notification error:', error);
      res.status(500).json({
        error: 'Email sending failed',
        message: 'An error occurred while sending test rating notification'
      });
    }
  }

  // Get email settings for admin panel
  static async getEmailSettings(req, res) {
    try {
      const emailSettings = await emailService.getEmailSettings();
      
      res.json({
        settings: emailSettings
      });

    } catch (error) {
      console.error('Get email settings error:', error);
      res.status(500).json({
        error: 'Failed to get email settings',
        message: 'An error occurred while fetching email settings'
      });
    }
  }

  // Get event reminder service status
  static async getEventReminderStatus(req, res) {
    try {
      const status = eventReminderService.getStatus();
      
      res.json({
        status,
        message: 'Event reminder service status retrieved successfully'
      });

    } catch (error) {
      console.error('Get event reminder status error:', error);
      res.status(500).json({
        error: 'Failed to get event reminder status',
        message: 'An error occurred while checking event reminder status'
      });
    }
  }

  // Send manual event reminder
  static async sendManualEventReminder(req, res) {
    try {
      const { eventId } = req.params;
      
      const result = await eventReminderService.sendManualReminder(eventId);
      
      if (result.success) {
        res.json({
          message: result.message
        });
      } else {
        res.status(400).json({
          error: 'Failed to send reminder',
          message: result.message
        });
      }

    } catch (error) {
      console.error('Send manual event reminder error:', error);
      res.status(500).json({
        error: 'Failed to send reminder',
        message: 'An error occurred while sending event reminder'
      });
    }
  }

  // Send weekly digest manually
  static async sendWeeklyDigest(req, res) {
    try {
      const success = await eventReminderService.sendWeeklyDigest();
      
      if (success) {
        res.json({
          message: 'Weekly digest sent successfully'
        });
      } else {
        res.status(400).json({
          error: 'Weekly digest failed',
          message: 'Weekly digest is disabled or failed to send'
        });
      }

    } catch (error) {
      console.error('Send weekly digest error:', error);
      res.status(500).json({
        error: 'Failed to send weekly digest',
        message: 'An error occurred while sending weekly digest'
      });
    }
  }
}

module.exports = EmailController;