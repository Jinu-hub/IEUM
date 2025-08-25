import React from 'react';
import { cn } from '~/core/lib/utils';
import { linearTheme } from '~/core/lib/theme';

export interface LinearButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const getButtonStyles = (variant: string, size: string) => {
  const theme = linearTheme.components.button;
  
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  
  const sizeStyles = {
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-4 text-sm",
    lg: "h-11 px-8 text-base"
  };
  
  const variantStyles = {
    primary: "bg-[#5E6AD2] text-white border-none hover:bg-[#4C566A] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(94,106,210,0.4)] dark:bg-[#7C89F9] dark:hover:bg-[#6B77E6]",
    secondary: "bg-transparent text-[#5E6AD2] border border-[#E1E4E8] hover:bg-[#F8F9FA] hover:border-[#5E6AD2] dark:text-[#7C89F9] dark:border-[#2C2D30] dark:hover:bg-[#1A1B1E] dark:hover:border-[#7C89F9]",
    ghost: "bg-transparent text-[#0D0E10] border-none hover:bg-[#F8F9FA] dark:text-[#FFFFFF] dark:hover:bg-[#1A1B1E]",
    gradient: "bg-gradient-to-r from-[#4facfe] to-[#00f2fe] text-white border-none hover:shadow-lg hover:-translate-y-0.5"
  };
  
  return cn(baseStyles, sizeStyles[size as keyof typeof sizeStyles], variantStyles[variant as keyof typeof variantStyles]);
};

export const LinearButton: React.FC<LinearButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className,
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  return (
    <button
      className={cn(getButtonStyles(variant, size), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};
