import React, { useState } from 'react';

const WhiskyImage = ({ 
  src, 
  alt, 
  className = "", 
  fallbackText = "🥃",
  showLabel = false 
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  if (!src || imageError) {
    return (
      <div className={`bg-gradient-to-br from-amber-100 to-amber-200 flex flex-col items-center justify-center ${className}`}>
        <div className="text-4xl mb-2">{fallbackText}</div>
        {showLabel && (
          <div className="text-xs text-amber-700 text-center px-2">
            {alt || 'Whisky Image'}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {imageLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
          <div className="animate-pulse text-2xl">🥃</div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
    </div>
  );
};

export default WhiskyImage;