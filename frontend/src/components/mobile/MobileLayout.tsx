import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface MobileLayoutProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  spacing?: 'tight' | 'normal' | 'relaxed';
}

const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  className = '',
  padding = 'md',
  spacing = 'normal'
}) => {
  const paddingClasses = {
    none: '',
    sm: 'px-3 py-2',
    md: 'px-4 py-4',
    lg: 'px-6 py-6'
  };

  const spacingClasses = {
    tight: 'space-y-3',
    normal: 'space-y-4',
    relaxed: 'space-y-6'
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <div className={`${paddingClasses[padding]} ${spacingClasses[spacing]}`}>
        {children}
      </div>
    </div>
  );
};

// Mobile-optimized section component
interface MobileSectionProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  background?: 'white' | 'gray' | 'transparent';
  padding?: 'sm' | 'md' | 'lg';
}

export const MobileSection: React.FC<MobileSectionProps> = ({
  children,
  title,
  subtitle,
  className = '',
  background = 'white',
  padding = 'md'
}) => {
  const backgroundClasses = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    transparent: 'bg-transparent'
  };

  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${backgroundClasses[background]} rounded-xl ${paddingClasses[padding]} ${className}`}
    >
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </motion.section>
  );
};

// Mobile-optimized grid component
interface MobileGridProps {
  children: ReactNode;
  columns?: 1 | 2;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const MobileGrid: React.FC<MobileGridProps> = ({
  children,
  columns = 2,
  gap = 'md',
  className = ''
}) => {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2'
  };

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  return (
    <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};

// Mobile-optimized button component
interface MobileButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const MobileButton: React.FC<MobileButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  className = '',
  type = 'button'
}) => {
  const baseClasses = 'font-medium rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2';
  
  const variantClasses = {
    primary: 'bg-[#C4985A] text-white hover:bg-[#B8875A]',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    outline: 'border-2 border-[#C4985A] text-[#C4985A] hover:bg-[#C4985A] hover:text-white',
    ghost: 'text-[#C4985A] hover:bg-[#C4985A]/10'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-3 text-base min-h-[44px]',
    lg: 'px-6 py-4 text-lg min-h-[52px]',
    xl: 'px-8 py-5 text-xl min-h-[60px]'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      <span>{children}</span>
    </button>
  );
};

// Mobile-optimized input component
interface MobileInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const MobileInput: React.FC<MobileInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  error,
  disabled = false,
  required = false,
  className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`w-full px-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-[#C4985A] focus:border-transparent transition-colors min-h-[44px] ${
          error
            ? 'border-red-300 focus:ring-red-500'
            : 'border-gray-300'
        } ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
        }`}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// Mobile-optimized card component
interface MobileCardProps {
  children: ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  className?: string;
  onClick?: () => void;
}

export const MobileCard: React.FC<MobileCardProps> = ({
  children,
  padding = 'md',
  shadow = 'sm',
  border = true,
  className = '',
  onClick
}) => {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };

  const borderClass = border ? 'border border-gray-200' : '';
  const clickableClass = onClick ? 'cursor-pointer active:scale-95 transition-transform' : '';

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl ${paddingClasses[padding]} ${shadowClasses[shadow]} ${borderClass} ${clickableClass} ${className}`}
    >
      {children}
    </div>
  );
};

// Mobile-optimized list component
interface MobileListProps {
  children: ReactNode;
  divider?: boolean;
  className?: string;
}

export const MobileList: React.FC<MobileListProps> = ({
  children,
  divider = true,
  className = ''
}) => {
  const dividerClass = divider ? 'divide-y divide-gray-200' : '';

  return (
    <div className={`bg-white rounded-xl overflow-hidden ${dividerClass} ${className}`}>
      {children}
    </div>
  );
};

interface MobileListItemProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export const MobileListItem: React.FC<MobileListItemProps> = ({
  children,
  onClick,
  className = ''
}) => {
  const clickableClass = onClick ? 'cursor-pointer active:bg-gray-50 transition-colors' : '';

  return (
    <div
      onClick={onClick}
      className={`px-4 py-4 min-h-[56px] flex items-center ${clickableClass} ${className}`}
    >
      {children}
    </div>
  );
};

export default MobileLayout;