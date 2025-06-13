const express = require('express');
const router = express.Router();
const WishlistController = require('../controllers/wishlistController');
const { authenticateToken } = require('../middleware/auth');

// All wishlist routes require authentication
router.use(authenticateToken);

// Get user's wishlist
router.get('/user/:userId', WishlistController.getUserWishlist);

// Add whisky to wishlist
router.post('/', WishlistController.addToWishlist);

// Update wishlist item
router.put('/:id', WishlistController.updateWishlistItem);

// Remove whisky from wishlist
router.delete('/:id', WishlistController.removeFromWishlist);

// Check if whisky is in user's wishlist
router.get('/status/:whiskyId', WishlistController.checkWishlistStatus);

module.exports = router;