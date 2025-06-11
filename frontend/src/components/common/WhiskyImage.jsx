import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../../services/api';

const WhiskyImage = ({ 
  src, 
  alt, 
  className = "", 
  fallbackText = "🥃",
  showLabel = false 
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [defaultImageUrl, setDefaultImageUrl] = useState(null);

  useEffect(() => {
    // Fetch default image setting
    const fetchDefaultImage = async () => {
      try {
        const response = await settingsAPI.getPublicSettings({ category: 'content' });
        const defaultImage = response.data.settings.default_whisky_image;
        if (defaultImage) {
          setDefaultImageUrl(defaultImage);
        }
      } catch (error) {
        console.error('Failed to fetch default image setting:', error);
        // Fallback to a default if API fails
        setDefaultImageUrl('/images/aby_whisky_club_header01.png');
      }
    };

    fetchDefaultImage();
  }, []);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // Determine which image source to use
  const getImageSrc = () => {
    if (src) return src;
    if (defaultImageUrl) return defaultImageUrl;
    return null;
  };

  const imageSrc = getImageSrc();

  // If no image source available or image failed and no default, show emoji fallback
  if ((!imageSrc || imageError) && !defaultImageUrl) {
    return (
      <div className={`bg-gradient-to-br from-amber-100 to-amber-200 flex flex-col items-center justify-center ${className}`}>
        <div className="text-8xl sm:text-9xl">{fallbackText}</div>
        {showLabel && (
          <div className="text-xs text-amber-700 text-center px-2 mt-2">
            {alt || 'Whisky Image'}
          </div>
        )}
      </div>
    );
  }

  // If original image failed but we have a default, try the default
  if (imageError && src && defaultImageUrl) {
    return (
      <div className={`relative ${className}`}>
        {imageLoading && (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
            <div className="animate-pulse text-8xl sm:text-9xl">🥃</div>
          </div>
        )}
        <img
          src={defaultImageUrl}
          alt={alt}
          className={`w-full h-full object-contain ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          onError={() => {
            // If default image also fails, we'll show the emoji fallback in the next render
            setDefaultImageUrl(null);
          }}
          onLoad={handleImageLoad}
        />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {imageLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
          <div className="animate-pulse text-8xl sm:text-9xl">🥃</div>
        </div>
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={`w-full h-full object-contain ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
    </div>
  );
};

export default WhiskyImage;