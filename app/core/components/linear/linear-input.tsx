import React from 'react';
import { cn } from '~/core/lib/utils';
import { linearTheme } from '~/core/lib/theme';

export interface LinearInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'outlined' | 'filled';
  inputSize?: 'sm' | 'md' | 'lg';
}

const getInputStyles = (variant: string, inputSize: string, hasError: boolean) => {
  const baseStyles = "w-full rounded-md border transition-all duration-200 focus:outline-none focus:ring-3";
  
  const sizeStyles = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-5 text-base"
  };
  
  const variantStyles = {
    default: hasError 
      ? "border-[#EF4444] bg-white focus:border-[#EF4444] focus:ring-[#EF4444]/20 dark:bg-[#1A1B1E] dark:text-[#FFFFFF]" 
      : "border-[#E1E4E8] bg-white focus:border-[#5E6AD2] focus:ring-[#5E6AD2]/20 dark:bg-[#1A1B1E] dark:border-[#2C2D30] dark:focus:border-[#7C89F9] dark:text-[#FFFFFF]",
    outlined: hasError
      ? "border-2 border-[#EF4444] bg-transparent focus:border-[#EF4444] focus:ring-[#EF4444]/20 dark:text-[#FFFFFF]"
      : "border-2 border-[#E1E4E8] bg-transparent focus:border-[#5E6AD2] focus:ring-[#5E6AD2]/20 dark:border-[#2C2D30] dark:focus:border-[#7C89F9] dark:text-[#FFFFFF]",
    filled: hasError
      ? "border border-[#EF4444] bg-[#F8F9FA] focus:border-[#EF4444] focus:ring-[#EF4444]/20 dark:bg-[#2C2D30] dark:text-[#FFFFFF]"
      : "border border-transparent bg-[#F8F9FA] focus:border-[#5E6AD2] focus:ring-[#5E6AD2]/20 dark:bg-[#2C2D30] dark:focus:border-[#7C89F9] dark:text-[#FFFFFF]"
  };
  
  return cn(
    baseStyles,
    sizeStyles[inputSize as keyof typeof sizeStyles],
    variantStyles[variant as keyof typeof variantStyles]
  );
};

export const LinearInput: React.FC<LinearInputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'default',
  inputSize = 'md',
  className,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;
  
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[#0D0E10] dark:text-[#FFFFFF] mb-2"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-[#8B92B5] dark:text-[#6C6F7E] text-sm">{leftIcon}</span>
          </div>
        )}
        
        <input
          id={inputId}
          className={cn(
            getInputStyles(variant, inputSize, hasError),
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            className
          )}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-[#8B92B5] dark:text-[#6C6F7E] text-sm">{rightIcon}</span>
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <p className={cn(
          "mt-2 text-xs",
          error ? "text-[#EF4444]" : "text-[#8B92B5] dark:text-[#6C6F7E]"
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

export interface LinearTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'outlined' | 'filled';
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const LinearTextarea: React.FC<LinearTextareaProps> = ({
  label,
  error,
  helperText,
  variant = 'default',
  resize = 'vertical',
  className,
  id,
  ...props
}) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;
  
  const textareaStyles = cn(
    "w-full px-4 py-3 rounded-md border transition-all duration-200 focus:outline-none focus:ring-3 min-h-[100px]",
    resize === 'none' && "resize-none",
    resize === 'vertical' && "resize-y",
    resize === 'horizontal' && "resize-x",
    resize === 'both' && "resize",
    variant === 'default' && (hasError 
      ? "border-[#EF4444] bg-white focus:border-[#EF4444] focus:ring-[#EF4444]/20 dark:bg-[#1A1B1E] dark:text-[#FFFFFF]" 
      : "border-[#E1E4E8] bg-white focus:border-[#5E6AD2] focus:ring-[#5E6AD2]/20 dark:bg-[#1A1B1E] dark:border-[#2C2D30] dark:focus:border-[#7C89F9] dark:text-[#FFFFFF]"),
    variant === 'outlined' && (hasError
      ? "border-2 border-[#EF4444] bg-transparent focus:border-[#EF4444] focus:ring-[#EF4444]/20 dark:text-[#FFFFFF]"
      : "border-2 border-[#E1E4E8] bg-transparent focus:border-[#5E6AD2] focus:ring-[#5E6AD2]/20 dark:border-[#2C2D30] dark:focus:border-[#7C89F9] dark:text-[#FFFFFF]"),
    variant === 'filled' && (hasError
      ? "border border-[#EF4444] bg-[#F8F9FA] focus:border-[#EF4444] focus:ring-[#EF4444]/20 dark:bg-[#2C2D30] dark:text-[#FFFFFF]"
      : "border border-transparent bg-[#F8F9FA] focus:border-[#5E6AD2] focus:ring-[#5E6AD2]/20 dark:bg-[#2C2D30] dark:focus:border-[#7C89F9] dark:text-[#FFFFFF]")
  );
  
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-[#0D0E10] dark:text-[#FFFFFF] mb-2"
        >
          {label}
        </label>
      )}
      
      <textarea
        id={textareaId}
        className={cn(textareaStyles, className)}
        {...props}
      />
      
      {(error || helperText) && (
        <p className={cn(
          "mt-2 text-xs",
          error ? "text-[#EF4444]" : "text-[#8B92B5] dark:text-[#6C6F7E]"
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};
