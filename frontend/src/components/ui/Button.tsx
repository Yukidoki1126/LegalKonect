import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4';
  
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-button hover:shadow-button-hover focus:ring-blue-500/20 disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none',
    secondary: 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus:ring-gray-500/10 disabled:bg-gray-100 disabled:text-gray-400',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500/10 disabled:text-gray-400',
    danger: 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 shadow-button hover:shadow-button-hover focus:ring-red-500/20 disabled:from-gray-300 disabled:to-gray-300',
    success: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-button hover:shadow-button-hover focus:ring-green-500/20 disabled:from-gray-300 disabled:to-gray-300',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3.5 text-base gap-2.5',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'cursor-not-allowed opacity-70' : ''}
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
