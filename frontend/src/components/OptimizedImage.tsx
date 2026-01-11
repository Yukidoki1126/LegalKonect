import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackText?: string;
  onError?: () => void;
  retryAttempts?: number;
  retryDelay?: number;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  fallbackText = 'Image not found',
  onError,
  retryAttempts = 3,
  retryDelay = 2000,
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Reset state when src changes
  useEffect(() => {
    setImageSrc(src);
    setIsLoading(true);
    setHasError(false);
    setRetryCount(0);
    setIsRetrying(false);
  }, [src]);

  // Preload image with timeout
  useEffect(() => {
    if (!imageSrc || hasError) return;

    const img = new Image();
    const timeoutId = setTimeout(() => {
      // If image hasn't loaded after 10 seconds, consider it failed
      if (isLoading) {
        handleImageError();
      }
    }, 10000);

    img.onload = () => {
      clearTimeout(timeoutId);
      setIsLoading(false);
      setHasError(false);
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      handleImageError();
    };

    img.src = imageSrc;

    return () => clearTimeout(timeoutId);
  }, [imageSrc, isLoading]);

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
    
    if (retryCount < retryAttempts) {
      // Auto-retry with exponential backoff
      const delay = retryDelay * Math.pow(2, retryCount);
      console.log(`Image load failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${retryAttempts})...`);
      
      setIsRetrying(true);
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setImageSrc(`${src}${src.includes('?') ? '&' : '?'}retry=${Date.now()}`); // Cache bust
        setIsLoading(true);
        setHasError(false);
        setIsRetrying(false);
      }, delay);
    } else {
      // All retries exhausted
      console.error('Image failed to load after', retryAttempts, 'attempts');
      if (onError) onError();
    }
  };

  const handleManualRetry = () => {
    setRetryCount(0);
    setImageSrc(`${src}${src.includes('?') ? '&' : '?'}retry=${Date.now()}`);
    setIsLoading(true);
    setHasError(false);
  };

  if (hasError && retryCount >= retryAttempts) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 p-8 rounded-lg ${className}`}>
        <AlertCircle className="w-12 h-12 text-gray-400 mb-3" />
        <p className="text-gray-600 text-sm mb-2 text-center font-medium">{fallbackText}</p>
        <p className="text-gray-500 text-xs mb-4 text-center max-w-xs">
          Unable to load image. Please check your connection and try again.
        </p>
        <button
          onClick={handleManualRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {(isLoading || isRetrying) && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center bg-gray-100 rounded-lg ${className}`}>
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
          <p className="text-gray-600 text-sm">
            {isRetrying ? `Retrying (${retryCount}/${retryAttempts})...` : 'Loading image...'}
          </p>
        </div>
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => {
          setIsLoading(false);
          setHasError(false);
        }}
        onError={handleImageError}
        style={{ display: hasError ? 'none' : 'block' }}
      />
    </div>
  );
};

export default OptimizedImage;
