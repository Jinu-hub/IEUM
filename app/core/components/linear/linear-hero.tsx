import React from 'react';
import { ArrowRight, Play, Star, Users, Zap, Award } from 'lucide-react';
import { cn } from '~/core/lib/utils';
import { LinearButton } from './linear-button';
import { LinearBadge } from './linear-badge';
import { LinearAvatar, LinearAvatarGroup } from './linear-avatar';

export interface LinearHeroProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'default' | 'centered' | 'split' | 'minimal' | 'video';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  badge?: {
    text: string;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'secondary';
    href?: string;
  };
  title: string;
  subtitle?: string;
  description?: string;
  actions?: {
    primary?: {
      label: string;
      href?: string;
      onClick?: () => void;
      variant?: 'primary' | 'secondary' | 'ghost' | 'gradient';
      icon?: React.ReactNode;
    };
    secondary?: {
      label: string;
      href?: string;
      onClick?: () => void;
      variant?: 'primary' | 'secondary' | 'ghost';
      icon?: React.ReactNode;
    };
  };
  media?: {
    type: 'image' | 'video';
    src: string;
    alt?: string;
    placeholder?: string;
  };
  features?: {
    icon: React.ReactNode;
    text: string;
  }[];
  social?: {
    avatars?: string[];
    count?: string;
    text?: string;
  };
  background?: 'none' | 'gradient' | 'pattern' | 'custom';
}

const sizeClasses = {
  sm: 'py-12 md:py-16',
  md: 'py-16 md:py-20',
  lg: 'py-20 md:py-24',
  xl: 'py-24 md:py-32'
};

const backgroundClasses = {
  none: '',
  gradient: 'bg-gradient-to-br from-[#F8F9FA] via-white to-[#F1F2F4] dark:from-[#0D0E10] dark:via-[#1A1B1E] dark:to-[#0D0E10]',
  pattern: 'bg-[url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23E1E4E8" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] bg-white dark:bg-[#0D0E10]',
  custom: ''
};

export const LinearHero: React.FC<LinearHeroProps> = ({
  variant = 'default',
  size = 'lg',
  badge,
  title,
  subtitle,
  description,
  actions,
  media,
  features,
  social,
  background = 'gradient',
  className,
  children,
  ...props
}) => {
  const heroStyles = cn(
    'relative overflow-hidden',
    sizeClasses[size],
    backgroundClasses[background],
    className
  );

  if (variant === 'minimal') {
    return (
      <section className={heroStyles} {...props}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {badge && (
            <div className="mb-6">
              <LinearBadge variant={badge.variant}>
                {badge.text}
              </LinearBadge>
            </div>
          )}
          
          <h1 className="text-4xl md:text-6xl font-bold text-[#0D0E10] dark:text-[#FFFFFF] mb-6">
            {title}
          </h1>
          
          {description && (
            <p className="text-xl text-[#8B92B5] dark:text-[#6C6F7E] mb-8 max-w-2xl mx-auto">
              {description}
            </p>
          )}
          
          {actions && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {actions.primary && (
                <LinearButton
                  variant={actions.primary.variant || 'primary'}
                  size="lg"
                  onClick={actions.primary.onClick}
                  rightIcon={actions.primary.icon}
                >
                  {actions.primary.label}
                </LinearButton>
              )}
              {actions.secondary && (
                <LinearButton
                  variant={actions.secondary.variant || 'secondary'}
                  size="lg"
                  onClick={actions.secondary.onClick}
                  leftIcon={actions.secondary.icon}
                >
                  {actions.secondary.label}
                </LinearButton>
              )}
            </div>
          )}
        </div>
      </section>
    );
  }

  if (variant === 'split') {
    return (
      <section className={heroStyles} {...props}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div>
              {badge && (
                <div className="mb-6">
                  {badge.href ? (
                    <a href={badge.href}>
                      <LinearBadge variant={badge.variant}>
                        {badge.text}
                      </LinearBadge>
                    </a>
                  ) : (
                    <LinearBadge variant={badge.variant}>
                      {badge.text}
                    </LinearBadge>
                  )}
                </div>
              )}
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0D0E10] dark:text-[#FFFFFF] mb-6">
                {title}
              </h1>
              
              {subtitle && (
                <h2 className="text-xl md:text-2xl text-[#5E6AD2] dark:text-[#7C89F9] font-medium mb-4">
                  {subtitle}
                </h2>
              )}
              
              {description && (
                <p className="text-lg text-[#8B92B5] dark:text-[#6C6F7E] mb-8">
                  {description}
                </p>
              )}
              
              {actions && (
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  {actions.primary && (
                    <LinearButton
                      variant={actions.primary.variant || 'primary'}
                      size="lg"
                      onClick={actions.primary.onClick}
                      rightIcon={actions.primary.icon || <ArrowRight className="w-4 h-4" />}
                    >
                      {actions.primary.label}
                    </LinearButton>
                  )}
                  {actions.secondary && (
                    <LinearButton
                      variant={actions.secondary.variant || 'secondary'}
                      size="lg"
                      onClick={actions.secondary.onClick}
                      leftIcon={actions.secondary.icon || <Play className="w-4 h-4" />}
                    >
                      {actions.secondary.label}
                    </LinearButton>
                  )}
                </div>
              )}
              
              {/* Features */}
              {features && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-[#5E6AD2]/10 dark:bg-[#7C89F9]/10 rounded-lg flex items-center justify-center text-[#5E6AD2] dark:text-[#7C89F9]">
                        {feature.icon}
                      </div>
                      <span className="text-sm text-[#0D0E10] dark:text-[#FFFFFF]">
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Social Proof */}
              {social && (
                <div className="flex items-center space-x-4">
                  {social.avatars && (
                    <LinearAvatarGroup max={3} size="sm">
                      {social.avatars.map((avatar, index) => (
                        <LinearAvatar key={index} src={avatar} fallback={`U${index + 1}`} />
                      ))}
                    </LinearAvatarGroup>
                  )}
                  <div>
                    {social.count && (
                      <div className="text-sm font-medium text-[#0D0E10] dark:text-[#FFFFFF]">
                        {social.count}
                      </div>
                    )}
                    {social.text && (
                      <div className="text-xs text-[#8B92B5] dark:text-[#6C6F7E]">
                        {social.text}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Media */}
            {media && (
              <div className="relative">
                {media.type === 'image' ? (
                  <img
                    src={media.src}
                    alt={media.alt || ''}
                    className="w-full h-auto rounded-2xl shadow-2xl"
                  />
                ) : (
                  <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
                    <video
                      src={media.src}
                      className="w-full h-full object-cover"
                      poster={media.placeholder}
                      controls
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Default centered variant
  return (
    <section className={heroStyles} {...props}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {badge && (
          <div className="mb-6">
            {badge.href ? (
              <a href={badge.href}>
                <LinearBadge variant={badge.variant}>
                  {badge.text}
                </LinearBadge>
              </a>
            ) : (
              <LinearBadge variant={badge.variant}>
                {badge.text}
              </LinearBadge>
            )}
          </div>
        )}
        
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-[#0D0E10] dark:text-[#FFFFFF] mb-6">
          {title}
        </h1>
        
        {subtitle && (
          <h2 className="text-xl md:text-2xl text-[#5E6AD2] dark:text-[#7C89F9] font-medium mb-6">
            {subtitle}
          </h2>
        )}
        
        {description && (
          <p className="text-xl text-[#8B92B5] dark:text-[#6C6F7E] mb-8 max-w-3xl mx-auto">
            {description}
          </p>
        )}
        
        {actions && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {actions.primary && (
              <LinearButton
                variant={actions.primary.variant || 'primary'}
                size="lg"
                onClick={actions.primary.onClick}
                rightIcon={actions.primary.icon || <ArrowRight className="w-4 h-4" />}
              >
                {actions.primary.label}
              </LinearButton>
            )}
            {actions.secondary && (
              <LinearButton
                variant={actions.secondary.variant || 'secondary'}
                size="lg"
                onClick={actions.secondary.onClick}
                leftIcon={actions.secondary.icon || <Play className="w-4 h-4" />}
              >
                {actions.secondary.label}
              </LinearButton>
            )}
          </div>
        )}
        
        {/* Media */}
        {media && (
          <div className="relative mb-12">
            {media.type === 'image' ? (
              <img
                src={media.src}
                alt={media.alt || ''}
                className="w-full max-w-4xl mx-auto h-auto rounded-2xl shadow-2xl"
              />
            ) : (
              <div className="relative aspect-video max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl">
                <video
                  src={media.src}
                  className="w-full h-full object-cover"
                  poster={media.placeholder}
                  controls
                />
              </div>
            )}
          </div>
        )}
        
        {/* Features */}
        {features && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {features.map((feature, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-[#5E6AD2]/10 dark:bg-[#7C89F9]/10 rounded-xl flex items-center justify-center text-[#5E6AD2] dark:text-[#7C89F9] mb-4">
                  {feature.icon}
                </div>
                <span className="text-[#0D0E10] dark:text-[#FFFFFF] font-medium">
                  {feature.text}
                </span>
              </div>
            ))}
          </div>
        )}
        
        {/* Social Proof */}
        {social && (
          <div className="flex flex-col items-center space-y-4">
            {social.avatars && (
              <LinearAvatarGroup max={5} size="md">
                {social.avatars.map((avatar, index) => (
                  <LinearAvatar key={index} src={avatar} fallback={`U${index + 1}`} />
                ))}
              </LinearAvatarGroup>
            )}
            <div className="text-center">
              {social.count && (
                <div className="text-lg font-medium text-[#0D0E10] dark:text-[#FFFFFF]">
                  {social.count}
                </div>
              )}
              {social.text && (
                <div className="text-sm text-[#8B92B5] dark:text-[#6C6F7E]">
                  {social.text}
                </div>
              )}
            </div>
          </div>
        )}
        
        {children}
      </div>
    </section>
  );
};
