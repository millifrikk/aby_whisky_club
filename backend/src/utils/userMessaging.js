const { Op, Sequelize } = require('sequelize');
const { SystemSetting } = require('../models');

/**
 * User messaging system for direct communication
 * Provides secure messaging between club members
 */

/**
 * Check if user messaging is enabled
 */
async function isUserMessagingEnabled() {
  try {
    const setting = await SystemSetting.findOne({
      where: { key: 'enable_user_messaging' }
    });
    return setting ? setting.value === 'true' : false;
  } catch (error) {
    console.error('Error checking user messaging setting:', error);
    return false;
  }
}

/**
 * Send a message between users
 */
async function sendMessage(fromUserId, toUserId, subject, content, parentMessageId = null) {
  try {
    if (!await isUserMessagingEnabled()) {
      throw new Error('User messaging is currently disabled');
    }

    const { UserMessage, User } = require('../models');
    
    // Verify both users exist
    const [fromUser, toUser] = await Promise.all([
      User.findByPk(fromUserId),
      User.findByPk(toUserId)
    ]);
    
    if (!fromUser || !toUser) {
      throw new Error('One or both users not found');
    }
    
    // Check if users can message each other (not blocked, etc.)
    const canMessage = await canUsersMessage(fromUserId, toUserId);
    if (!canMessage.allowed) {
      throw new Error(canMessage.reason);
    }
    
    // Create the message
    const message = await UserMessage.create({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      subject: subject,
      content: content,
      parent_message_id: parentMessageId,
      is_read: false,
      sent_at: new Date()
    });
    
    // Mark as part of conversation thread
    if (parentMessageId) {
      await UserMessage.update(
        { conversation_id: parentMessageId },
        { where: { id: message.id } }
      );
    } else {
      await UserMessage.update(
        { conversation_id: message.id },
        { where: { id: message.id } }
      );
    }
    
    return {
      success: true,
      message_id: message.id,
      sent_at: message.sent_at
    };
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Check if two users can message each other
 */
async function canUsersMessage(fromUserId, toUserId) {
  try {
    const { UserBlock, UserPrivacySetting } = require('../models');
    
    // Check if either user has blocked the other
    const blockExists = await UserBlock.findOne({
      where: {
        [Op.or]: [
          { blocker_id: fromUserId, blocked_id: toUserId },
          { blocker_id: toUserId, blocked_id: fromUserId }
        ]
      }
    });
    
    if (blockExists) {
      return { allowed: false, reason: 'User interaction is blocked' };
    }
    
    // Check privacy settings
    const toUserPrivacy = await UserPrivacySetting.findOne({
      where: { user_id: toUserId }
    });
    
    if (toUserPrivacy && !toUserPrivacy.allow_messages) {
      return { allowed: false, reason: 'User has disabled receiving messages' };
    }
    
    return { allowed: true, reason: null };
  } catch (error) {
    console.error('Error checking message permissions:', error);
    return { allowed: false, reason: 'Unable to verify permissions' };
  }
}

/**
 * Get user's inbox with pagination
 */
async function getUserInbox(userId, page = 1, limit = 20) {
  try {
    if (!await isUserMessagingEnabled()) {
      return { error: 'User messaging is disabled' };
    }

    const { UserMessage, User } = require('../models');
    const offset = (page - 1) * limit;
    
    const messages = await UserMessage.findAndCountAll({
      where: { to_user_id: userId },
      include: [
        {
          model: User,
          as: 'fromUser',
          attributes: ['id', 'username', 'profile_image_url']
        }
      ],
      order: [['sent_at', 'DESC']],
      limit: limit,
      offset: offset
    });
    
    return {
      messages: messages.rows.map(msg => ({
        id: msg.id,
        from_user: {
          id: msg.fromUser.id,
          username: msg.fromUser.username,
          profile_image_url: msg.fromUser.profile_image_url
        },
        subject: msg.subject,
        content: msg.content,
        is_read: msg.is_read,
        sent_at: msg.sent_at,
        conversation_id: msg.conversation_id
      })),
      pagination: {
        page: page,
        limit: limit,
        total: messages.count,
        pages: Math.ceil(messages.count / limit)
      }
    };
  } catch (error) {
    console.error('Error getting user inbox:', error);
    throw error;
  }
}

/**
 * Get user's sent messages
 */
async function getUserSentMessages(userId, page = 1, limit = 20) {
  try {
    if (!await isUserMessagingEnabled()) {
      return { error: 'User messaging is disabled' };
    }

    const { UserMessage, User } = require('../models');
    const offset = (page - 1) * limit;
    
    const messages = await UserMessage.findAndCountAll({
      where: { from_user_id: userId },
      include: [
        {
          model: User,
          as: 'toUser',
          attributes: ['id', 'username', 'profile_image_url']
        }
      ],
      order: [['sent_at', 'DESC']],
      limit: limit,
      offset: offset
    });
    
    return {
      messages: messages.rows.map(msg => ({
        id: msg.id,
        to_user: {
          id: msg.toUser.id,
          username: msg.toUser.username,
          profile_image_url: msg.toUser.profile_image_url
        },
        subject: msg.subject,
        content: msg.content,
        is_read: msg.is_read,
        sent_at: msg.sent_at,
        conversation_id: msg.conversation_id
      })),
      pagination: {
        page: page,
        limit: limit,
        total: messages.count,
        pages: Math.ceil(messages.count / limit)
      }
    };
  } catch (error) {
    console.error('Error getting sent messages:', error);
    throw error;
  }
}

/**
 * Get conversation thread
 */
async function getConversation(conversationId, userId) {
  try {
    if (!await isUserMessagingEnabled()) {
      return { error: 'User messaging is disabled' };
    }

    const { UserMessage, User } = require('../models');
    
    const messages = await UserMessage.findAll({
      where: {
        conversation_id: conversationId,
        [Op.or]: [
          { from_user_id: userId },
          { to_user_id: userId }
        ]
      },
      include: [
        {
          model: User,
          as: 'fromUser',
          attributes: ['id', 'username', 'profile_image_url']
        },
        {
          model: User,
          as: 'toUser',
          attributes: ['id', 'username', 'profile_image_url']
        }
      ],
      order: [['sent_at', 'ASC']]
    });
    
    return {
      conversation_id: conversationId,
      messages: messages.map(msg => ({
        id: msg.id,
        from_user: {
          id: msg.fromUser.id,
          username: msg.fromUser.username,
          profile_image_url: msg.fromUser.profile_image_url
        },
        to_user: {
          id: msg.toUser.id,
          username: msg.toUser.username,
          profile_image_url: msg.toUser.profile_image_url
        },
        subject: msg.subject,
        content: msg.content,
        is_read: msg.is_read,
        sent_at: msg.sent_at,
        is_mine: msg.from_user_id === userId
      }))
    };
  } catch (error) {
    console.error('Error getting conversation:', error);
    throw error;
  }
}

/**
 * Mark message as read
 */
async function markMessageAsRead(messageId, userId) {
  try {
    const { UserMessage } = require('../models');
    
    const result = await UserMessage.update(
      { is_read: true, read_at: new Date() },
      { 
        where: { 
          id: messageId, 
          to_user_id: userId, 
          is_read: false 
        } 
      }
    );
    
    return result[0] > 0;
  } catch (error) {
    console.error('Error marking message as read:', error);
    return false;
  }
}

/**
 * Delete message
 */
async function deleteMessage(messageId, userId) {
  try {
    const { UserMessage } = require('../models');
    
    const result = await UserMessage.update(
      { 
        deleted_by_sender: Sequelize.literal(`CASE WHEN from_user_id = ${userId} THEN true ELSE deleted_by_sender END`),
        deleted_by_recipient: Sequelize.literal(`CASE WHEN to_user_id = ${userId} THEN true ELSE deleted_by_recipient END`)
      },
      { 
        where: { 
          id: messageId,
          [Op.or]: [
            { from_user_id: userId },
            { to_user_id: userId }
          ]
        } 
      }
    );
    
    return result[0] > 0;
  } catch (error) {
    console.error('Error deleting message:', error);
    return false;
  }
}

/**
 * Get unread message count for user
 */
async function getUnreadCount(userId) {
  try {
    if (!await isUserMessagingEnabled()) {
      return 0;
    }

    const { UserMessage } = require('../models');
    
    const count = await UserMessage.count({
      where: {
        to_user_id: userId,
        is_read: false,
        deleted_by_recipient: false
      }
    });
    
    return count;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

/**
 * Block user
 */
async function blockUser(blockerId, blockedId) {
  try {
    const { UserBlock } = require('../models');
    
    await UserBlock.create({
      blocker_id: blockerId,
      blocked_id: blockedId,
      blocked_at: new Date()
    });
    
    return true;
  } catch (error) {
    console.error('Error blocking user:', error);
    return false;
  }
}

/**
 * Unblock user
 */
async function unblockUser(blockerId, blockedId) {
  try {
    const { UserBlock } = require('../models');
    
    const result = await UserBlock.destroy({
      where: {
        blocker_id: blockerId,
        blocked_id: blockedId
      }
    });
    
    return result > 0;
  } catch (error) {
    console.error('Error unblocking user:', error);
    return false;
  }
}

/**
 * Get user's messaging statistics
 */
async function getUserMessagingStats(userId) {
  try {
    const { UserMessage } = require('../models');
    
    const [sentCount, receivedCount, unreadCount] = await Promise.all([
      UserMessage.count({ where: { from_user_id: userId } }),
      UserMessage.count({ where: { to_user_id: userId } }),
      UserMessage.count({ where: { to_user_id: userId, is_read: false } })
    ]);
    
    return {
      messages_sent: sentCount,
      messages_received: receivedCount,
      unread_messages: unreadCount
    };
  } catch (error) {
    console.error('Error getting messaging stats:', error);
    return { messages_sent: 0, messages_received: 0, unread_messages: 0 };
  }
}

module.exports = {
  isUserMessagingEnabled,
  sendMessage,
  canUsersMessage,
  getUserInbox,
  getUserSentMessages,
  getConversation,
  markMessageAsRead,
  deleteMessage,
  getUnreadCount,
  blockUser,
  unblockUser,
  getUserMessagingStats
};