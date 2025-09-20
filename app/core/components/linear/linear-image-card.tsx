import React from 'react';
import { cn } from '~/core/lib/utils';
import { 
  LinearCard, 
  LinearCardHeader, 
  LinearCardTitle, 
  LinearCardDescription, 
  LinearCardContent, 
  LinearCardFooter,
  type LinearCardProps 
} from './linear-card';

export interface LinearImageCardProps extends Omit<LinearCardProps, 'children'> {
  image: {
    src: string;
    alt: string;
    aspectRatio?: 'square' | 'video' | 'portrait' | 'wide';
    objectFit?: 'cover' | 'contain' | 'fill';
  };
  title?: string;
  description?: string;
  badge?: {
    text: string;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'secondary';
  };
  overlay?: boolean;
  overlayContent?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  imageClassName?: string;
}

const aspectRatioClasses = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
  wide: 'aspect-[16/9]'
};

const objectFitClasses = {
  cover: 'object-cover',
  contain: 'object-contain',
  fill: 'object-fill'
};

export const LinearImageCard: React.FC<LinearImageCardProps> = ({
  image,
  title,
  description,
  badge,
  overlay = false,
  overlayContent,
  children,
  footer,
  imageClassName,
  className,
  padding = 'md',
  ...props
}) => {
  const { src, alt, aspectRatio = 'video', objectFit = 'cover' } = image;

  return (
    <LinearCard 
      className={cn("overflow-hidden", className)} 
      padding={undefined}
      {...props}
    >
      {/* Image Container */}
      <div className="relative group">
        <div className={cn(
          "w-full overflow-hidden",
          aspectRatioClasses[aspectRatio]
        )}>
          <img
            src={src}
            alt={alt}
            className={cn(
              "w-full h-full transition-transform duration-300 group-hover:scale-105",
              objectFitClasses[objectFit],
              imageClassName
            )}
          />
        </div>

        {/* Badge Overlay */}
        {badge && (
          <div className="absolute top-3 left-3">
            <span className={cn(
              "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
              badge.variant === 'success' && "bg-[#10B981]/90 text-white",
              badge.variant === 'warning' && "bg-[#F59E0B]/90 text-white",
              badge.variant === 'error' && "bg-[#EF4444]/90 text-white",
              badge.variant === 'info' && "bg-[#3B82F6]/90 text-white",
              badge.variant === 'secondary' && "bg-[#5E6AD2]/90 text-white",
              (!badge.variant || badge.variant === 'default') && "bg-white/90 dark:bg-[#1A1B1E]/90 text-[#0D0E10] dark:text-[#FFFFFF]"
            )}>
              {badge.text}
            </span>
          </div>
        )}

        {/* Custom Overlay Content */}
        {overlay && overlayContent && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            {overlayContent}
          </div>
        )}

        {/* Gradient Overlay for Text Readability */}
        {(title || description) && overlay && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            {title && (
              <h3 className="text-white font-semibold text-lg mb-1">{title}</h3>
            )}
            {description && (
              <p className="text-white/80 text-sm">{description}</p>
            )}
          </div>
        )}
      </div>

      {/* Card Content */}
      {((title && !overlay) || description || children) && (
        <LinearCardContent className={cn(
          padding === 'sm' && "p-3",
          padding === 'md' && "p-4",
          padding === 'lg' && "p-6",
          padding === 'xl' && "p-8"
        )}>
          {/* Title and Description (when not in overlay) */}
          {!overlay && (title || description) && (
            <LinearCardHeader className="mb-0 space-y-1">
              {title && <LinearCardTitle as="h3" className="text-lg">{title}</LinearCardTitle>}
              {description && <LinearCardDescription>{description}</LinearCardDescription>}
            </LinearCardHeader>
          )}
          
          {/* Custom Content */}
          {children}
        </LinearCardContent>
      )}

      {/* Footer */}
      {footer && (
        <LinearCardFooter className={cn(
          padding === 'sm' && "px-3 pb-3",
          padding === 'md' && "px-4 pb-4",
          padding === 'lg' && "px-6 pb-6",
          padding === 'xl' && "px-8 pb-8"
        )}>
          {footer}
        </LinearCardFooter>
      )}
    </LinearCard>
  );
};

export interface LinearProductCardProps extends Omit<LinearImageCardProps, 'children' | 'footer'> {
  price?: {
    current: string;
    original?: string;
    currency?: string;
  };
  rating?: {
    value: number;
    max?: number;
    count?: number;
  };
  actionButton?: {
    text: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
    loading?: boolean;
  };
}

export const LinearProductCard: React.FC<LinearProductCardProps> = ({
  price,
  rating,
  actionButton,
  title,
  description,
  ...props
}) => {
  const renderStars = (value: number, max: number = 5) => {
    return Array.from({ length: max }, (_, index) => (
      <span
        key={index}
        className={cn(
          "text-sm",
          index < Math.floor(value) 
            ? "text-yellow-400" 
            : index < value 
            ? "text-yellow-400/50" 
            : "text-[#E1E4E8] dark:text-[#2C2D30]"
        )}
      >
        ★
      </span>
    ));
  };

  return (
    <LinearImageCard
      title={title}
      description={description}
      footer={
        <div className="w-full space-y-3">
          {/* Price and Rating */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {price && (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[#0D0E10] dark:text-[#FFFFFF]">
                    {price.currency || '$'}{price.current}
                  </span>
                  {price.original && (
                    <span className="text-sm text-[#8B92B5] dark:text-[#6C6F7E] line-through">
                      {price.currency || '$'}{price.original}
                    </span>
                  )}
                </div>
              )}
              
              {rating && (
                <div className="flex items-center gap-1">
                  <div className="flex">
                    {renderStars(rating.value, rating.max)}
                  </div>
                  {rating.count && (
                    <span className="text-xs text-[#8B92B5] dark:text-[#6C6F7E] ml-1">
                      ({rating.count})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          {actionButton && (
            <button
              onClick={actionButton.onClick}
              disabled={actionButton.loading}
              className={cn(
                "w-full px-4 py-2 rounded-md font-medium text-sm transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                actionButton.variant === 'secondary' && "bg-transparent text-[#5E6AD2] dark:text-[#7C89F9] border border-[#E1E4E8] dark:border-[#2C2D30] hover:bg-[#F8F9FA] dark:hover:bg-[#1A1B1E]",
                actionButton.variant === 'ghost' && "bg-transparent text-[#0D0E10] dark:text-[#FFFFFF] hover:bg-[#F8F9FA] dark:hover:bg-[#1A1B1E]",
                (!actionButton.variant || actionButton.variant === 'primary') && "bg-[#5E6AD2] dark:bg-[#7C89F9] text-white hover:bg-[#4C566A] dark:hover:bg-[#6B77E6]",
                actionButton.loading && "opacity-50 cursor-not-allowed"
              )}
            >
              {actionButton.loading ? "Loading..." : actionButton.text}
            </button>
          )}
        </div>
      }
      {...props}
    />
  );
};
