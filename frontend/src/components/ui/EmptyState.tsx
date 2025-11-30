import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'minimal' | 'card';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const defaultIcon = (
    <svg className="w-full h-full text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );

  // Size configurations
  const sizeConfig = {
    sm: {
      padding: 'py-8 px-4',
      iconContainer: 'w-16 h-16',
      iconSize: 'w-8 h-8',
      title: 'text-base font-semibold',
      description: 'text-sm',
      button: 'px-4 py-2 text-sm',
    },
    md: {
      padding: 'py-12 px-6',
      iconContainer: 'w-20 h-20',
      iconSize: 'w-10 h-10',
      title: 'text-lg font-bold',
      description: 'text-base',
      button: 'px-5 py-2.5 text-sm',
    },
    lg: {
      padding: 'py-16 px-8',
      iconContainer: 'w-28 h-28',
      iconSize: 'w-14 h-14',
      title: 'text-xl font-bold',
      description: 'text-base',
      button: 'px-6 py-3 text-base',
    },
  };

  const config = sizeConfig[size];

  // Variant styles
  const variantStyles = {
    default: '',
    minimal: '',
    card: 'bg-white rounded-2xl shadow-sm border border-gray-100',
  };

  return (
    <div className={`text-center ${config.padding} ${variantStyles[variant]} ${className}`}>
      {/* Decorative Background Pattern */}
      {variant === 'default' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-100 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-indigo-100 rounded-full blur-2xl"></div>
        </div>
      )}
      
      {/* Icon Container */}
      <div className="relative inline-block mb-6">
        <div className={`${config.iconContainer} mx-auto bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center shadow-sm border border-blue-100/50 relative overflow-hidden`}>
          {/* Inner glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent"></div>
          <div className={`${config.iconSize} relative z-10`}>
            {icon || defaultIcon}
          </div>
        </div>
        {/* Decorative dots */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-200 rounded-full opacity-60"></div>
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-indigo-200 rounded-full opacity-60"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-sm mx-auto">
        <h3 className={`${config.title} text-gray-900 mb-2`}>{title}</h3>
        {description && (
          <p className={`${config.description} text-gray-500 leading-relaxed mb-6`}>
            {description}
          </p>
        )}

        {/* Actions */}
        {(action || secondaryAction) && (
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {action && (
              <button
                onClick={action.onClick}
                className={`${config.button} bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0`}
              >
                {action.label}
              </button>
            )}
            {secondaryAction && (
              <button
                onClick={secondaryAction.onClick}
                className={`${config.button} bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium`}
              >
                {secondaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
