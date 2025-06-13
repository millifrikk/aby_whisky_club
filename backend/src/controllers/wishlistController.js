const { Wishlist, Whisky, Distillery, SystemSetting } = require('../models');

class WishlistController {
  // Get user's wishlist
  static async getUserWishlist(req, res) {
    try {
      const { userId } = req.params;
      const {
        page = 1,
        limit = 20,
        orderBy = 'added_at',
        orderDirection = 'DESC'
      } = req.query;

      // Check if user can access this wishlist
      if (req.user.id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only view your own wishlist'
        });
      }

      // Check if wishlist feature is enabled
      const wishlistEnabled = await SystemSetting.getSetting('enable_whisky_wishlist', false);
      if (!wishlistEnabled) {
        return res.status(404).json({
          error: 'Feature not available',
          message: 'Wishlist feature is currently disabled'
        });
      }

      const result = await Wishlist.getUserWishlist(userId, {
        page,
        limit,
        orderBy,
        orderDirection
      });

      const totalPages = Math.ceil(result.count / parseInt(limit));

      res.json({
        wishlist: result.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_count: result.count,
          limit: parseInt(limit),
          has_next: parseInt(page) < totalPages,
          has_prev: parseInt(page) > 1
        }
      });

    } catch (error) {
      console.error('Get user wishlist error:', error);
      res.status(500).json({
        error: 'Failed to fetch wishlist',
        message: 'An error occurred while fetching the wishlist'
      });
    }
  }

  // Add whisky to wishlist
  static async addToWishlist(req, res) {
    try {
      const { whisky_id, notes, priority = 1 } = req.body;
      const userId = req.user.id;

      // Check if wishlist feature is enabled
      const wishlistEnabled = await SystemSetting.getSetting('enable_whisky_wishlist', false);
      if (!wishlistEnabled) {
        return res.status(404).json({
          error: 'Feature not available',
          message: 'Wishlist feature is currently disabled'
        });
      }

      // Validate whisky exists
      const whisky = await Whisky.findByPk(whisky_id);
      if (!whisky) {
        return res.status(404).json({
          error: 'Whisky not found',
          message: 'The specified whisky does not exist'
        });
      }

      // Check if already in wishlist
      const existing = await Wishlist.isInWishlist(userId, whisky_id);
      if (existing) {
        return res.status(409).json({
          error: 'Already in wishlist',
          message: 'This whisky is already in your wishlist'
        });
      }

      const wishlistItem = await Wishlist.addToWishlist(userId, whisky_id, {
        notes,
        priority
      });

      // Fetch the created item with whisky details
      const createdItem = await Wishlist.findByPk(wishlistItem.id, {
        include: [
          {
            model: Whisky,
            as: 'whisky',
            include: [
              {
                model: Distillery,
                as: 'distilleryInfo',
                required: false
              }
            ]
          }
        ]
      });

      res.status(201).json({
        message: 'Whisky added to wishlist',
        wishlistItem: createdItem
      });

    } catch (error) {
      console.error('Add to wishlist error:', error);
      
      if (error.message === 'Whisky is already in wishlist') {
        return res.status(409).json({
          error: 'Already in wishlist',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Failed to add to wishlist',
        message: 'An error occurred while adding the whisky to your wishlist'
      });
    }
  }

  // Remove whisky from wishlist
  static async removeFromWishlist(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if wishlist feature is enabled
      const wishlistEnabled = await SystemSetting.getSetting('enable_whisky_wishlist', false);
      if (!wishlistEnabled) {
        return res.status(404).json({
          error: 'Feature not available',
          message: 'Wishlist feature is currently disabled'
        });
      }

      // Find the wishlist item
      const wishlistItem = await Wishlist.findByPk(id);
      if (!wishlistItem) {
        return res.status(404).json({
          error: 'Item not found',
          message: 'Wishlist item not found'
        });
      }

      // Check if user owns this wishlist item
      if (wishlistItem.user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only remove items from your own wishlist'
        });
      }

      await wishlistItem.destroy();

      res.json({
        message: 'Whisky removed from wishlist'
      });

    } catch (error) {
      console.error('Remove from wishlist error:', error);
      res.status(500).json({
        error: 'Failed to remove from wishlist',
        message: 'An error occurred while removing the whisky from your wishlist'
      });
    }
  }

  // Update wishlist item
  static async updateWishlistItem(req, res) {
    try {
      const { id } = req.params;
      const { notes, priority } = req.body;
      const userId = req.user.id;

      // Check if wishlist feature is enabled
      const wishlistEnabled = await SystemSetting.getSetting('enable_whisky_wishlist', false);
      if (!wishlistEnabled) {
        return res.status(404).json({
          error: 'Feature not available',
          message: 'Wishlist feature is currently disabled'
        });
      }

      // Find the wishlist item
      const wishlistItem = await Wishlist.findByPk(id);
      if (!wishlistItem) {
        return res.status(404).json({
          error: 'Item not found',
          message: 'Wishlist item not found'
        });
      }

      // Check if user owns this wishlist item
      if (wishlistItem.user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update items in your own wishlist'
        });
      }

      // Update the item
      const updateData = {};
      if (notes !== undefined) updateData.notes = notes;
      if (priority !== undefined) updateData.priority = priority;

      await wishlistItem.update(updateData);

      // Fetch updated item with whisky details
      const updatedItem = await Wishlist.findByPk(id, {
        include: [
          {
            model: Whisky,
            as: 'whisky',
            include: [
              {
                model: Distillery,
                as: 'distilleryInfo',
                required: false
              }
            ]
          }
        ]
      });

      res.json({
        message: 'Wishlist item updated',
        wishlistItem: updatedItem
      });

    } catch (error) {
      console.error('Update wishlist item error:', error);
      res.status(500).json({
        error: 'Failed to update wishlist item',
        message: 'An error occurred while updating the wishlist item'
      });
    }
  }

  // Check if whisky is in user's wishlist
  static async checkWishlistStatus(req, res) {
    try {
      const { whiskyId } = req.params;
      const userId = req.user.id;

      // Check if wishlist feature is enabled
      const wishlistEnabled = await SystemSetting.getSetting('enable_whisky_wishlist', false);
      if (!wishlistEnabled) {
        return res.json({ inWishlist: false, enabled: false });
      }

      const inWishlist = await Wishlist.isInWishlist(userId, whiskyId);

      res.json({ 
        inWishlist,
        enabled: true
      });

    } catch (error) {
      console.error('Check wishlist status error:', error);
      res.status(500).json({
        error: 'Failed to check wishlist status',
        message: 'An error occurred while checking wishlist status'
      });
    }
  }
}

module.exports = WishlistController;