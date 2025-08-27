import React from 'react';
import { cn } from '~/core/lib/utils';

export interface LinearToggleProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  label?: string;
  labelPosition?: 'left' | 'right';
  disabled?: boolean;
}

const sizeClasses = {
  sm: {
    track: 'h-4 w-7',
    thumb: 'h-3 w-3',
    thumbTranslate: 'translate-x-3',
    text: 'text-xs'
  },
  md: {
    track: 'h-6 w-11',
    thumb: 'h-5 w-5',
    thumbTranslate: 'translate-x-5',
    text: 'text-sm'
  },
  lg: {
    track: 'h-7 w-14',
    thumb: 'h-6 w-6',
    thumbTranslate: 'translate-x-7',
    text: 'text-base'
  }
};

const variantClasses = {
  default: {
    active: 'bg-[#5E6AD2] dark:bg-[#7C89F9]',
    inactive: 'bg-[#E1E4E8] dark:bg-[#2C2D30]',
    focus: 'focus:ring-[#5E6AD2]/20 dark:focus:ring-[#7C89F9]/20'
  },
  success: {
    active: 'bg-green-500 dark:bg-green-400',
    inactive: 'bg-[#E1E4E8] dark:bg-[#2C2D30]',
    focus: 'focus:ring-green-500/20'
  },
  warning: {
    active: 'bg-amber-500 dark:bg-amber-400',
    inactive: 'bg-[#E1E4E8] dark:bg-[#2C2D30]',
    focus: 'focus:ring-amber-500/20'
  },
  error: {
    active: 'bg-red-500 dark:bg-red-400',
    inactive: 'bg-[#E1E4E8] dark:bg-[#2C2D30]',
    focus: 'focus:ring-red-500/20'
  }
};

export const LinearToggle: React.FC<LinearToggleProps> = ({
  checked = false,
  onChange,
  size = 'md',
  variant = 'default',
  label,
  labelPosition = 'right',
  disabled = false,
  className,
  ...props
}) => {
  const handleToggle = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  const sizeStyle = sizeClasses[size];
  const variantStyle = variantClasses[variant];

  const toggleButton = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={handleToggle}
      disabled={disabled}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#0D0E10]',
        sizeStyle.track,
        checked ? variantStyle.active : variantStyle.inactive,
        variantStyle.focus,
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          'pointer-events-none inline-block transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
          sizeStyle.thumb,
          checked ? sizeStyle.thumbTranslate : 'translate-x-0'
        )}
      />
    </button>
  );

  if (!label) {
    return toggleButton;
  }

  return (
    <div className="flex items-center gap-3">
      {labelPosition === 'left' && (
        <label 
          className={cn(
            'font-medium text-[#0D0E10] dark:text-[#FFFFFF] cursor-pointer',
            sizeStyle.text,
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onClick={!disabled ? handleToggle : undefined}
        >
          {label}
        </label>
      )}
      
      {toggleButton}
      
      {labelPosition === 'right' && (
        <label 
          className={cn(
            'font-medium text-[#0D0E10] dark:text-[#FFFFFF] cursor-pointer',
            sizeStyle.text,
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onClick={!disabled ? handleToggle : undefined}
        >
          {label}
        </label>
      )}
    </div>
  );
};

// 컴포넌트 표시명 설정 (개발 도구에서 표시됨)
LinearToggle.displayName = 'LinearToggle';

export default LinearToggle;
