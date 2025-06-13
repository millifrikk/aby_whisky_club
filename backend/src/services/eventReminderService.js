const { NewsEvent, EventRSVP, User, SystemSetting } = require('../models');
const emailService = require('./emailService');
const { Op } = require('sequelize');

class EventReminderService {
  constructor() {
    this.reminderIntervals = new Map(); // Store active reminder intervals
  }

  // Start the event reminder scheduler
  async startScheduler() {
    console.log('Starting event reminder scheduler...');
    
    // Check for events to remind about every hour
    const checkInterval = 60 * 60 * 1000; // 1 hour
    
    this.schedulerInterval = setInterval(async () => {
      await this.checkAndSendReminders();
    }, checkInterval);

    // Run initial check
    await this.checkAndSendReminders();
  }

  // Stop the scheduler
  stopScheduler() {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }

    // Clear all reminder intervals
    this.reminderIntervals.forEach(interval => clearTimeout(interval));
    this.reminderIntervals.clear();
    
    console.log('Event reminder scheduler stopped');
  }

  // Check for events that need reminders and send them
  async checkAndSendReminders() {
    try {
      const eventReminderDays = await SystemSetting.getSetting('event_reminder_days', 3);
      
      if (!eventReminderDays || eventReminderDays <= 0) {
        return; // Reminders disabled
      }

      const reminderDate = new Date();
      reminderDate.setDate(reminderDate.getDate() + eventReminderDays);

      // Find events that are happening within the reminder window
      const upcomingEvents = await NewsEvent.findAll({
        where: {
          type: 'event',
          is_published: true,
          date: {
            [Op.gte]: new Date(), // Event hasn't passed
            [Op.lte]: reminderDate // Event is within reminder window
          }
        },
        include: [
          {
            model: EventRSVP,
            as: 'rsvps',
            where: { status: 'attending' },
            required: false,
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'email', 'first_name', 'last_name', 'username', 'email_notifications_enabled']
              }
            ]
          }
        ]
      });

      console.log(`Found ${upcomingEvents.length} upcoming events to check for reminders`);

      for (const event of upcomingEvents) {
        await this.processEventReminders(event, eventReminderDays);
      }

    } catch (error) {
      console.error('Event reminder check error:', error);
    }
  }

  // Process reminders for a specific event
  async processEventReminders(event, reminderDays) {
    try {
      const eventDate = new Date(event.date);
      const reminderDate = new Date(eventDate);
      reminderDate.setDate(reminderDate.getDate() - reminderDays);

      const now = new Date();
      const timeDiff = reminderDate.getTime() - now.getTime();

      // If reminder time is within the next 2 hours, send reminders
      if (timeDiff <= 2 * 60 * 60 * 1000 && timeDiff > -60 * 60 * 1000) {
        console.log(`Sending reminders for event: ${event.title}`);
        await this.sendEventReminders(event);
      }

    } catch (error) {
      console.error(`Error processing reminders for event ${event.id}:`, error);
    }
  }

  // Send reminders to all attendees of an event
  async sendEventReminders(event) {
    try {
      if (!event.rsvps || event.rsvps.length === 0) {
        console.log(`No attendees found for event: ${event.title}`);
        return;
      }

      const eventDate = new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      let remindersSent = 0;

      for (const rsvp of event.rsvps) {
        if (rsvp.user && rsvp.user.email_notifications_enabled) {
          try {
            await emailService.sendEventReminder(
              rsvp.user.email,
              rsvp.user.first_name || rsvp.user.username,
              event.title,
              eventDate
            );
            remindersSent++;
          } catch (emailError) {
            console.error(`Failed to send reminder to ${rsvp.user.email}:`, emailError);
          }
        }
      }

      console.log(`Sent ${remindersSent} event reminders for: ${event.title}`);

    } catch (error) {
      console.error('Send event reminders error:', error);
    }
  }

  // Manually send reminder for a specific event (admin function)
  async sendManualReminder(eventId) {
    try {
      const event = await NewsEvent.findByPk(eventId, {
        include: [
          {
            model: EventRSVP,
            as: 'rsvps',
            where: { status: 'attending' },
            required: false,
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'email', 'first_name', 'last_name', 'username', 'email_notifications_enabled']
              }
            ]
          }
        ]
      });

      if (!event) {
        throw new Error('Event not found');
      }

      if (event.type !== 'event') {
        throw new Error('Can only send reminders for events');
      }

      await this.sendEventReminders(event);
      return { success: true, message: 'Manual reminder sent successfully' };

    } catch (error) {
      console.error('Manual reminder error:', error);
      return { success: false, message: error.message };
    }
  }

  // Schedule a reminder for a specific event at a specific time
  async scheduleEventReminder(eventId, reminderDate) {
    try {
      const now = new Date();
      const delay = reminderDate.getTime() - now.getTime();

      if (delay <= 0) {
        // Reminder time has passed, don't schedule
        return false;
      }

      // Clear existing reminder for this event if any
      if (this.reminderIntervals.has(eventId)) {
        clearTimeout(this.reminderIntervals.get(eventId));
      }

      // Schedule new reminder
      const timeoutId = setTimeout(async () => {
        const event = await NewsEvent.findByPk(eventId, {
          include: [
            {
              model: EventRSVP,
              as: 'rsvps',
              where: { status: 'attending' },
              required: false,
              include: [
                {
                  model: User,
                  as: 'user',
                  attributes: ['id', 'email', 'first_name', 'last_name', 'username', 'email_notifications_enabled']
                }
              ]
            }
          ]
        });

        if (event) {
          await this.sendEventReminders(event);
        }

        // Remove from intervals map
        this.reminderIntervals.delete(eventId);
      }, delay);

      this.reminderIntervals.set(eventId, timeoutId);
      console.log(`Scheduled reminder for event ${eventId} at ${reminderDate}`);
      return true;

    } catch (error) {
      console.error('Schedule event reminder error:', error);
      return false;
    }
  }

  // Cancel a scheduled reminder
  cancelEventReminder(eventId) {
    if (this.reminderIntervals.has(eventId)) {
      clearTimeout(this.reminderIntervals.get(eventId));
      this.reminderIntervals.delete(eventId);
      console.log(`Cancelled reminder for event ${eventId}`);
      return true;
    }
    return false;
  }

  // Get status of event reminder system
  getStatus() {
    return {
      schedulerActive: !!this.schedulerInterval,
      activeReminders: this.reminderIntervals.size,
      scheduledEvents: Array.from(this.reminderIntervals.keys())
    };
  }

  // Send weekly digest to all users (if enabled)
  async sendWeeklyDigest() {
    try {
      const weeklyDigestEnabled = await SystemSetting.getSetting('weekly_digest_enabled', false);
      
      if (!weeklyDigestEnabled) {
        return false;
      }

      // Get upcoming events for the next week
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const upcomingEvents = await NewsEvent.findAll({
        where: {
          type: 'event',
          is_published: true,
          date: {
            [Op.gte]: new Date(),
            [Op.lte]: nextWeek
          }
        },
        order: [['date', 'ASC']],
        limit: 5
      });

      // Get all users who want email notifications
      const users = await User.findAll({
        where: {
          email_notifications_enabled: true,
          is_active: true,
          approval_status: 'approved'
        }
      });

      console.log(`Sending weekly digest to ${users.length} users`);

      for (const user of users) {
        try {
          await this.sendWeeklyDigestEmail(user, upcomingEvents);
        } catch (emailError) {
          console.error(`Failed to send weekly digest to ${user.email}:`, emailError);
        }
      }

      return true;

    } catch (error) {
      console.error('Weekly digest error:', error);
      return false;
    }
  }

  // Send weekly digest email to a user
  async sendWeeklyDigestEmail(user, upcomingEvents) {
    const emailSettings = await emailService.getEmailSettings();
    
    let eventsHtml = '';
    if (upcomingEvents.length > 0) {
      eventsHtml = '<h3>Upcoming Events This Week:</h3><ul>';
      upcomingEvents.forEach(event => {
        const eventDate = new Date(event.date).toLocaleDateString();
        eventsHtml += `<li><strong>${event.title}</strong> - ${eventDate}</li>`;
      });
      eventsHtml += '</ul>';
    } else {
      eventsHtml = '<p>No upcoming events this week.</p>';
    }

    const template = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d97706;">Åby Whisky Club Weekly Digest</h2>
        <p>Hello ${user.first_name || user.username},</p>
        <p>Here's what's happening at Åby Whisky Club this week:</p>
        ${eventsHtml}
        <p>Visit our website to RSVP for events and explore our whisky collection!</p>
        <p><a href="http://localhost:3000" style="background-color: #d97706; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Visit Åby Whisky Club</a></p>
      </div>
    `;

    await emailService.sendEmail(
      user.email,
      'Åby Whisky Club Weekly Digest',
      template
    );
  }
}

// Create singleton instance
const eventReminderService = new EventReminderService();

module.exports = eventReminderService;