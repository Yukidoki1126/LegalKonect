import React from 'react';

interface CardProps {
  variant?: 'default' | 'hover' | 'interactive' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

interface CardHeaderProps {
  icon?: React.ReactNode;
  iconBgColor?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  className?: string;
  children: React.ReactNode;
}

interface CardFooterProps {
  className?: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> & {
  Header: React.FC<CardHeaderProps>;
  Content: React.FC<CardContentProps>;
  Footer: React.FC<CardFooterProps>;
} = ({
  variant = 'default',
  padding = 'md',
  className = '',
  children,
  onClick,
}) => {
  const variants = {
    default: 'bg-white border border-gray-100 rounded-2xl shadow-soft',
    hover: 'bg-white border border-gray-100 rounded-2xl shadow-soft hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300',
    interactive: 'bg-white border border-gray-100 rounded-2xl shadow-soft hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer',
    gradient: 'bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl shadow-soft',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`${variants[variant]} ${paddings[padding]} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
};

const CardHeader: React.FC<CardHeaderProps> = ({
  icon,
  iconBgColor = 'from-blue-500 to-indigo-500',
  title,
  subtitle,
  action,
  className = '',
}) => (
  <div className={`flex items-start justify-between mb-4 ${className}`}>
    <div className="flex items-center gap-3">
      {icon && (
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconBgColor} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
      )}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action && <div>{action}</div>}
  </div>
);

const CardContent: React.FC<CardContentProps> = ({ className = '', children }) => (
  <div className={className}>{children}</div>
);

const CardFooter: React.FC<CardFooterProps> = ({ className = '', children }) => (
  <div className={`mt-4 pt-4 border-t border-gray-100 ${className}`}>{children}</div>
);

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
