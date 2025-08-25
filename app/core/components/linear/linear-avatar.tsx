import React from 'react';
import { cn } from '~/core/lib/utils';

export interface LinearAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  fallback?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  shape?: 'circle' | 'square';
}

const getAvatarStyles = (size: string, shape: string) => {
  const sizeStyles = {
    xs: "w-6 h-6",
    sm: "w-8 h-8", 
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
    "2xl": "w-20 h-20"
  };
  
  const shapeStyles = {
    circle: "rounded-full",
    square: "rounded-lg"
  };
  
  return cn(
    "relative inline-flex items-center justify-center overflow-hidden bg-[#F1F2F4] text-[#0D0E10] font-medium dark:bg-[#2C2D30] dark:text-[#FFFFFF]",
    sizeStyles[size as keyof typeof sizeStyles],
    shapeStyles[shape as keyof typeof shapeStyles]
  );
};

const getStatusStyles = (size: string) => {
  const statusSizes = {
    xs: "w-2 h-2",
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3", 
    lg: "w-3.5 h-3.5",
    xl: "w-4 h-4",
    "2xl": "w-5 h-5"
  };
  
  return cn(
    "absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-[#1A1B1E]",
    statusSizes[size as keyof typeof statusSizes]
  );
};

const getStatusColor = (status: string) => {
  const statusColors = {
    online: "bg-[#10B981]",
    offline: "bg-[#8B92B5]",
    away: "bg-[#F59E0B]",
    busy: "bg-[#EF4444]"
  };
  
  return statusColors[status as keyof typeof statusColors];
};

export const LinearAvatar: React.FC<LinearAvatarProps> = ({
  src,
  alt,
  size = 'md',
  fallback,
  status,
  shape = 'circle',
  className,
  ...props
}) => {
  const initials = fallback || alt?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  
  return (
    <div className={cn(getAvatarStyles(size, shape), className)} {...props}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <span className="text-sm font-medium">{initials}</span>
      )}
      
      {status && (
        <div className={cn(getStatusStyles(size), getStatusColor(status))} />
      )}
    </div>
  );
};

export interface LinearAvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const LinearAvatarGroup: React.FC<LinearAvatarGroupProps> = ({
  children,
  max = 5,
  size = 'md',
  className,
  ...props
}) => {
  const childrenArray = React.Children.toArray(children);
  const visibleChildren = childrenArray.slice(0, max);
  const remainingCount = childrenArray.length - max;
  
  return (
    <div className={cn("flex -space-x-2", className)} {...props}>
      {visibleChildren.map((child, index) => (
        <div key={index} className="ring-2 ring-white dark:ring-[#1A1B1E] rounded-full">
          {React.cloneElement(child as React.ReactElement<LinearAvatarProps>, { size })}
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div className="ring-2 ring-white dark:ring-[#1A1B1E] rounded-full">
          <LinearAvatar
            size={size}
            fallback={`+${remainingCount}`}
            className="bg-[#8B92B5] text-white dark:bg-[#6C6F7E]"
          />
        </div>
      )}
    </div>
  );
};
