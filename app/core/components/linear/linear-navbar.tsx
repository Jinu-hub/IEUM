import React, { useState } from 'react';
import { Menu, X, ChevronDown, Search, Bell, User } from 'lucide-react';
import { cn } from '~/core/lib/utils';
import { LinearButton } from './linear-button';
import { LinearAvatar } from './linear-avatar';
import { LinearBadge } from './linear-badge';

export interface LinearNavbarProps extends React.HTMLAttributes<HTMLElement> {
  brand?: {
    logo?: React.ReactNode;
    name?: string;
    href?: string;
  };
  navigation?: {
    label: string;
    href: string;
    current?: boolean;
    children?: {
      label: string;
      href: string;
      description?: string;
    }[];
  }[];
  actions?: {
    search?: boolean;
    notifications?: {
      count?: number;
      onClick?: () => void;
    };
    user?: {
      name: string;
      email?: string;
      avatar?: string;
      menu?: {
        label: string;
        href: string;
        onClick?: () => void;
      }[];
    };
    cta?: {
      label: string;
      href?: string;
      onClick?: () => void;
      variant?: 'primary' | 'secondary' | 'ghost';
    };
  };
  variant?: 'default' | 'transparent' | 'solid';
  sticky?: boolean;
}

export const LinearNavbar: React.FC<LinearNavbarProps> = ({
  brand,
  navigation = [],
  actions,
  variant = 'default',
  sticky = false,
  className,
  ...props
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const navbarStyles = cn(
    "w-full border-b transition-all duration-200 z-50",
    variant === 'default' && "bg-white/80 dark:bg-[#0D0E10]/80 backdrop-blur-lg border-[#E1E4E8] dark:border-[#2C2D30]",
    variant === 'transparent' && "bg-transparent border-transparent",
    variant === 'solid' && "bg-white dark:bg-[#0D0E10] border-[#E1E4E8] dark:border-[#2C2D30]",
    sticky && "sticky top-0",
    className
  );

  return (
    <nav className={navbarStyles} {...props}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Brand */}
          <div className="flex items-center">
            {brand && (
              <a
                href={brand.href || '/'}
                className="flex items-center space-x-2 text-[#0D0E10] dark:text-[#FFFFFF] hover:opacity-75 transition-opacity"
              >
                {brand.logo}
                {brand.name && (
                  <span className="text-xl font-bold">{brand.name}</span>
                )}
              </a>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <div key={item.label} className="relative">
                {item.children ? (
                  <button
                    className={cn(
                      "flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      item.current
                        ? "text-[#5E6AD2] dark:text-[#7C89F9] bg-[#5E6AD2]/10 dark:bg-[#7C89F9]/10"
                        : "text-[#0D0E10] dark:text-[#FFFFFF] hover:text-[#5E6AD2] dark:hover:text-[#7C89F9] hover:bg-[#F8F9FA] dark:hover:bg-[#1A1B1E]"
                    )}
                    onClick={() => setActiveDropdown(activeDropdown === item.label ? null : item.label)}
                  >
                    <span>{item.label}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                ) : (
                  <a
                    href={item.href}
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      item.current
                        ? "text-[#5E6AD2] dark:text-[#7C89F9] bg-[#5E6AD2]/10 dark:bg-[#7C89F9]/10"
                        : "text-[#0D0E10] dark:text-[#FFFFFF] hover:text-[#5E6AD2] dark:hover:text-[#7C89F9] hover:bg-[#F8F9FA] dark:hover:bg-[#1A1B1E]"
                    )}
                  >
                    {item.label}
                  </a>
                )}

                {/* Dropdown Menu */}
                {item.children && activeDropdown === item.label && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-[#1A1B1E] border border-[#E1E4E8] dark:border-[#2C2D30] rounded-lg shadow-lg py-2">
                    {item.children.map((child) => (
                      <a
                        key={child.label}
                        href={child.href}
                        className="block px-4 py-3 text-sm hover:bg-[#F8F9FA] dark:hover:bg-[#2C2D30] transition-colors"
                      >
                        <div className="font-medium text-[#0D0E10] dark:text-[#FFFFFF]">
                          {child.label}
                        </div>
                        {child.description && (
                          <div className="text-xs text-[#8B92B5] dark:text-[#6C6F7E] mt-1">
                            {child.description}
                          </div>
                        )}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            {actions?.search && (
              <button className="p-2 text-[#8B92B5] dark:text-[#6C6F7E] hover:text-[#0D0E10] dark:hover:text-[#FFFFFF] transition-colors">
                <Search className="w-5 h-5" />
              </button>
            )}

            {/* Notifications */}
            {actions?.notifications && (
              <button
                onClick={actions.notifications.onClick}
                className="relative p-2 text-[#8B92B5] dark:text-[#6C6F7E] hover:text-[#0D0E10] dark:hover:text-[#FFFFFF] transition-colors"
              >
                <Bell className="w-5 h-5" />
                {actions.notifications.count && actions.notifications.count > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#EF4444] text-white text-xs rounded-full flex items-center justify-center">
                    {actions.notifications.count > 9 ? '9+' : actions.notifications.count}
                  </span>
                )}
              </button>
            )}

            {/* User Menu */}
            {actions?.user ? (
              <div className="relative">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === 'user' ? null : 'user')}
                  className="flex items-center space-x-2 p-1 rounded-full hover:bg-[#F8F9FA] dark:hover:bg-[#1A1B1E] transition-colors"
                >
                  <LinearAvatar
                    src={actions.user.avatar}
                    fallback={actions.user.name}
                    size="sm"
                  />
                </button>

                {/* User Dropdown */}
                {activeDropdown === 'user' && actions.user.menu && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-[#1A1B1E] border border-[#E1E4E8] dark:border-[#2C2D30] rounded-lg shadow-lg py-2">
                    <div className="px-4 py-3 border-b border-[#E1E4E8] dark:border-[#2C2D30]">
                      <div className="text-sm font-medium text-[#0D0E10] dark:text-[#FFFFFF]">
                        {actions.user.name}
                      </div>
                      {actions.user.email && (
                        <div className="text-xs text-[#8B92B5] dark:text-[#6C6F7E]">
                          {actions.user.email}
                        </div>
                      )}
                    </div>
                    {actions.user.menu.map((item) => (
                      <button
                        key={item.label}
                        onClick={item.onClick}
                        className="block w-full text-left px-4 py-2 text-sm text-[#0D0E10] dark:text-[#FFFFFF] hover:bg-[#F8F9FA] dark:hover:bg-[#2C2D30] transition-colors"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              actions?.cta && (
                <LinearButton
                  variant={actions.cta.variant || 'primary'}
                  onClick={actions.cta.onClick}
                  size="sm"
                >
                  {actions.cta.label}
                </LinearButton>
              )
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-[#8B92B5] dark:text-[#6C6F7E] hover:text-[#0D0E10] dark:hover:text-[#FFFFFF] transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#E1E4E8] dark:border-[#2C2D30] py-4">
            <div className="space-y-1">
              {navigation.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "block px-3 py-2 rounded-md text-base font-medium transition-colors",
                    item.current
                      ? "text-[#5E6AD2] dark:text-[#7C89F9] bg-[#5E6AD2]/10 dark:bg-[#7C89F9]/10"
                      : "text-[#0D0E10] dark:text-[#FFFFFF] hover:text-[#5E6AD2] dark:hover:text-[#7C89F9] hover:bg-[#F8F9FA] dark:hover:bg-[#1A1B1E]"
                  )}
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* Mobile Actions */}
            {(actions?.user || actions?.cta) && (
              <div className="mt-4 pt-4 border-t border-[#E1E4E8] dark:border-[#2C2D30]">
                {actions.user ? (
                  <div className="px-3 py-2">
                    <div className="text-base font-medium text-[#0D0E10] dark:text-[#FFFFFF]">
                      {actions.user.name}
                    </div>
                    {actions.user.email && (
                      <div className="text-sm text-[#8B92B5] dark:text-[#6C6F7E]">
                        {actions.user.email}
                      </div>
                    )}
                  </div>
                ) : (
                  actions.cta && (
                    <div className="px-3">
                      <LinearButton
                        variant={actions.cta.variant || 'primary'}
                        onClick={actions.cta.onClick}
                        className="w-full"
                      >
                        {actions.cta.label}
                      </LinearButton>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
