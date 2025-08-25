import React from 'react';
import { cn } from '~/core/lib/utils';

export interface LinearProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  indeterminate?: boolean;
}

const getProgressStyles = (variant: string, size: string) => {
  const sizeStyles = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3"
  };
  
  const variantStyles = {
    default: "bg-[#5E6AD2]",
    success: "bg-[#10B981]",
    warning: "bg-[#F59E0B]",
    error: "bg-[#EF4444]",
    gradient: "bg-gradient-to-r from-[#4facfe] to-[#00f2fe]"
  };
  
  return {
    container: cn("w-full bg-[#F1F2F4] dark:bg-[#2C2D30] rounded-full overflow-hidden", sizeStyles[size as keyof typeof sizeStyles]),
    bar: cn("h-full transition-all duration-500 ease-out", variantStyles[variant as keyof typeof variantStyles])
  };
};

export const LinearProgress: React.FC<LinearProgressProps> = ({
  value = 0,
  max = 100,
  variant = 'default',
  size = 'md',
  showLabel = false,
  label,
  indeterminate = false,
  className,
  ...props
}) => {
  const percentage = Math.min(Math.max(value, 0), max) / max * 100;
  const styles = getProgressStyles(variant, size);
  
  return (
    <div className={cn("w-full", className)} {...props}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-[#0D0E10] dark:text-[#FFFFFF]">
            {label || 'Progress'}
          </span>
          {showLabel && !indeterminate && (
            <span className="text-xs text-[#8B92B5] dark:text-[#6C6F7E]">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      <div className={styles.container}>
        <div
          className={cn(
            styles.bar,
            indeterminate && "animate-pulse"
          )}
          style={{
            width: indeterminate ? '100%' : `${percentage}%`,
            animation: indeterminate ? 'linear-progress-indeterminate 2s ease-in-out infinite' : undefined
          }}
        />
      </div>
    </div>
  );
};

export interface LinearCircularProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  strokeWidth?: number;
  indeterminate?: boolean;
}

export const LinearCircularProgress: React.FC<LinearCircularProgressProps> = ({
  value = 0,
  max = 100,
  variant = 'default',
  size = 'md',
  showLabel = false,
  strokeWidth = 4,
  indeterminate = false,
  className,
  ...props
}) => {
  const percentage = Math.min(Math.max(value, 0), max) / max * 100;
  
  const sizeMap = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96
  };
  
  const sizeValue = sizeMap[size as keyof typeof sizeMap];
  const radius = (sizeValue - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = indeterminate ? 0 : circumference - (percentage / 100) * circumference;
  
  const colorMap = {
    default: "#5E6AD2",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    gradient: "url(#linear-gradient)"
  };
  
  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: sizeValue, height: sizeValue }}
      {...props}
    >
      <svg
        className={cn("transform -rotate-90", indeterminate && "animate-spin")}
        width={sizeValue}
        height={sizeValue}
      >
        {variant === 'gradient' && (
          <defs>
            <linearGradient id="linear-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4facfe" />
              <stop offset="100%" stopColor="#00f2fe" />
            </linearGradient>
          </defs>
        )}
        
        {/* Background circle */}
        <circle
          cx={sizeValue / 2}
          cy={sizeValue / 2}
          r={radius}
          stroke="#F1F2F4"
          strokeWidth={strokeWidth}
          fill="none"
          className="dark:stroke-[#2C2D30]"
        />
        
        {/* Progress circle */}
        <circle
          cx={sizeValue / 2}
          cy={sizeValue / 2}
          r={radius}
          stroke={colorMap[variant as keyof typeof colorMap]}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      
      {showLabel && !indeterminate && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-[#0D0E10] dark:text-[#FFFFFF]">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
};
