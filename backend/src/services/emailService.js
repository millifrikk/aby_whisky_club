const nodemailer = require('nodemailer');
const { SystemSetting } = require('../models');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
  }

  // Initialize or reconfigure the email transporter
  async configureTransporter() {
    try {
      const emailSettings = await this.getEmailSettings();
      
      if (!emailSettings.smtp_host || !emailSettings.smtp_port) {
        console.log('Email service not configured - missing SMTP settings');
        this.isConfigured = false;
        return false;
      }

      const transportConfig = {
        host: emailSettings.smtp_host,
        port: parseInt(emailSettings.smtp_port),
        secure: parseInt(emailSettings.smtp_port) === 465, // true for 465, false for other ports
        auth: {
          user: emailSettings.smtp_username,
          pass: emailSettings.smtp_password
        }
      };

      // Create transporter
      this.transporter = nodemailer.createTransporter(transportConfig);

      // Verify connection
      await this.transporter.verify();
      
      this.isConfigured = true;
      console.log('Email service configured successfully');
      return true;

    } catch (error) {
      console.error('Email service configuration error:', error);
      this.isConfigured = false;
      return false;
    }
  }

  // Get email settings from database
  async getEmailSettings() {
    try {
      const settings = await SystemSetting.findAll({
        where: {
          category: 'email'
        }
      });

      const emailConfig = {};
      settings.forEach(setting => {
        emailConfig[setting.key] = setting.value;
      });

      return emailConfig;
    } catch (error) {
      console.error('Error fetching email settings:', error);
      return {};
    }
  }

  // Check if email service is configured and ready
  async isReady() {
    if (!this.isConfigured) {
      await this.configureTransporter();
    }
    return this.isConfigured;
  }

  // Send email with template
  async sendEmail(to, subject, template, templateData = {}) {
    try {
      if (!(await this.isReady())) {
        throw new Error('Email service not configured');
      }

      const emailSettings = await this.getEmailSettings();
      
      // Build email content
      let htmlContent = template;
      let textContent = template.replace(/<[^>]*>/g, ''); // Strip HTML for text version

      // Replace template variables
      for (const [key, value] of Object.entries(templateData)) {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        htmlContent = htmlContent.replace(placeholder, value);
        textContent = textContent.replace(placeholder, value);
      }

      // Add signature if enabled
      if (emailSettings.email_signature) {
        htmlContent += `<br><br>${emailSettings.email_signature.replace(/\n/g, '<br>')}`;
        textContent += `\n\n${emailSettings.email_signature}`;
      }

      const mailOptions = {
        from: `"Åby Whisky Club" <${emailSettings.smtp_username}>`,
        to: to,
        subject: subject,
        text: textContent,
        html: htmlContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return result;

    } catch (error) {
      console.error('Email sending error:', error);
      throw error;
    }
  }

  // Send welcome email to new users
  async sendWelcomeEmail(userEmail, userName) {
    try {
      const emailSettings = await this.getEmailSettings();
      
      if (!emailSettings.welcome_email_template) {
        console.log('Welcome email template not configured');
        return false;
      }

      const template = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d97706;">Welcome to Åby Whisky Club!</h2>
          <p>Hello {{userName}},</p>
          <p>${emailSettings.welcome_email_template}</p>
          <p>You can now:</p>
          <ul>
            <li>Browse our whisky collection</li>
            <li>Rate and review whiskies</li>
            <li>Join upcoming tasting events</li>
            <li>Connect with fellow whisky enthusiasts</li>
          </ul>
          <p>Visit our website to get started: <a href="http://localhost:3000">Åby Whisky Club</a></p>
        </div>
      `;

      await this.sendEmail(
        userEmail,
        'Welcome to Åby Whisky Club!',
        template,
        { userName }
      );

      return true;
    } catch (error) {
      console.error('Welcome email error:', error);
      return false;
    }
  }

  // Send rating notification
  async sendRatingNotification(userEmail, userName, whiskyName, raterName) {
    try {
      const emailSettings = await this.getEmailSettings();
      
      if (!emailSettings.rating_notification_enabled) {
        return false;
      }

      const template = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d97706;">New Rating on Your Whisky</h2>
          <p>Hello {{userName}},</p>
          <p><strong>{{raterName}}</strong> has just rated your whisky <strong>{{whiskyName}}</strong>!</p>
          <p>Check out the latest rating and see what they thought about it.</p>
          <p><a href="http://localhost:3000/whiskies" style="background-color: #d97706; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Ratings</a></p>
        </div>
      `;

      await this.sendEmail(
        userEmail,
        `New rating on ${whiskyName}`,
        template,
        { userName, whiskyName, raterName }
      );

      return true;
    } catch (error) {
      console.error('Rating notification error:', error);
      return false;
    }
  }

  // Send event reminder
  async sendEventReminder(userEmail, userName, eventTitle, eventDate) {
    try {
      const emailSettings = await this.getEmailSettings();
      
      if (!emailSettings.event_reminder_days) {
        return false;
      }

      const template = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d97706;">Upcoming Event Reminder</h2>
          <p>Hello {{userName}},</p>
          <p>Don't forget about the upcoming event you're registered for:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin: 0; color: #374151;">{{eventTitle}}</h3>
            <p style="margin: 5px 0 0 0; color: #6b7280;">{{eventDate}}</p>
          </div>
          <p>We're looking forward to seeing you there!</p>
          <p><a href="http://localhost:3000/events" style="background-color: #d97706; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Event Details</a></p>
        </div>
      `;

      await this.sendEmail(
        userEmail,
        `Reminder: ${eventTitle}`,
        template,
        { userName, eventTitle, eventDate }
      );

      return true;
    } catch (error) {
      console.error('Event reminder error:', error);
      return false;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(userEmail, userName, resetToken) {
    try {
      const template = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d97706;">Password Reset Request</h2>
          <p>Hello {{userName}},</p>
          <p>You requested to reset your password for your Åby Whisky Club account.</p>
          <p>Click the link below to reset your password (this link will expire in 1 hour):</p>
          <p><a href="http://localhost:3000/reset-password?token={{resetToken}}" style="background-color: #d97706; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
          <p>If you didn't request this password reset, you can safely ignore this email.</p>
        </div>
      `;

      await this.sendEmail(
        userEmail,
        'Password Reset Request',
        template,
        { userName, resetToken }
      );

      return true;
    } catch (error) {
      console.error('Password reset email error:', error);
      return false;
    }
  }

  // Send email verification
  async sendEmailVerification(userEmail, userName, verificationToken) {
    try {
      const template = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d97706;">Verify Your Email Address</h2>
          <p>Hello {{userName}},</p>
          <p>Please verify your email address to complete your registration with Åby Whisky Club.</p>
          <p>Click the link below to verify your email:</p>
          <p><a href="http://localhost:3000/verify-email?token={{verificationToken}}" style="background-color: #d97706; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
          <p>This verification link will expire in 24 hours.</p>
        </div>
      `;

      await this.sendEmail(
        userEmail,
        'Verify Your Email Address',
        template,
        { userName, verificationToken }
      );

      return true;
    } catch (error) {
      console.error('Email verification error:', error);
      return false;
    }
  }

  // Test email configuration
  async testConfiguration() {
    try {
      if (!(await this.isReady())) {
        return { success: false, message: 'Email service not configured' };
      }

      const emailSettings = await this.getEmailSettings();
      
      // Send test email to admin
      const testTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d97706;">Email Configuration Test</h2>
          <p>This is a test email to confirm your Åby Whisky Club email configuration is working correctly.</p>
          <p>✅ SMTP settings configured successfully</p>
          <p>✅ Email sending operational</p>
          <p><em>Sent from Åby Whisky Club Email Service</em></p>
        </div>
      `;

      await this.sendEmail(
        emailSettings.smtp_username,
        'Åby Whisky Club - Email Test',
        testTemplate
      );

      return { success: true, message: 'Test email sent successfully' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;