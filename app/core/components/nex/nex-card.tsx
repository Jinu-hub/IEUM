import React from 'react';
import { cn } from '~/core/lib/utils';

export interface NexCardProps extends React.HTMLAttributes<HTMLDivElement> {
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

export const NexCard: React.FC<NexCardProps> = ({
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

export interface NexCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const NexCardHeader: React.FC<NexCardHeaderProps> = ({
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

export interface NexCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const NexCardTitle: React.FC<NexCardTitleProps> = ({
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

export interface NexCardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export const NexCardDescription: React.FC<NexCardDescriptionProps> = ({
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

export interface NexCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const NexCardContent: React.FC<NexCardContentProps> = ({
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

export interface NexCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const NexCardFooter: React.FC<NexCardFooterProps> = ({
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
