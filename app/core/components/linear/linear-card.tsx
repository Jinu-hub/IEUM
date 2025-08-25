import React from 'react';
import { cn } from '~/core/lib/utils';
import { linearTheme } from '~/core/lib/theme';

export interface LinearCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  hoverable?: boolean;
}

const getCardStyles = (variant: string, padding: string, hoverable: boolean) => {
  const baseStyles = "rounded-xl transition-all duration-200";
  
  const paddingStyles = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8"
  };
  
  const variantStyles = {
    default: "bg-white border border-[#E1E4E8] shadow-sm dark:bg-[#1A1B1E] dark:border-[#2C2D30]",
    elevated: "bg-white border border-[#E1E4E8] shadow-lg dark:bg-[#1A1B1E] dark:border-[#2C2D30] dark:shadow-lg",
    outlined: "bg-transparent border-2 border-[#5E6AD2] dark:border-[#7C89F9]",
    gradient: "bg-gradient-to-br from-[#f093fb] to-[#f5576c] text-white border-none shadow-lg"
  };
  
  const hoverStyles = hoverable ? "hover:shadow-lg hover:-translate-y-1 cursor-pointer" : "";
  
  return cn(
    baseStyles, 
    paddingStyles[padding as keyof typeof paddingStyles], 
    variantStyles[variant as keyof typeof variantStyles],
    hoverStyles
  );
};

export const LinearCard: React.FC<LinearCardProps> = ({
  variant = 'default',
  padding = 'lg',
  children,
  className,
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={cn(getCardStyles(variant, padding, hoverable), className)}
      {...props}
    >
      {children}
    </div>
  );
};

export interface LinearCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const LinearCardHeader: React.FC<LinearCardHeaderProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn("flex flex-col space-y-1.5 mb-4", className)} {...props}>
      {children}
    </div>
  );
};

export interface LinearCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const LinearCardTitle: React.FC<LinearCardTitleProps> = ({
  children,
  className,
  as: Component = 'h3',
  ...props
}) => {
  return (
    <Component
      className={cn("text-xl font-semibold leading-none tracking-tight text-[#0D0E10] dark:text-[#FFFFFF]", className)}
      {...props}
    >
      {children}
    </Component>
  );
};

export interface LinearCardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export const LinearCardDescription: React.FC<LinearCardDescriptionProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <p className={cn("text-sm text-[#8B92B5] dark:text-[#6C6F7E]", className)} {...props}>
      {children}
    </p>
  );
};

export interface LinearCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const LinearCardContent: React.FC<LinearCardContentProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  );
};

export interface LinearCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const LinearCardFooter: React.FC<LinearCardFooterProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn("flex items-center pt-4 mt-4 border-t border-[#E1E4E8] dark:border-[#2C2D30]", className)} {...props}>
      {children}
    </div>
  );
};
