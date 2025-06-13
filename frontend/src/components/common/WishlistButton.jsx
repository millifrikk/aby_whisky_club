import React, { useState, useEffect } from 'react';
import { useWishlist } from '../../hooks/useWishlist';
import { useAuth } from '../../contexts/AuthContext';
import { wishlistAPI } from '../../services/api';

const WishlistButton = ({ 
  whisky, 
  size = 'md', 
  variant = 'button', // 'button', 'icon', 'heart'
  className = '',
  showText = true 
}) => {
  const { isAuthenticated, user } = useAuth();
  const { isEnabled } = useWishlist();
  const [inWishlist, setInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check if whisky is in wishlist on mount
  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (!isAuthenticated || !isEnabled || !whisky?.id) {
        setChecking(false);
        return;
      }

      try {
        const response = await wishlistAPI.checkWishlistStatus(whisky.id);
        setInWishlist(response.data.inWishlist);
      } catch (error) {
        console.error('Error checking wishlist status:', error);
      } finally {
        setChecking(false);
      }
    };

    checkWishlistStatus();
  }, [whisky?.id, isAuthenticated, isEnabled]);

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      // Could trigger login modal here
      return;
    }

    if (!isEnabled) {
      return;
    }

    setLoading(true);
    
    try {
      if (inWishlist) {
        // Find wishlist item by making a request (in a real app, we'd pass the wishlist item ID)
        // For now, this is a simplified approach
        const response = await wishlistAPI.getUserWishlist(user.id, { limit: 100 });
        const wishlistItem = response.data.wishlist.find(item => item.whisky?.id === whisky.id);
        
        if (wishlistItem) {
          await wishlistAPI.removeFromWishlist(wishlistItem.id);
          setInWishlist(false);
        }
      } else {
        await wishlistAPI.addToWishlist({ whisky_id: whisky.id });
        setInWishlist(true);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't render if feature is disabled or user not authenticated
  if (!isEnabled || !isAuthenticated || checking) {
    return null;
  }

  // Size classes
  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-2',
    lg: 'text-lg px-4 py-3'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  if (variant === 'heart') {
    return (
      <button
        onClick={handleWishlistToggle}
        disabled={loading}
        className={`
          inline-flex items-center justify-center rounded-full p-2
          ${inWishlist 
            ? 'text-red-500 hover:text-red-600' 
            : 'text-gray-400 hover:text-red-500'
          }
          transition-colors duration-200
          ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}
          ${className}
        `}
        title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        {loading ? (
          <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-red-500 ${iconSizeClasses[size]}`}></div>
        ) : (
          <svg
            className={iconSizeClasses[size]}
            fill={inWishlist ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        )}
      </button>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleWishlistToggle}
        disabled={loading}
        className={`
          inline-flex items-center justify-center rounded-md
          ${inWishlist 
            ? 'bg-pink-100 text-pink-600 hover:bg-pink-200' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }
          transition-colors duration-200
          ${loading ? 'opacity-50 cursor-not-allowed' : ''}
          ${sizeClasses[size]}
          ${className}
        `}
        title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        {loading ? (
          <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-pink-500 ${iconSizeClasses[size]}`}></div>
        ) : (
          <svg
            className={iconSizeClasses[size]}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        )}
        {showText && (
          <span className="ml-1">
            {inWishlist ? 'Saved' : 'Save'}
          </span>
        )}
      </button>
    );
  }

  // Default button variant
  return (
    <button
      onClick={handleWishlistToggle}
      disabled={loading}
      className={`
        inline-flex items-center justify-center rounded-md font-medium
        ${inWishlist 
          ? 'bg-pink-600 text-white hover:bg-pink-700' 
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }
        transition-colors duration-200
        ${loading ? 'opacity-50 cursor-not-allowed' : ''}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {loading ? (
        <div className={`animate-spin rounded-full border-2 border-white border-t-transparent mr-2 ${iconSizeClasses[size]}`}></div>
      ) : (
        <svg
          className={`mr-2 ${iconSizeClasses[size]}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
      )}
      {inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
    </button>
  );
};

export default WishlistButton;