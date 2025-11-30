import React from 'react';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  className?: string;
  animation?: 'pulse' | 'shimmer' | 'none';
}

interface SkeletonCardProps {
  hasImage?: boolean;
  imageHeight?: string;
  lines?: number;
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> & {
  Card: React.FC<SkeletonCardProps>;
  Avatar: React.FC<{ size?: 'sm' | 'md' | 'lg' }>;
} = ({
  variant = 'text',
  width,
  height,
  className = '',
  animation = 'shimmer',
}) => {
  const variants = {
    text: 'rounded-lg',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-2xl',
  };

  const animations = {
    pulse: 'animate-pulse',
    shimmer: 'skeleton-shimmer',
    none: '',
  };

  const getHeight = () => {
    if (height) return typeof height === 'number' ? `${height}px` : height;
    if (variant === 'text') return '1rem';
    return '100px';
  };

  return (
    <div
      className={`
        bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]
        ${variants[variant]}
        ${animations[animation]}
        ${className}
      `}
      style={{
        width: width ? (typeof width === 'number' ? `${width}px` : width) : '100%',
        height: getHeight(),
      }}
    />
  );
};

const SkeletonCard: React.FC<SkeletonCardProps> = ({
  hasImage = true,
  imageHeight = '180px',
  lines = 3,
  className = '',
}) => (
  <div className={`bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-soft ${className}`}>
    {hasImage && (
      <Skeleton variant="rectangular" height={imageHeight} animation="shimmer" />
    )}
    <div className="p-5 space-y-3">
      <Skeleton variant="text" height="1.25rem" width="70%" animation="shimmer" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height="0.875rem"
          width={i === lines - 1 ? '50%' : '100%'}
          animation="shimmer"
        />
      ))}
    </div>
  </div>
);

const SkeletonAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <Skeleton
      variant="rounded"
      className={sizes[size]}
      animation="shimmer"
    />
  );
};

Skeleton.Card = SkeletonCard;
Skeleton.Avatar = SkeletonAvatar;

export default Skeleton;
