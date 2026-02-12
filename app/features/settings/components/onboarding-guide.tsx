
/**
 * Onboarding Guide Components
 * 
 * Components for guiding users through the onboarding process.
 * Includes tooltip, progress indicator, and banner components.
 */

import type { Database } from 'database.types';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { NexButton } from '~/core/components/nex';
import { cn } from '~/core/lib/utils';

type OnboardingStep = Database["public"]["Enums"]["onboarding_step"];
type SetupIntegrationsStep = Database["public"]["Enums"]["setup_integrations"];
type SetupMailingListStep = Database["public"]["Enums"]["setup_mailing_list"];
type SetupTargetsStep = Database["public"]["Enums"]["setup_targets"];

interface OnboardingGuideTooltipProps {
  /** Current onboarding step */
  currentStep: OnboardingStep | null;
  /** Target step this tooltip corresponds to */
  targetStep: OnboardingStep;
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
 * Guide messages for each step (will be overridden by i18n)
 */
const DEFAULT_GUIDE_MESSAGES: Record<OnboardingStep, { title: string; description: string; icon: string }> = {
  'welcome': {
    title: 'Welcome to NexLetter',
    description: 'Let\'s set up your newsletter. Click the button to go to settings.',
    icon: '👋'
  },
  /*
  'setup_workspace': {
    title: 'Setup Workspace',
    description: 'Configure your workspace settings.',
    icon: '🏢'
  },
  */
  'setup_integrations': {
    title: 'Setup Integrations',
    description: 'Setup your integrations. GitHub and Slack are supported.',
    icon: '🔗'
  },
  'setup_mailing_list': {
    title: 'Setup Mailing List',
    description: 'Setup your mailing list. You can add email addresses later.',
    icon: '📧'
  },
  'setup_targets': {
    title: 'Configure Targets',
    description: 'Set up data sources (GitHub repos, Slack channels) and delivery schedule.',
    icon: '🎯'
  },
  /*
  'setup_rules': {
    title: 'Setup Rules',
    description: 'Configure rules for your newsletter.',
    icon: '📋'
  },
  */
  'first_mail_sending': {
    title: 'Send First Newsletter',
    description: 'Ready to send your first newsletter? We\'ll collect the past 7 days of data.',
    icon: '📬'
  },
  'completed': {
    title: 'Setup Complete!',
    description: 'Congratulations! Your NexLetter setup is complete.',
    icon: '✅'
  }
};

/**
 * Get styles based on tooltip position
 */
function getPositionStyles(position: 'top' | 'bottom' | 'left' | 'right') {
  const baseArrowStyles = 'absolute w-3 h-3 bg-blue-100 dark:bg-blue-900/90 rotate-45';
  
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

export function OnboardingGuideTooltip({
  currentStep,
  targetStep,
  position = 'bottom',
  children,
  className,
  onVisibilityChange
}: OnboardingGuideTooltipProps) {
  const { t } = useTranslation("common", { keyPrefix: "onboarding" });
  const [isVisible, setIsVisible] = useState(false);
  
  // Show tooltip when current step matches target step
  useEffect(() => {
    const shouldShow = currentStep === targetStep;
    setIsVisible(shouldShow);
    onVisibilityChange?.(shouldShow);
  }, [currentStep, targetStep, onVisibilityChange]);
  
  const defaultMessage = DEFAULT_GUIDE_MESSAGES[targetStep];
  const message = {
    title: t(`steps.${targetStep}.title`, defaultMessage.title),
    description: t(`steps.${targetStep}.description`, defaultMessage.description),
    icon: defaultMessage.icon
  };
  const positionStyles = getPositionStyles(position);
  
  if (!message) return <>{children}</>;
  
  return (
    <div className={cn('relative inline-block', className)}>
      {children}
      
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 w-72 p-4 rounded-lg shadow-lg',
            'bg-blue-100 dark:bg-blue-900/90',
            'border-2 border-blue-300 dark:border-blue-700',
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
                <h4 className="font-bold text-blue-900 dark:text-blue-100 text-sm mb-1">
                  {message.title}
                </h4>
                <p className="text-blue-800 dark:text-blue-200 text-xs leading-relaxed">
                  {message.description}
                </p>
              </div>
            </div>
            
            {/* Pulse indicator */}
            <div className="absolute top-0 right-0 flex items-center justify-center w-3 h-3">
              <span className="absolute w-full h-full rounded-full bg-blue-500 opacity-75 animate-ping" />
              <span className="absolute w-3 h-3 rounded-full bg-blue-600" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Onboarding Progress Indicator
 * Visually displays the current step
 */
interface OnboardingProgressProps {
  currentStep: OnboardingStep | null;
  className?: string;
}

const STEP_ORDER: OnboardingStep[] = [
  'welcome',
  'setup_integrations',
  'setup_mailing_list',
  'setup_targets',
  'first_mail_sending',
  'completed'
];

export function OnboardingProgress({ currentStep, className }: OnboardingProgressProps) {
  const { t } = useTranslation("common", { keyPrefix: "onboarding" });
  
  const STEP_LABELS: Record<OnboardingStep, string> = {
    'welcome': t('progressSteps.welcome', 'Start'),
   // 'setup_workspace': t('progressSteps.setup_workspace', 'Workspace'),
    'setup_integrations': t('progressSteps.setup_integrations', 'Integrations'),
   // 'connect_slack': t('progressSteps.connect_slack', 'Slack'),
    'setup_mailing_list': t('progressSteps.setup_mailing_list', 'Mail List'),
    'setup_targets': t('progressSteps.setup_targets', 'Targets'),
   // 'setup_rules': t('progressSteps.setup_rules', 'Rules'),
    'first_mail_sending': t('progressSteps.first_mail_sending', 'First Mail'),
    'completed': t('progressSteps.completed', 'Complete')
  };
  
  const currentIndex = currentStep ? STEP_ORDER.indexOf(currentStep) : -1;
  
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700" />
        <div 
          className="absolute top-4 left-0 h-0.5 bg-blue-500 transition-all duration-500"
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
                  isCompleted && 'bg-blue-500 text-white',
                  isCurrent && 'bg-blue-500 text-white ring-4 ring-blue-200 dark:ring-blue-800',
                  isPending && 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                )}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              <span
                className={cn(
                  'mt-2 text-xs font-medium whitespace-nowrap',
                  isCurrent && 'text-blue-600 dark:text-blue-400',
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
 * Onboarding Mode Banner
 * Displayed at the top of the page to indicate Onboarding Mode is active
 */
interface OnboardingModeBannerProps {
  currentStep: OnboardingStep | null;
  workspaceId: string;
  onDismiss?: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
  className?: string;
  /** Sub-progress component to display (e.g., MailingListSubProgress, IntegrationsSubProgress) */
  subProgress?: ReactNode;
  /** Label for sub-progress (e.g., "メールリスト設定進行状況") */
  subProgressLabel?: string;
  /** Color theme for sub-progress (default: 'blue', options: 'blue', 'green', 'amber', 'purple') */
  subProgressColor?: 'blue' | 'green' | 'amber' | 'purple';
}

export function OnboardingModeBanner({ 
  currentStep, 
  workspaceId,
  onDismiss, 
  onSkip,
  showSkip = false,
  className,
  subProgress,
  subProgressLabel,
  subProgressColor = 'blue'
}: OnboardingModeBannerProps) {
  const { t } = useTranslation("common", { keyPrefix: "onboarding" });
  const navigate = useNavigate();
  
  if (!currentStep || currentStep === 'completed') return null;
  
  const defaultMessage = DEFAULT_GUIDE_MESSAGES[currentStep];
  const message = {
    title: t(`steps.${currentStep}.title`, defaultMessage.title),
    description: t(`steps.${currentStep}.description`, defaultMessage.description),
    icon: defaultMessage.icon
  };
  
  // Sub-progress color classes
  const subProgressColorClasses = {
    blue: 'text-blue-700 dark:text-blue-300',
    green: 'text-green-700 dark:text-green-300',
    amber: 'text-amber-700 dark:text-amber-300',
    purple: 'text-purple-700 dark:text-purple-300'
  };
  
  return (
    <div
      className={cn(
        'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30',
        'border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <span className="text-3xl">{message?.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded">
              {t('badge', 'Onboarding')}
            </span>
            <h3 className="font-bold text-blue-900 dark:text-blue-100">
              {message?.title}
            </h3>
          </div>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {message?.description}
          </p>
          
          {/* Progress indicator */}
          <div className="mt-4">
            <OnboardingProgress currentStep={currentStep} />
          </div>
          
          {/* Sub Progress indicator */}
          {subProgress && (
            <div className="mt-4 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              {subProgressLabel && (
                <p className={cn('text-xs mb-2 font-medium', subProgressColorClasses[subProgressColor])}>
                  {subProgressLabel}
                </p>
              )}
              {subProgress}
            </div>
          )}

          {/* Action buttons */}
          {showSkip && onSkip && (
            <div className="mt-4 flex items-center gap-2">
              <NexButton
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/50"
              >
                {t('skip', 'Skip this step')}
              </NexButton>
            </div>
          )}
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-300"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Step Selection Card
 * Used when user needs to choose between mailing list setup and target setup
 */
interface StepSelectionCardProps {
  workspaceId: string;
  onSelect: (step: 'setup_mailing_list' | 'setup_targets') => void;
  className?: string;
}

export function StepSelectionCard({ workspaceId, onSelect, className }: StepSelectionCardProps) {
  const { t } = useTranslation("common", { keyPrefix: "onboarding" });
  const navigate = useNavigate();
  
  const options = [
    {
      step: 'setup_mailing_list' as const,
      icon: '📧',
      title: t('selection.mailingList.title', 'Set Up Mailing List'),
      description: t('selection.mailingList.description', 'Group email addresses. Can be done later.'),
      path: '/settings/mail-list'
    },
    {
      step: 'setup_targets' as const,
      icon: '🎯',
      title: t('selection.targets.title', 'Set Up Targets'),
      description: t('selection.targets.description', 'Configure data sources and delivery schedule.'),
      path: '/settings/targets'
    }
  ];
  
  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-lg font-semibold text-foreground">
        {t('selection.title', 'What would you like to do next?')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((option) => (
          <button
            key={option.step}
            onClick={() => {
              onSelect(option.step);
              navigate(option.path);
            }}
            className={cn(
              'p-4 rounded-lg border-2 text-left transition-all duration-200',
              'border-gray-200 dark:border-gray-700',
              'hover:border-blue-400 dark:hover:border-blue-500',
              'hover:bg-blue-50 dark:hover:bg-blue-900/20',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            )}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{option.icon}</span>
              <div>
                <h4 className="font-semibold text-foreground">{option.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * First Mail Confirmation Dialog
 * Shows when user reaches first_mail_sending step
 */
interface FirstMailConfirmationProps {
  workspaceId: string;
  nextSchedule?: string;
  onConfirm: (sendNow: boolean) => void;
  isProcessing?: boolean;
  className?: string;
}

export function FirstMailConfirmation({ 
  workspaceId, 
  nextSchedule,
  onConfirm, 
  isProcessing = false,
  className 
}: FirstMailConfirmationProps) {
  const { t } = useTranslation("common", { keyPrefix: "onboarding" });
  
  return (
    <div className={cn(
      'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30',
      'border border-green-200 dark:border-green-700 rounded-lg p-6',
      className
    )}>
      <div className="flex items-start gap-4">
        <span className="text-4xl">📬</span>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-green-900 dark:text-green-100 mb-2">
            {t('firstMail.title', 'Send Your First Newsletter?')}
          </h3>
          <p className="text-sm text-green-800 dark:text-green-200 mb-4">
            {t('firstMail.description', 'We will collect data from the past 7 days and send the newsletter now.')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <NexButton
              variant="primary"
              onClick={() => onConfirm(true)}
              className="bg-green-600 hover:bg-green-700"
              loading={isProcessing}
              disabled={isProcessing}
            >
              {t('firstMail.sendNow', 'Yes, Send Now')}
            </NexButton>
            <NexButton
              variant="secondary"
              onClick={() => onConfirm(false)}
              disabled={isProcessing}
            >
              {t('firstMail.waitSchedule', 'No, Wait for Schedule')}
            </NexButton>
          </div>
          
          {nextSchedule && (
            <p className="text-xs text-green-700 dark:text-green-300 mt-3">
              {t('firstMail.scheduleInfo', 'Next scheduled delivery: {{schedule}}', { schedule: nextSchedule })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Navigate to Next Step Link
 * Helper component for navigation after completing a step
 */
interface NextStepLinkProps {
  nextStep: OnboardingStep;
  href: string;
  children?: ReactNode;
  className?: string;
}

export function NextStepLink({ nextStep, href, children, className }: NextStepLinkProps) {
  const { t } = useTranslation("common", { keyPrefix: "onboarding" });
  const defaultMessage = DEFAULT_GUIDE_MESSAGES[nextStep];
  
  return (
    <Link
      to={href}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
        'bg-blue-500 text-white hover:bg-blue-600',
        'transition-colors duration-200',
        className
      )}
    >
      <span>{defaultMessage.icon}</span>
      <span>{children || t(`goTo.${nextStep}`, `Go to ${defaultMessage.title}`)}</span>
      <span>→</span>
    </Link>
  );
}

/* =========================================================
   Integrations Sub-Step Components
   ========================================================= */

/**
 * Default messages for integrations sub-steps
 */
const INTEGRATIONS_SUB_STEP_MESSAGES: Record<SetupIntegrationsStep, { title: string; description: string; icon: string }> = {
  'start': {
    title: 'Starting Integrations Setup',
    description: 'Let\'s connect your services. We\'ll guide you through GitHub and Slack.',
    icon: '🚀'
  },
  'connect_github': {
    title: 'Connect GitHub',
    description: 'Click the Connect button to link your GitHub account and select repositories.',
    icon: '🐙'
  },
  'connect_slack': {
    title: 'Connect Slack',
    description: 'Click the Connect button to link your Slack workspace.',
    icon: '💬'
  },
  'setup_slack_channel': {
    title: 'Select Slack Channels',
    description: 'Choose which Slack channels to monitor for your newsletter.',
    icon: '📢'
  },
  'end': {
    title: 'Integrations Complete!',
    description: 'Great job! Your integrations are set up. Choose what to do next.',
    icon: '✅'
  }
};

const INTEGRATIONS_SUB_STEP_ORDER: SetupIntegrationsStep[] = [
  'start',
  'connect_github',
  'connect_slack',
  'setup_slack_channel',
  'end'
];

/**
 * Integrations Sub-Progress Indicator
 * Shows progress within the setup_integrations step
 */
interface IntegrationsSubProgressProps {
  currentSubStep: SetupIntegrationsStep | null;
  className?: string;
}

export function IntegrationsSubProgress({ currentSubStep, className }: IntegrationsSubProgressProps) {
  const { t } = useTranslation("common", { keyPrefix: "onboarding.integrationsSubSteps" });
  
  const SUB_STEP_LABELS: Record<SetupIntegrationsStep, string> = {
    'start': t('start', 'Start'),
    'connect_github': t('connect_github', 'GitHub'),
    'connect_slack': t('connect_slack', 'Slack'),
    'setup_slack_channel': t('setup_slack_channel', 'Channels'),
    'end': t('end', 'Done')
  };
  
  const currentIndex = currentSubStep ? INTEGRATIONS_SUB_STEP_ORDER.indexOf(currentSubStep) : -1;
  
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700" />
        <div 
          className="absolute top-3 left-0 h-0.5 bg-amber-500 transition-all duration-500"
          style={{ width: `${Math.max(0, (currentIndex / (INTEGRATIONS_SUB_STEP_ORDER.length - 1)) * 100)}%` }}
        />
        
        {/* Steps */}
        {INTEGRATIONS_SUB_STEP_ORDER.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;
          
          return (
            <div key={step} className="relative flex flex-col items-center z-10">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium transition-all duration-300',
                  isCompleted && 'bg-amber-500 text-white',
                  isCurrent && 'bg-amber-500 text-white ring-2 ring-amber-200 dark:ring-amber-800',
                  isPending && 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                )}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              <span
                className={cn(
                  'mt-1 text-[10px] font-medium whitespace-nowrap',
                  isCurrent && 'text-amber-600 dark:text-amber-400',
                  !isCurrent && 'text-gray-500 dark:text-gray-400'
                )}
              >
                {SUB_STEP_LABELS[step]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Integrations Guide Tooltip
 * Similar to ReviewGuideTooltip but for integrations sub-steps
 */
interface IntegrationsGuideTooltipProps {
  /** Current integrations sub-step */
  currentSubStep: SetupIntegrationsStep | null;
  /** Target sub-step this tooltip corresponds to */
  targetSubStep: SetupIntegrationsStep;
  /** Tooltip position */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Child elements (anchor element) */
  children: ReactNode;
  /** Custom class name */
  className?: string;
  /** Callback when tooltip visibility changes */
  onVisibilityChange?: (visible: boolean) => void;
  /** Skip button callback */
  onSkip?: () => void;
  /** Whether to show skip option */
  showSkip?: boolean;
}

function getIntegrationsTooltipPositionStyles(position: 'top' | 'bottom' | 'left' | 'right') {
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

export function IntegrationsGuideTooltip({
  currentSubStep,
  targetSubStep,
  position = 'bottom',
  children,
  className,
  onVisibilityChange,
  onSkip,
  showSkip = false
}: IntegrationsGuideTooltipProps) {
  const { t } = useTranslation("common", { keyPrefix: "onboarding.integrationsSubSteps" });
  const [isVisible, setIsVisible] = useState(false);
  
  // Show tooltip when current sub-step matches target sub-step
  useEffect(() => {
    const shouldShow = currentSubStep === targetSubStep;
    setIsVisible(shouldShow);
    onVisibilityChange?.(shouldShow);
  }, [currentSubStep, targetSubStep, onVisibilityChange]);
  
  const defaultMessage = INTEGRATIONS_SUB_STEP_MESSAGES[targetSubStep];
  const message = {
    title: t(`${targetSubStep}.title`, defaultMessage.title),
    description: t(`${targetSubStep}.description`, defaultMessage.description),
    icon: defaultMessage.icon
  };
  const positionStyles = getIntegrationsTooltipPositionStyles(position);
  
  if (!message) return <>{children}</>;
  
  return (
    <div className={cn('relative inline-block', className)}>
      {children}
      
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 w-80 p-4 rounded-lg shadow-lg',
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
                
                {/* Skip link */}
                {showSkip && onSkip && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSkip();
                    }}
                    className="mt-2 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 underline"
                  >
                    {t('skip', 'Skip this step →')}
                  </button>
                )}
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
 * Integrations Section Guide Message
 * Displays a guide message below a section with a skip link
 */
interface IntegrationsSectionGuideProps {
  currentSubStep: SetupIntegrationsStep | null;
  targetSubStep: SetupIntegrationsStep;
  onSkip?: () => void;
  onComplete?: () => void;
  className?: string;
}

export function IntegrationsSectionGuide({
  currentSubStep,
  targetSubStep,
  onSkip,
  onComplete,
  className
}: IntegrationsSectionGuideProps) {
  const { t } = useTranslation("common", { keyPrefix: "onboarding.integrationsSubSteps" });
  
  if (currentSubStep !== targetSubStep) return null;
  
  const defaultMessage = INTEGRATIONS_SUB_STEP_MESSAGES[targetSubStep];
  const message = {
    title: t(`${targetSubStep}.title`, defaultMessage.title),
    description: t(`${targetSubStep}.description`, defaultMessage.description),
    icon: defaultMessage.icon
  };
  
  return (
    <div className={cn(
      'mt-4 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg',
      className
    )}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{message.icon}</span>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-amber-900 dark:text-amber-100 text-sm mb-1">
            {message.title}
          </h4>
          <p className="text-amber-800 dark:text-amber-200 text-xs leading-relaxed mb-3 whitespace-pre-line">
            {message.description}
          </p>
          {onSkip && (
            <button
              onClick={onSkip}
              className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 underline"
            >
              {t('skip', 'Skip this step →')}
            </button>
          )}
          {onComplete && (
            <button
            onClick={onComplete}
            className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 underline"
          >
            {t('completeStep', 'Complete this step →')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Integrations Complete Card
 * Shows when integrations setup is complete (sub-step = 'end')
 */
interface IntegrationsCompleteCardProps {
  onSelectNext: (step: 'setup_mailing_list' | 'setup_targets') => void;
  className?: string;
}

export function IntegrationsCompleteCard({ onSelectNext, className }: IntegrationsCompleteCardProps) {
  const { t } = useTranslation("common", { keyPrefix: "onboarding" });
  const navigate = useNavigate();
  
  return (
    <div className={cn(
      'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30',
      'border-2 border-green-300 dark:border-green-600 rounded-xl p-6',
      'animate-in fade-in slide-in-from-top-4 duration-500',
      className
    )}>
      <div className="flex items-start gap-4 mb-4">
        <span className="text-3xl">🎉</span>
        <div>
          <h3 className="font-bold text-lg text-green-900 dark:text-green-100">
            {t('integrationsSubSteps.end.title', 'Integrations Setup Complete!')}
          </h3>
          <p className="text-sm text-green-800 dark:text-green-200 mt-1">
            {t('integrationsSubSteps.end.description', 'Choose what to do next.')}
          </p>
        </div>
      </div>
      <StepSelectionCard
        workspaceId=""
        onSelect={(step) => {
          onSelectNext(step);
          navigate(step === 'setup_mailing_list' ? '/settings/mail-list' : '/settings/targets');
        }}
      />
    </div>
  );
}

/* =========================================================
   Mailing List Sub-Step Components
   ========================================================= */

/**
 * Default messages for mailing list sub-steps
 */
const MAILING_LIST_SUB_STEP_MESSAGES: Record<SetupMailingListStep, { title: string; description: string; icon: string }> = {
  'start': {
    title: 'Starting Mailing List Setup',
    description: 'Add a new list to group email addresses.',
    icon: '📧'
  },
  'regist_basic': {
    title: 'Enter Basic Information',
    description: 'Enter the mailing list name and save.',
    icon: '✏️'
  },
  'regist_address': {
    title: 'Add Members',
    description: 'Add email addresses and names.',
    icon: '👥'
  },
  'end': {
    title: 'Mailing List Setup Complete!',
    description: 'You can add more members. When done, proceed to target setup.',
    icon: '✅'
  }
};

const MAILING_LIST_SUB_STEP_ORDER: SetupMailingListStep[] = [
  'start',
  'regist_basic',
  'regist_address',
  'end'
];

/**
 * Mailing List Sub-Progress Indicator
 * Shows progress within the setup_mailing_list step
 */
interface MailingListSubProgressProps {
  currentSubStep: SetupMailingListStep | null;
  className?: string;
}

export function MailingListSubProgress({ currentSubStep, className }: MailingListSubProgressProps) {
  const { t } = useTranslation("common", { keyPrefix: "onboarding.mailingListSubSteps" });
  
  const SUB_STEP_LABELS: Record<SetupMailingListStep, string> = {
    'start': t('start', 'Start'),
    'regist_basic': t('regist_basic', 'Basic'),
    'regist_address': t('regist_address', 'Members'),
    'end': t('end', 'Done')
  };
  
  const currentIndex = currentSubStep ? MAILING_LIST_SUB_STEP_ORDER.indexOf(currentSubStep) : -1;
  
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700" />
        <div 
          className="absolute top-3 left-0 h-0.5 bg-green-500 transition-all duration-500"
          style={{ width: `${Math.max(0, (currentIndex / (MAILING_LIST_SUB_STEP_ORDER.length - 1)) * 100)}%` }}
        />
        
        {/* Steps */}
        {MAILING_LIST_SUB_STEP_ORDER.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;
          
          return (
            <div key={step} className="relative flex flex-col items-center z-10">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium transition-all duration-300',
                  isCompleted && 'bg-green-500 text-white',
                  isCurrent && 'bg-green-500 text-white ring-2 ring-green-200 dark:ring-green-800',
                  isPending && 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                )}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              <span
                className={cn(
                  'mt-1 text-[10px] font-medium whitespace-nowrap',
                  isCurrent && 'text-green-600 dark:text-green-400',
                  !isCurrent && 'text-gray-500 dark:text-gray-400'
                )}
              >
                {SUB_STEP_LABELS[step]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Mailing List Guide Tooltip
 * Similar to IntegrationsGuideTooltip but for mailing list sub-steps
 */
interface MailingListGuideTooltipProps {
  /** Current mailing list sub-step */
  currentSubStep: SetupMailingListStep | null;
  /** Target sub-step this tooltip corresponds to */
  targetSubStep: SetupMailingListStep;
  /** Tooltip position */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Child elements (anchor element) */
  children: ReactNode;
  /** Custom class name */
  className?: string;
  /** Callback when tooltip visibility changes */
  onVisibilityChange?: (visible: boolean) => void;
}

function getMailingListTooltipPositionStyles(position: 'top' | 'bottom' | 'left' | 'right') {
  const baseArrowStyles = 'absolute w-3 h-3 bg-green-100 dark:bg-green-900/90 rotate-45';
  
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

export function MailingListGuideTooltip({
  currentSubStep,
  targetSubStep,
  position = 'bottom',
  children,
  className,
  onVisibilityChange
}: MailingListGuideTooltipProps) {
  const { t } = useTranslation("common", { keyPrefix: "onboarding.mailingListSubSteps" });
  const [isVisible, setIsVisible] = useState(false);
  
  // Show tooltip when current sub-step matches target sub-step
  useEffect(() => {
    const shouldShow = currentSubStep === targetSubStep;
    setIsVisible(shouldShow);
    onVisibilityChange?.(shouldShow);
  }, [currentSubStep, targetSubStep, onVisibilityChange]);
  
  const defaultMessage = MAILING_LIST_SUB_STEP_MESSAGES[targetSubStep];
  const message = {
    title: t(`${targetSubStep}.title`, defaultMessage.title),
    description: t(`${targetSubStep}.description`, defaultMessage.description),
    icon: defaultMessage.icon
  };
  const positionStyles = getMailingListTooltipPositionStyles(position);
  
  if (!message) return <>{children}</>;
  
  // Use block if w-full is in className, otherwise use inline-block
  const isFullWidth = className?.includes('w-full');
  
  return (
    <div className={cn('relative pointer-events-none', isFullWidth ? 'block' : 'inline-block', className)}>
      <div className="pointer-events-auto">
        {children}
      </div>
      
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 w-80 p-4 rounded-lg shadow-lg pointer-events-auto',
            'bg-green-100 dark:bg-green-900/90',
            'border-2 border-green-300 dark:border-green-700',
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
              <div className="flex-1 min-w-0 text-left">
                <h4 className="font-bold text-green-900 dark:text-green-100 text-sm mb-1 text-left">
                  {message.title}
                </h4>
                <p className="text-green-800 dark:text-green-200 text-xs leading-relaxed text-left">
                  {message.description}
                </p>
              </div>
            </div>
            
            {/* Pulse indicator */}
            <div className="absolute top-0 right-0 flex items-center justify-center w-3 h-3">
              <span className="absolute w-full h-full rounded-full bg-green-500 opacity-75 animate-ping" />
              <span className="absolute w-3 h-3 rounded-full bg-green-600" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   Targets Sub-Step Components
   ========================================================= */

/**
 * Default messages for targets sub-steps
 */
const TARGETS_SUB_STEP_MESSAGES: Record<SetupTargetsStep, { title: string; description: string; icon: string }> = {
  'start': {
    title: 'Starting Target Setup',
    description: 'Add a new target to configure data sources and delivery schedule.',
    icon: '🎯'
  },
  'regist_basic': {
    title: 'Enter Basic Information',
    description: 'Enter basic information. When done, click Complete. Next, enter the schedule.',
    icon: '✏️'
  },
  'regist_schedule': {
    title: 'Enter Schedule',
    description: 'Enter day and time. When done, click Complete. Next, enter data sources.',
    icon: '⏰'
  },
  'regist_sourses': {
    title: 'Add Data Sources',
    description: 'Select connected service and source, then click Add. Git repositories: 1 max, Slack channels: 3 max. When setup is complete, click Save.',
    icon: '📊'
  },
  'end': {
    title: 'Target Setup Complete!',
    description: 'Target setup is complete. You can add more targets or proceed to the next step.',
    icon: '✅'
  }
};

const TARGETS_SUB_STEP_ORDER: SetupTargetsStep[] = [
  'start',
  'regist_basic',
  'regist_schedule',
  'regist_sourses',
  'end'
];

/**
 * Targets Sub-Progress Indicator
 * Shows progress within the setup_targets step
 */
interface TargetsSubProgressProps {
  currentSubStep: SetupTargetsStep | null;
  className?: string;
}

export function TargetsSubProgress({ currentSubStep, className }: TargetsSubProgressProps) {
  const { t } = useTranslation("common", { keyPrefix: "onboarding.targetsSubSteps" });
  
  const SUB_STEP_LABELS: Record<SetupTargetsStep, string> = {
    'start': t('start', 'Start'),
    'regist_basic': t('regist_basic', 'Basic'),
    'regist_schedule': t('regist_schedule', 'Schedule'),
    'regist_sourses': t('regist_sourses', 'Sources'),
    'end': t('end', 'Done')
  };
  
  const currentIndex = currentSubStep ? TARGETS_SUB_STEP_ORDER.indexOf(currentSubStep) : -1;
  
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700" />
        <div 
          className="absolute top-3 left-0 h-0.5 bg-purple-500 transition-all duration-500"
          style={{ width: `${Math.max(0, (currentIndex / (TARGETS_SUB_STEP_ORDER.length - 1)) * 100)}%` }}
        />
        
        {/* Steps */}
        {TARGETS_SUB_STEP_ORDER.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;
          
          return (
            <div key={step} className="relative flex flex-col items-center z-10">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium transition-all duration-300',
                  isCompleted && 'bg-purple-500 text-white',
                  isCurrent && 'bg-purple-500 text-white ring-2 ring-purple-200 dark:ring-purple-800',
                  isPending && 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                )}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              <span
                className={cn(
                  'mt-1 text-[10px] font-medium whitespace-nowrap',
                  isCurrent && 'text-purple-600 dark:text-purple-400',
                  !isCurrent && 'text-gray-500 dark:text-gray-400'
                )}
              >
                {SUB_STEP_LABELS[step]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Targets Guide Tooltip
 * Similar to MailingListGuideTooltip but for targets sub-steps
 */
interface TargetsGuideTooltipProps {
  /** Current targets sub-step */
  currentSubStep: SetupTargetsStep | null;
  /** Target sub-step this tooltip corresponds to */
  targetSubStep: SetupTargetsStep;
  /** Tooltip position */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Child elements (anchor element) */
  children: ReactNode;
  /** Custom class name */
  className?: string;
  /** Callback when tooltip visibility changes */
  onVisibilityChange?: (visible: boolean) => void;
}

function getTargetsTooltipPositionStyles(position: 'top' | 'bottom' | 'left' | 'right') {
  const baseArrowStyles = 'absolute w-3 h-3 bg-purple-100 dark:bg-purple-900/90 rotate-45';
  
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

export function TargetsGuideTooltip({
  currentSubStep,
  targetSubStep,
  position = 'bottom',
  children,
  className,
  onVisibilityChange
}: TargetsGuideTooltipProps) {
  const { t } = useTranslation("common", { keyPrefix: "onboarding.targetsSubSteps" });
  const [isVisible, setIsVisible] = useState(false);
  
  // Show tooltip when current sub-step matches target sub-step
  useEffect(() => {
    const shouldShow = currentSubStep === targetSubStep;
    setIsVisible(shouldShow);
    onVisibilityChange?.(shouldShow);
  }, [currentSubStep, targetSubStep, onVisibilityChange]);
  
  const defaultMessage = TARGETS_SUB_STEP_MESSAGES[targetSubStep];
  const message = {
    title: t(`${targetSubStep}.title`, defaultMessage.title),
    description: t(`${targetSubStep}.description`, defaultMessage.description),
    icon: defaultMessage.icon
  };
  const positionStyles = getTargetsTooltipPositionStyles(position);
  
  if (!message) return <>{children}</>;
  
  // Use block if w-full is in className, otherwise use inline-block
  const isFullWidth = className?.includes('w-full');
  
  return (
    <div className={cn('relative pointer-events-none', isFullWidth ? 'block' : 'inline-block', className)}>
      <div className="pointer-events-auto">
        {children}
      </div>
      
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 w-80 p-4 rounded-lg shadow-lg pointer-events-auto',
            'bg-purple-100 dark:bg-purple-900/90',
            'border-2 border-purple-300 dark:border-purple-700',
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
              <div className="flex-1 min-w-0 text-left">
                <h4 className="font-bold text-purple-900 dark:text-purple-100 text-sm mb-1 text-left">
                  {message.title}
                </h4>
                <p className="text-purple-800 dark:text-purple-200 text-xs leading-relaxed text-left">
                  {message.description}
                </p>
              </div>
            </div>
            
            {/* Pulse indicator */}
            <div className="absolute top-0 right-0 flex items-center justify-center w-3 h-3">
              <span className="absolute w-full h-full rounded-full bg-purple-500 opacity-75 animate-ping" />
              <span className="absolute w-3 h-3 rounded-full bg-purple-600" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Targets Section Guide Message
 * Displays a guide message below a section with a "Complete" button
 */
interface TargetsSectionGuideProps {
  currentSubStep: SetupTargetsStep | null;
  targetSubStep: SetupTargetsStep;
  onComplete?: () => void;
  className?: string;
}

export function TargetsSectionGuide({
  currentSubStep,
  targetSubStep,
  onComplete,
  className
}: TargetsSectionGuideProps) {
  const { t } = useTranslation("common", { keyPrefix: "onboarding.targetsSubSteps" });
  
  if (currentSubStep !== targetSubStep) return null;
  
  const defaultMessage = TARGETS_SUB_STEP_MESSAGES[targetSubStep];
  const message = {
    title: t(`${targetSubStep}.title`, defaultMessage.title),
    description: t(`${targetSubStep}.description`, defaultMessage.description),
    icon: defaultMessage.icon
  };
  
  return (
    <div className={cn(
      'mt-4 p-4 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg',
      className
    )}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{message.icon}</span>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-purple-900 dark:text-purple-100 text-sm mb-1">
            {message.title}
          </h4>
          <p className="text-purple-800 dark:text-purple-200 text-xs leading-relaxed mb-3 whitespace-pre-line">
            {message.description}
          </p>
          {onComplete && (
            <NexButton
              variant="primary"
              size="sm"
              onClick={onComplete}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {t('complete', 'Complete')}
            </NexButton>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Onboarding Complete Card
 * Shows when onboarding is fully completed
 */
interface OnboardingCompleteCardProps {
  className?: string;
}

export function OnboardingCompleteCard({ className }: OnboardingCompleteCardProps) {
  const { t } = useTranslation("common", { keyPrefix: "onboarding" });
  
  const defaultMessage = DEFAULT_GUIDE_MESSAGES['completed'];
  const message = {
    title: t('steps.completed.title', defaultMessage.title),
    description: t('steps.completed.description', defaultMessage.description),
    icon: defaultMessage.icon
  };
  
  return (
    <div className={cn(
      'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30',
      'border-2 border-green-300 dark:border-green-600 rounded-xl p-6',
      'animate-in fade-in slide-in-from-top-4 duration-500',
      className
    )}>
      <div className="flex items-start gap-4">
        <span className="text-4xl flex-shrink-0">{message.icon}</span>
        <div className="flex-1">
          <h3 className="font-bold text-xl text-green-900 dark:text-green-100 mb-2">
            {message.title}
          </h3>
          <p className="text-base text-green-800 dark:text-green-200">
            {message.description}
          </p>
        </div>
      </div>
    </div>
  );
}
