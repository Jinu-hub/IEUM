/**
 * Review Guide Tooltip Component
 * 
 * A tooltip component for guiding users in Review Mode.
 * Displays messages in speech bubble format corresponding to each REVIEW step.
 */

import type { Database } from 'database.types';
import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '~/core/lib/utils';

type ReviewStep = Database["public"]["Enums"]["review_step"];

interface ReviewGuideTooltipProps {
  /** Current review step */
  currentStep: ReviewStep | null;
  /** Target step this tooltip corresponds to */
  targetStep: ReviewStep;
  /** Tooltip position */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Child elements (anchor element) */
  children: ReactNode;
  /** Custom class name */
  className?: string;
  /** Callback when tooltip visibility changes */
  onVisibilityChange?: (visible: boolean) => void;
}

/**
 * Guide messages for each step
 */
const GUIDE_MESSAGES: Record<ReviewStep, { title: string; description: string; icon: string }> = {
  'review_start': {
    title: 'Starting Review Mode',
    description: 'We will guide you through connecting Slack, setting up channels, and fetching data to display.',
    icon: '🚀'
  },
  'review_connect': {
    title: 'Connect Slack',
    description: 'Click the Connect button and link your Slack Workspace in the settings page that appears.',
    icon: '🔗'
  },
  'review_setup_channel': {
    title: 'Set Up Channel',
    description: 'Click on the yellow badge showing the channel ID to have the bot join the channel.',
    icon: '📢'
  },
  'review_collecting_data': {
    title: 'Collect Data',
    description: 'Click the Collect Sample Data button to gather data. The bot will fetch channel conversations and AI will summarize them.',
    icon: '📊'
  },
  'review_completed': {
    title: 'Review Completed!',
    description: 'Great job! You have experienced the entire flow from Slack integration to data collection and AI summarization.',
    icon: '✅'
  }
};

/**
 * Get styles based on tooltip position
 */
function getPositionStyles(position: 'top' | 'bottom' | 'left' | 'right') {
  const baseArrowStyles = 'absolute w-3 h-3 bg-amber-100 dark:bg-amber-900/90 rotate-45';
  
  switch (position) {
    case 'top':
      return {
        tooltip: 'bottom-full mb-3 left-1/2 -translate-x-1/2',
        arrow: `${baseArrowStyles} -bottom-1.5 left-1/2 -translate-x-1/2`
      };
    case 'bottom':
      return {
        tooltip: 'top-full mt-3 left-1/2 -translate-x-1/2',
        arrow: `${baseArrowStyles} -top-1.5 left-1/2 -translate-x-1/2`
      };
    case 'left':
      return {
        tooltip: 'right-full mr-3 top-1/2 -translate-y-1/2',
        arrow: `${baseArrowStyles} -right-1.5 top-1/2 -translate-y-1/2`
      };
    case 'right':
      return {
        tooltip: 'left-full ml-3 top-1/2 -translate-y-1/2',
        arrow: `${baseArrowStyles} -left-1.5 top-1/2 -translate-y-1/2`
      };
  }
}

export function ReviewGuideTooltip({
  currentStep,
  targetStep,
  position = 'bottom',
  children,
  className,
  onVisibilityChange
}: ReviewGuideTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  // Show tooltip when current step matches target step
  useEffect(() => {
    const shouldShow = currentStep === targetStep;
    setIsVisible(shouldShow);
    onVisibilityChange?.(shouldShow);
  }, [currentStep, targetStep, onVisibilityChange]);
  
  const message = GUIDE_MESSAGES[targetStep];
  const positionStyles = getPositionStyles(position);
  
  if (!message) return <>{children}</>;
  
  return (
    <div className={cn('relative inline-block', className)}>
      {children}
      
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 w-72 p-4 rounded-lg shadow-lg',
            'bg-amber-100 dark:bg-amber-900/90',
            'border-2 border-amber-300 dark:border-amber-700',
            'animate-in fade-in slide-in-from-bottom-2 duration-300',
            positionStyles.tooltip
          )}
          role="tooltip"
        >
          {/* Arrow */}
          <div className={positionStyles.arrow} />
          
          {/* Content */}
          <div className="relative">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{message.icon}</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-amber-900 dark:text-amber-100 text-sm mb-1">
                  {message.title}
                </h4>
                <p className="text-amber-800 dark:text-amber-200 text-xs leading-relaxed">
                  {message.description}
                </p>
              </div>
            </div>
            
            {/* Pulse indicator */}
            <div className="absolute top-0 right-0 flex items-center justify-center w-3 h-3">
              <span className="absolute w-full h-full rounded-full bg-amber-500 opacity-75 animate-ping" />
              <span className="absolute w-3 h-3 rounded-full bg-amber-600" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Review Progress Indicator
 * Visually displays the current step
 */
interface ReviewProgressProps {
  currentStep: ReviewStep | null;
  className?: string;
}

const STEP_ORDER: ReviewStep[] = [
  'review_start',
  'review_connect',
  'review_setup_channel',
  'review_collecting_data',
  'review_completed'
];

const STEP_LABELS: Record<ReviewStep, string> = {
  'review_start': 'Start',
  'review_connect': 'Connect',
  'review_setup_channel': 'Channel Setup',
  'review_collecting_data': 'Data Collection',
  'review_completed': 'Complete'
};

export function ReviewProgress({ currentStep, className }: ReviewProgressProps) {
  const currentIndex = currentStep ? STEP_ORDER.indexOf(currentStep) : -1;
  
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700" />
        <div 
          className="absolute top-4 left-0 h-0.5 bg-amber-500 transition-all duration-500"
          style={{ width: `${Math.max(0, (currentIndex / (STEP_ORDER.length - 1)) * 100)}%` }}
        />
        
        {/* Steps */}
        {STEP_ORDER.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;
          
          return (
            <div key={step} className="relative flex flex-col items-center z-10">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300',
                  isCompleted && 'bg-amber-500 text-white',
                  isCurrent && 'bg-amber-500 text-white ring-4 ring-amber-200 dark:ring-amber-800',
                  isPending && 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                )}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              <span
                className={cn(
                  'mt-2 text-xs font-medium whitespace-nowrap',
                  isCurrent && 'text-amber-600 dark:text-amber-400',
                  !isCurrent && 'text-gray-500 dark:text-gray-400'
                )}
              >
                {STEP_LABELS[step]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Review Mode Banner
 * Displayed at the top of the page to indicate Review Mode is active
 */
interface ReviewModeBannerProps {
  currentStep: ReviewStep | null;
  onDismiss?: () => void;
  className?: string;
}

export function ReviewModeBanner({ currentStep, onDismiss, className }: ReviewModeBannerProps) {
  if (!currentStep) return null;
  
  const message = GUIDE_MESSAGES[currentStep];
  
  return (
    <div
      className={cn(
        'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30',
        'border border-amber-200 dark:border-amber-700 rounded-lg p-4 mb-6',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <span className="text-3xl">{message?.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded">
              Review Mode
            </span>
            <h3 className="font-bold text-amber-900 dark:text-amber-100">
              {message?.title}
            </h3>
          </div>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            {message?.description}
          </p>
          
          {/* Progress indicator */}
          <div className="mt-4">
            <ReviewProgress currentStep={currentStep} />
          </div>
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

