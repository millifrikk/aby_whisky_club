import { useState, useEffect, useCallback } from 'react';
import { wishlistAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useContentSettings } from './useContentSettings';
import toast from 'react-hot-toast';

export const useWishlist = () => {
  const { user, isAuthenticated } = useAuth();
  const { enableWhiskyWishlist } = useContentSettings();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});

  // Load user's wishlist
  const loadWishlist = useCallback(async (options = {}) => {
    if (!isAuthenticated || !user?.id || !enableWhiskyWishlist) {
      return;
    }

    try {
      setLoading(true);
      const response = await wishlistAPI.getUserWishlist(user.id, options);
      setWishlist(response.data.wishlist || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error loading wishlist:', error);
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  }, [user?.id, isAuthenticated, enableWhiskyWishlist]);

  // Add whisky to wishlist
  const addToWishlist = useCallback(async (whiskyId, options = {}) => {
    if (!isAuthenticated || !enableWhiskyWishlist) {
      toast.error('Please log in to add whiskies to your wishlist');
      return false;
    }

    try {
      const data = {
        whisky_id: whiskyId,
        ...options
      };

      await wishlistAPI.addToWishlist(data);
      toast.success('Added to wishlist');
      
      // Reload wishlist to get updated data
      await loadWishlist();
      return true;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      
      if (error.response?.status === 409) {
        toast.error('This whisky is already in your wishlist');
      } else if (error.response?.status === 404 && error.response?.data?.message?.includes('disabled')) {
        toast.error('Wishlist feature is currently disabled');
      } else {
        toast.error('Failed to add to wishlist');
      }
      return false;
    }
  }, [isAuthenticated, enableWhiskyWishlist, loadWishlist]);

  // Remove whisky from wishlist
  const removeFromWishlist = useCallback(async (wishlistItemId) => {
    if (!isAuthenticated || !enableWhiskyWishlist) {
      toast.error('Please log in to manage your wishlist');
      return false;
    }

    try {
      await wishlistAPI.removeFromWishlist(wishlistItemId);
      toast.success('Removed from wishlist');
      
      // Update local state immediately for better UX
      setWishlist(prev => prev.filter(item => item.id !== wishlistItemId));
      return true;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove from wishlist');
      return false;
    }
  }, [isAuthenticated, enableWhiskyWishlist]);

  // Update wishlist item (notes, priority)
  const updateWishlistItem = useCallback(async (wishlistItemId, updates) => {
    if (!isAuthenticated || !enableWhiskyWishlist) {
      toast.error('Please log in to update your wishlist');
      return false;
    }

    try {
      const response = await wishlistAPI.updateWishlistItem(wishlistItemId, updates);
      toast.success('Wishlist item updated');
      
      // Update local state
      setWishlist(prev => prev.map(item => 
        item.id === wishlistItemId 
          ? { ...item, ...updates }
          : item
      ));
      
      return response.data.wishlistItem;
    } catch (error) {
      console.error('Error updating wishlist item:', error);
      toast.error('Failed to update wishlist item');
      return false;
    }
  }, [isAuthenticated, enableWhiskyWishlist]);

  // Check if a specific whisky is in wishlist
  const isInWishlist = useCallback((whiskyId) => {
    return wishlist.some(item => item.whisky?.id === whiskyId);
  }, [wishlist]);

  // Get wishlist item for a specific whisky
  const getWishlistItem = useCallback((whiskyId) => {
    return wishlist.find(item => item.whisky?.id === whiskyId);
  }, [wishlist]);

  // Toggle wishlist status for a whisky
  const toggleWishlist = useCallback(async (whiskyId, options = {}) => {
    const existingItem = getWishlistItem(whiskyId);
    
    if (existingItem) {
      return await removeFromWishlist(existingItem.id);
    } else {
      return await addToWishlist(whiskyId, options);
    }
  }, [getWishlistItem, removeFromWishlist, addToWishlist]);

  // Load wishlist on mount if user is authenticated and feature is enabled
  useEffect(() => {
    if (isAuthenticated && user?.id && enableWhiskyWishlist) {
      loadWishlist();
    }
  }, [isAuthenticated, user?.id, enableWhiskyWishlist, loadWishlist]);

  return {
    // State
    wishlist,
    loading,
    pagination,
    isEnabled: enableWhiskyWishlist,
    
    // Actions
    loadWishlist,
    addToWishlist,
    removeFromWishlist,
    updateWishlistItem,
    toggleWishlist,
    
    // Utilities
    isInWishlist,
    getWishlistItem,
    
    // Computed
    wishlistCount: wishlist.length,
    isEmpty: wishlist.length === 0
  };
};