import React from 'react';
import { Github, Twitter, Linkedin, Mail, ExternalLink } from 'lucide-react';
import { cn } from '~/core/lib/utils';
import { LinearButton } from './linear-button';
import { LinearInput } from './linear-input';

export interface LinearFooterProps extends React.HTMLAttributes<HTMLElement> {
  brand?: {
    logo?: React.ReactNode;
    name?: string;
    description?: string;
  };
  links?: {
    title: string;
    items: {
      label: string;
      href: string;
      external?: boolean;
    }[];
  }[];
  social?: {
    platform: 'github' | 'twitter' | 'linkedin' | 'email' | 'custom';
    href: string;
    icon?: React.ReactNode;
    label?: string;
  }[];
  newsletter?: {
    title: string;
    description: string;
    placeholder?: string;
    buttonText?: string;
    onSubmit?: (email: string) => void;
  };
  legal?: {
    copyright?: string;
    links?: {
      label: string;
      href: string;
    }[];
  };
  variant?: 'default' | 'minimal' | 'rich';
}

const getSocialIcon = (platform: string, customIcon?: React.ReactNode) => {
  if (customIcon) return customIcon;
  
  const iconProps = { className: "w-5 h-5" };
  
  switch (platform) {
    case 'github':
      return <Github {...iconProps} />;
    case 'twitter':
      return <Twitter {...iconProps} />;
    case 'linkedin':
      return <Linkedin {...iconProps} />;
    case 'email':
      return <Mail {...iconProps} />;
    default:
      return <ExternalLink {...iconProps} />;
  }
};

export const LinearFooter: React.FC<LinearFooterProps> = ({
  brand,
  links = [],
  social = [],
  newsletter,
  legal,
  variant = 'default',
  className,
  ...props
}) => {
  const [newsletterEmail, setNewsletterEmail] = React.useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletter?.onSubmit && newsletterEmail) {
      newsletter.onSubmit(newsletterEmail);
      setNewsletterEmail('');
    }
  };

  const footerStyles = cn(
    "bg-white dark:bg-[#0D0E10] border-t border-[#E1E4E8] dark:border-[#2C2D30]",
    className
  );

  if (variant === 'minimal') {
    return (
      <footer className={footerStyles} {...props}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Brand */}
            {brand && (
              <div className="flex items-center space-x-2">
                {brand.logo}
                {brand.name && (
                  <span className="text-lg font-bold text-[#0D0E10] dark:text-[#FFFFFF]">
                    {brand.name}
                  </span>
                )}
              </div>
            )}

            {/* Social Links */}
            {social.length > 0 && (
              <div className="flex items-center space-x-4">
                {social.map((item, index) => (
                  <a
                    key={index}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8B92B5] dark:text-[#6C6F7E] hover:text-[#5E6AD2] dark:hover:text-[#7C89F9] transition-colors"
                    aria-label={item.label || item.platform}
                  >
                    {getSocialIcon(item.platform, item.icon)}
                  </a>
                ))}
              </div>
            )}

            {/* Copyright */}
            {legal?.copyright && (
              <div className="text-sm text-[#8B92B5] dark:text-[#6C6F7E]">
                {legal.copyright}
              </div>
            )}
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className={footerStyles} {...props}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand Section */}
            {brand && (
              <div className="lg:col-span-1">
                <div className="flex items-center space-x-2 mb-4">
                  {brand.logo}
                  {brand.name && (
                    <span className="text-xl font-bold text-[#0D0E10] dark:text-[#FFFFFF]">
                      {brand.name}
                    </span>
                  )}
                </div>
                {brand.description && (
                  <p className="text-[#8B92B5] dark:text-[#6C6F7E] text-sm leading-relaxed">
                    {brand.description}
                  </p>
                )}

                {/* Social Links */}
                {social.length > 0 && (
                  <div className="flex items-center space-x-4 mt-6">
                    {social.map((item, index) => (
                      <a
                        key={index}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#8B92B5] dark:text-[#6C6F7E] hover:text-[#5E6AD2] dark:hover:text-[#7C89F9] transition-colors"
                        aria-label={item.label || item.platform}
                      >
                        {getSocialIcon(item.platform, item.icon)}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Links Sections */}
            {links.map((section, index) => (
              <div key={index} className="lg:col-span-1">
                <h3 className="text-sm font-semibold text-[#0D0E10] dark:text-[#FFFFFF] uppercase tracking-wider mb-4">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex}>
                      <a
                        href={item.href}
                        target={item.external ? "_blank" : undefined}
                        rel={item.external ? "noopener noreferrer" : undefined}
                        className="text-[#8B92B5] dark:text-[#6C6F7E] hover:text-[#5E6AD2] dark:hover:text-[#7C89F9] transition-colors text-sm flex items-center"
                      >
                        {item.label}
                        {item.external && (
                          <ExternalLink className="w-3 h-3 ml-1" />
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Newsletter Section */}
            {newsletter && (
              <div className="lg:col-span-1">
                <h3 className="text-sm font-semibold text-[#0D0E10] dark:text-[#FFFFFF] uppercase tracking-wider mb-4">
                  {newsletter.title}
                </h3>
                <p className="text-[#8B92B5] dark:text-[#6C6F7E] text-sm mb-4">
                  {newsletter.description}
                </p>
                <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                  <LinearInput
                    type="email"
                    placeholder={newsletter.placeholder || "Enter your email"}
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    required
                  />
                  <LinearButton
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="w-full"
                  >
                    {newsletter.buttonText || "Subscribe"}
                  </LinearButton>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-[#E1E4E8] dark:border-[#2C2D30] py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            {legal?.copyright && (
              <div className="text-sm text-[#8B92B5] dark:text-[#6C6F7E]">
                {legal.copyright}
              </div>
            )}

            {/* Legal Links */}
            {legal?.links && legal.links.length > 0 && (
              <div className="flex items-center space-x-6">
                {legal.links.map((item, index) => (
                  <a
                    key={index}
                    href={item.href}
                    className="text-sm text-[#8B92B5] dark:text-[#6C6F7E] hover:text-[#5E6AD2] dark:hover:text-[#7C89F9] transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
