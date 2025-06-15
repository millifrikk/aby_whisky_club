const axios = require('axios');
const crypto = require('crypto');
const { SystemSetting } = require('../models');

/**
 * Webhook notification system for external integrations
 * Supports secure webhook delivery with signature verification
 */

/**
 * Get webhook settings from database
 */
async function getWebhookSettings() {
  try {
    const enabled = await SystemSetting.findOne({
      where: { key: 'enable_webhook_notifications' }
    });
    
    const endpoints = await SystemSetting.findOne({
      where: { key: 'webhook_endpoints' }
    });
    
    const secret = await SystemSetting.findOne({
      where: { key: 'webhook_secret' }
    });
    
    return {
      enabled: enabled ? enabled.value === 'true' : false,
      endpoints: endpoints ? JSON.parse(endpoints.value || '[]') : [],
      secret: secret ? secret.value : null
    };
  } catch (error) {
    console.error('Error fetching webhook settings:', error);
    return { enabled: false, endpoints: [], secret: null };
  }
}

/**
 * Generate webhook signature for security
 */
function generateSignature(payload, secret) {
  if (!secret) return null;
  
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return `sha256=${hmac.digest('hex')}`;
}

/**
 * Send webhook notification to registered endpoints
 */
async function sendWebhookNotification(eventType, data, userId = null) {
  try {
    const settings = await getWebhookSettings();
    
    if (!settings.enabled || settings.endpoints.length === 0) {
      return { success: true, message: 'Webhooks disabled or no endpoints configured' };
    }
    
    const payload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data: data,
      user_id: userId
    };
    
    const signature = generateSignature(payload, settings.secret);
    const results = [];
    
    // Send to all configured endpoints
    for (const endpoint of settings.endpoints) {
      try {
        const headers = {
          'Content-Type': 'application/json',
          'X-Webhook-Event': eventType,
          'X-Webhook-Timestamp': payload.timestamp,
          'User-Agent': 'AbyWhiskyClub-Webhook/1.0'
        };
        
        if (signature) {
          headers['X-Webhook-Signature'] = signature;
        }
        
        const response = await axios.post(endpoint.url, payload, {
          headers,
          timeout: endpoint.timeout || 5000,
          validateStatus: (status) => status < 500 // Retry on 5xx errors
        });
        
        results.push({
          endpoint: endpoint.url,
          status: response.status,
          success: true
        });
        
        console.log(`✅ Webhook sent to ${endpoint.url}: ${eventType}`);
      } catch (error) {
        results.push({
          endpoint: endpoint.url,
          status: error.response?.status || 0,
          success: false,
          error: error.message
        });
        
        console.error(`❌ Webhook failed for ${endpoint.url}:`, error.message);
      }
    }
    
    return { success: true, results };
  } catch (error) {
    console.error('Webhook notification error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Webhook event types and their data structures
 */
const WEBHOOK_EVENTS = {
  // User events
  USER_REGISTERED: 'user.registered',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  
  // Whisky events
  WHISKY_ADDED: 'whisky.added',
  WHISKY_UPDATED: 'whisky.updated',
  WHISKY_DELETED: 'whisky.deleted',
  WHISKY_RATED: 'whisky.rated',
  
  // Review events
  REVIEW_CREATED: 'review.created',
  REVIEW_UPDATED: 'review.updated',
  REVIEW_DELETED: 'review.deleted',
  
  // Event events
  EVENT_CREATED: 'event.created',
  EVENT_UPDATED: 'event.updated',
  EVENT_RSVP: 'event.rsvp',
  
  // News events
  NEWS_PUBLISHED: 'news.published',
  NEWS_UPDATED: 'news.updated',
  
  // System events
  SYSTEM_ERROR: 'system.error',
  SYSTEM_MAINTENANCE: 'system.maintenance'
};

/**
 * Convenience functions for common webhook events
 */

async function notifyUserRegistered(user) {
  return sendWebhookNotification(WEBHOOK_EVENTS.USER_REGISTERED, {
    id: user.id,
    username: user.username,
    email: user.email,
    created_at: user.created_at
  }, user.id);
}

async function notifyWhiskyAdded(whisky, userId) {
  return sendWebhookNotification(WEBHOOK_EVENTS.WHISKY_ADDED, {
    id: whisky.id,
    name: whisky.name,
    distillery: whisky.distillery,
    region: whisky.region,
    age: whisky.age,
    created_at: whisky.created_at
  }, userId);
}

async function notifyWhiskyRated(whisky, rating, userId) {
  return sendWebhookNotification(WEBHOOK_EVENTS.WHISKY_RATED, {
    whisky: {
      id: whisky.id,
      name: whisky.name,
      distillery: whisky.distillery
    },
    rating: {
      overall: rating.overall_rating,
      nose: rating.nose_rating,
      taste: rating.taste_rating,
      finish: rating.finish_rating
    },
    user_id: userId
  }, userId);
}

async function notifyEventCreated(event, userId) {
  return sendWebhookNotification(WEBHOOK_EVENTS.EVENT_CREATED, {
    id: event.id,
    title: event.title,
    date: event.date,
    location: event.location,
    max_guests: event.max_guests,
    created_at: event.created_at
  }, userId);
}

async function notifyEventRSVP(event, user, status) {
  return sendWebhookNotification(WEBHOOK_EVENTS.EVENT_RSVP, {
    event: {
      id: event.id,
      title: event.title,
      date: event.date
    },
    user: {
      id: user.id,
      username: user.username
    },
    rsvp_status: status,
    timestamp: new Date().toISOString()
  }, user.id);
}

async function notifyReviewCreated(review, whisky, userId) {
  return sendWebhookNotification(WEBHOOK_EVENTS.REVIEW_CREATED, {
    review: {
      id: review.id,
      content: review.content,
      rating: review.rating,
      created_at: review.created_at
    },
    whisky: {
      id: whisky.id,
      name: whisky.name,
      distillery: whisky.distillery
    }
  }, userId);
}

async function notifySystemError(error, context = {}) {
  return sendWebhookNotification(WEBHOOK_EVENTS.SYSTEM_ERROR, {
    error: {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    },
    context: context
  });
}

/**
 * Test webhook endpoint connectivity
 */
async function testWebhookEndpoint(url) {
  try {
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: { message: 'Test webhook from Åby Whisky Club' }
    };
    
    const response = await axios.post(url, testPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Event': 'webhook.test',
        'User-Agent': 'AbyWhiskyClub-Webhook/1.0'
      },
      timeout: 5000
    });
    
    return {
      success: true,
      status: response.status,
      message: 'Webhook endpoint is reachable'
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 0,
      message: error.message
    };
  }
}

/**
 * Validate webhook signature (for incoming webhooks)
 */
function validateWebhookSignature(payload, signature, secret) {
  if (!signature || !secret) return false;
  
  const expectedSignature = generateSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

module.exports = {
  sendWebhookNotification,
  WEBHOOK_EVENTS,
  
  // Convenience functions
  notifyUserRegistered,
  notifyWhiskyAdded,
  notifyWhiskyRated,
  notifyEventCreated,
  notifyEventRSVP,
  notifyReviewCreated,
  notifySystemError,
  
  // Utility functions
  testWebhookEndpoint,
  validateWebhookSignature,
  generateSignature,
  getWebhookSettings
};