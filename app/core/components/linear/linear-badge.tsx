import React from 'react';
import { cn } from '~/core/lib/utils';
import { linearTheme } from '~/core/lib/theme';

export interface LinearBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
  removable?: boolean;
  onRemove?: () => void;
}

const getBadgeStyles = (variant: string, size: string) => {
  const baseStyles = "inline-flex items-center rounded-full font-medium transition-all duration-200";
  
  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm"
  };
  
  const variantStyles = {
    default: "bg-[#F1F2F4] text-[#0D0E10] border border-[#E1E4E8] dark:bg-[#2C2D30] dark:text-[#FFFFFF] dark:border-[#404040]",
    success: "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 dark:bg-[#10B981]/20 dark:text-[#10B981] dark:border-[#10B981]/30",
    warning: "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 dark:bg-[#F59E0B]/20 dark:text-[#F59E0B] dark:border-[#F59E0B]/30",
    error: "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20 dark:bg-[#EF4444]/20 dark:text-[#EF4444] dark:border-[#EF4444]/30",
    info: "bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 dark:bg-[#3B82F6]/20 dark:text-[#3B82F6] dark:border-[#3B82F6]/30",
    secondary: "bg-[#5E6AD2]/10 text-[#5E6AD2] border border-[#5E6AD2]/20 dark:bg-[#7C89F9]/20 dark:text-[#7C89F9] dark:border-[#7C89F9]/30",
    outline: "bg-transparent text-[#0D0E10] border border-[#E1E4E8] dark:text-[#FFFFFF] dark:border-[#2C2D30]"
  };
  
  return cn(
    baseStyles,
    sizeStyles[size as keyof typeof sizeStyles],
    variantStyles[variant as keyof typeof variantStyles]
  );
};

export const LinearBadge: React.FC<LinearBadgeProps> = ({
  variant = 'default',
  size = 'md',
  children,
  className,
  icon,
  removable = false,
  onRemove,
  ...props
}) => {
  return (
    <span
      className={cn(getBadgeStyles(variant, size), className)}
      {...props}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {children}
      {removable && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-black/10 transition-colors"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </span>
  );
};
