const axios = require('axios');
const { SystemSetting } = require('../models');

/**
 * Third-party integration management system
 * Supports various external services and APIs
 */

/**
 * Available third-party integrations
 */
const AVAILABLE_INTEGRATIONS = {
  slack: {
    name: 'Slack',
    description: 'Send notifications to Slack channels',
    requiredSettings: ['slack_webhook_url'],
    endpoints: {
      webhook: 'https://hooks.slack.com/services/'
    }
  },
  discord: {
    name: 'Discord',
    description: 'Send notifications to Discord channels',
    requiredSettings: ['discord_webhook_url'],
    endpoints: {
      webhook: 'https://discord.com/api/webhooks/'
    }
  },
  mailchimp: {
    name: 'Mailchimp',
    description: 'Email marketing integration',
    requiredSettings: ['mailchimp_api_key', 'mailchimp_list_id'],
    endpoints: {
      api: 'https://api.mailchimp.com/3.0/'
    }
  },
  zapier: {
    name: 'Zapier',
    description: 'Automation platform integration',
    requiredSettings: ['zapier_webhook_url'],
    endpoints: {
      webhook: 'https://hooks.zapier.com/hooks/catch/'
    }
  },
  google_analytics: {
    name: 'Google Analytics',
    description: 'Web analytics tracking',
    requiredSettings: ['ga_tracking_id'],
    endpoints: {
      api: 'https://www.google-analytics.com/collect'
    }
  },
  telegram: {
    name: 'Telegram',
    description: 'Send notifications to Telegram channels',
    requiredSettings: ['telegram_bot_token', 'telegram_chat_id'],
    endpoints: {
      api: 'https://api.telegram.org/bot'
    }
  }
};

/**
 * Get enabled third-party integrations from settings
 */
async function getEnabledIntegrations() {
  try {
    const setting = await SystemSetting.findOne({
      where: { key: 'third_party_integrations' }
    });
    
    if (!setting || !setting.value) {
      return [];
    }
    
    const enabledKeys = setting.value.split(',').map(s => s.trim()).filter(Boolean);
    return enabledKeys.filter(key => AVAILABLE_INTEGRATIONS[key]);
  } catch (error) {
    console.error('Error fetching enabled integrations:', error);
    return [];
  }
}

/**
 * Get integration settings for a specific service
 */
async function getIntegrationSettings(integrationKey) {
  try {
    const integration = AVAILABLE_INTEGRATIONS[integrationKey];
    if (!integration) {
      throw new Error(`Unknown integration: ${integrationKey}`);
    }
    
    const settings = {};
    
    for (const settingKey of integration.requiredSettings) {
      const setting = await SystemSetting.findOne({
        where: { key: settingKey }
      });
      
      if (setting) {
        settings[settingKey] = setting.value;
      }
    }
    
    return settings;
  } catch (error) {
    console.error(`Error fetching settings for ${integrationKey}:`, error);
    return {};
  }
}

/**
 * Test integration connectivity
 */
async function testIntegration(integrationKey) {
  try {
    const integration = AVAILABLE_INTEGRATIONS[integrationKey];
    if (!integration) {
      return { success: false, error: `Unknown integration: ${integrationKey}` };
    }
    
    const settings = await getIntegrationSettings(integrationKey);
    
    // Check if all required settings are present
    const missingSettings = integration.requiredSettings.filter(
      key => !settings[key]
    );
    
    if (missingSettings.length > 0) {
      return {
        success: false,
        error: `Missing required settings: ${missingSettings.join(', ')}`
      };
    }
    
    // Perform integration-specific test
    switch (integrationKey) {
      case 'slack':
        return await testSlackIntegration(settings);
      case 'discord':
        return await testDiscordIntegration(settings);
      case 'telegram':
        return await testTelegramIntegration(settings);
      case 'mailchimp':
        return await testMailchimpIntegration(settings);
      default:
        return { success: true, message: 'Integration configured (no test available)' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Send notification via integration
 */
async function sendIntegrationNotification(integrationKey, message, data = {}) {
  try {
    const enabledIntegrations = await getEnabledIntegrations();
    
    if (!enabledIntegrations.includes(integrationKey)) {
      return { success: false, error: `Integration ${integrationKey} not enabled` };
    }
    
    const settings = await getIntegrationSettings(integrationKey);
    
    switch (integrationKey) {
      case 'slack':
        return await sendSlackNotification(settings, message, data);
      case 'discord':
        return await sendDiscordNotification(settings, message, data);
      case 'telegram':
        return await sendTelegramNotification(settings, message, data);
      case 'zapier':
        return await sendZapierNotification(settings, message, data);
      default:
        return { success: false, error: `No notification handler for ${integrationKey}` };
    }
  } catch (error) {
    console.error(`Integration notification error (${integrationKey}):`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Slack integration functions
 */
async function testSlackIntegration(settings) {
  try {
    const response = await axios.post(settings.slack_webhook_url, {
      text: '🧪 Test message from Åby Whisky Club',
      channel: '#general',
      username: 'Åby Whisky Club'
    });
    
    return { success: true, message: 'Slack integration test successful' };
  } catch (error) {
    return { success: false, error: `Slack test failed: ${error.message}` };
  }
}

async function sendSlackNotification(settings, message, data) {
  try {
    const payload = {
      text: message,
      channel: data.channel || '#general',
      username: 'Åby Whisky Club',
      icon_emoji: ':whisky:',
      attachments: data.attachments || []
    };
    
    const response = await axios.post(settings.slack_webhook_url, payload);
    return { success: true, message: 'Slack notification sent' };
  } catch (error) {
    return { success: false, error: `Slack notification failed: ${error.message}` };
  }
}

/**
 * Discord integration functions
 */
async function testDiscordIntegration(settings) {
  try {
    const response = await axios.post(settings.discord_webhook_url, {
      content: '🧪 Test message from Åby Whisky Club',
      username: 'Åby Whisky Club'
    });
    
    return { success: true, message: 'Discord integration test successful' };
  } catch (error) {
    return { success: false, error: `Discord test failed: ${error.message}` };
  }
}

async function sendDiscordNotification(settings, message, data) {
  try {
    const payload = {
      content: message,
      username: 'Åby Whisky Club',
      avatar_url: data.avatar_url,
      embeds: data.embeds || []
    };
    
    const response = await axios.post(settings.discord_webhook_url, payload);
    return { success: true, message: 'Discord notification sent' };
  } catch (error) {
    return { success: false, error: `Discord notification failed: ${error.message}` };
  }
}

/**
 * Telegram integration functions
 */
async function testTelegramIntegration(settings) {
  try {
    const url = `${AVAILABLE_INTEGRATIONS.telegram.endpoints.api}${settings.telegram_bot_token}/sendMessage`;
    
    const response = await axios.post(url, {
      chat_id: settings.telegram_chat_id,
      text: '🧪 Test message from Åby Whisky Club'
    });
    
    return { success: true, message: 'Telegram integration test successful' };
  } catch (error) {
    return { success: false, error: `Telegram test failed: ${error.message}` };
  }
}

async function sendTelegramNotification(settings, message, data) {
  try {
    const url = `${AVAILABLE_INTEGRATIONS.telegram.endpoints.api}${settings.telegram_bot_token}/sendMessage`;
    
    const payload = {
      chat_id: settings.telegram_chat_id,
      text: message,
      parse_mode: data.parse_mode || 'Markdown'
    };
    
    const response = await axios.post(url, payload);
    return { success: true, message: 'Telegram notification sent' };
  } catch (error) {
    return { success: false, error: `Telegram notification failed: ${error.message}` };
  }
}

/**
 * Mailchimp integration functions
 */
async function testMailchimpIntegration(settings) {
  try {
    const apiKey = settings.mailchimp_api_key;
    const dc = apiKey.split('-')[1]; // Extract datacenter from API key
    const url = `https://${dc}.api.mailchimp.com/3.0/ping`;
    
    const response = await axios.get(url, {
      auth: {
        username: 'anystring',
        password: apiKey
      }
    });
    
    return { success: true, message: 'Mailchimp integration test successful' };
  } catch (error) {
    return { success: false, error: `Mailchimp test failed: ${error.message}` };
  }
}

/**
 * Zapier integration functions
 */
async function sendZapierNotification(settings, message, data) {
  try {
    const payload = {
      message: message,
      timestamp: new Date().toISOString(),
      source: 'Åby Whisky Club',
      ...data
    };
    
    const response = await axios.post(settings.zapier_webhook_url, payload);
    return { success: true, message: 'Zapier notification sent' };
  } catch (error) {
    return { success: false, error: `Zapier notification failed: ${error.message}` };
  }
}

/**
 * Broadcast notification to all enabled integrations
 */
async function broadcastNotification(message, data = {}) {
  try {
    const enabledIntegrations = await getEnabledIntegrations();
    const results = [];
    
    for (const integrationKey of enabledIntegrations) {
      try {
        const result = await sendIntegrationNotification(integrationKey, message, data);
        results.push({
          integration: integrationKey,
          ...result
        });
      } catch (error) {
        results.push({
          integration: integrationKey,
          success: false,
          error: error.message
        });
      }
    }
    
    return { success: true, results };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  AVAILABLE_INTEGRATIONS,
  getEnabledIntegrations,
  getIntegrationSettings,
  testIntegration,
  sendIntegrationNotification,
  broadcastNotification
};