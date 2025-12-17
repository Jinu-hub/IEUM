/**
 * useOnboarding Hook
 * 
 * Custom hook for managing onboarding state and actions.
 * Provides utilities for checking onboarding status, updating steps, and handling skip actions.
 */

import type { Database } from 'database.types';
import { useCallback, useMemo, useState } from 'react';
import { useFetcher } from 'react-router';

type OnboardingStep = Database["public"]["Enums"]["onboarding_step"];
type OnboardingType = Database["public"]["Enums"]["onboarding_type"];

interface OnboardingState {
  workspace_id: string;
  onboarding_mode: OnboardingType;
  onboarding_step: OnboardingStep;
  github_connected: boolean;
  slack_connected: boolean;
  target_configured: boolean;
  is_completed: boolean;
  completed_at: string | null;
}

interface UseOnboardingOptions {
  workspaceId: string;
  onboardingState: OnboardingState | null;
}

interface UseOnboardingReturn {
  /** Whether onboarding is active (mode is 'default' and not completed) */
  isOnboardingActive: boolean;
  /** Current onboarding step */
  currentStep: OnboardingStep | null;
  /** Whether onboarding is completed */
  isCompleted: boolean;
  /** Whether GitHub is connected */
  isGithubConnected: boolean;
  /** Whether Slack is connected */
  isSlackConnected: boolean;
  /** Whether target is configured */
  isTargetConfigured: boolean;
  /** Update the onboarding step */
  updateStep: (nextStep: OnboardingStep) => void;
  /** Skip to a specific step */
  skipToStep: (nextStep: OnboardingStep) => void;
  /** Mark GitHub as connected */
  setGithubConnected: (connected: boolean) => void;
  /** Mark Slack as connected */
  setSlackConnected: (connected: boolean) => void;
  /** Whether an update is in progress */
  isUpdating: boolean;
  /** Check if current step matches target */
  isCurrentStep: (step: OnboardingStep) => boolean;
  /** Get the next step for the current step */
  getNextStep: () => OnboardingStep | null;
}

/**
 * Valid step transitions map
 * New flow:
 * 1. welcome → setup_integrations
 * 2. setup_integrations → setup_mailing_list | setup_targets
 * 3. setup_mailing_list → setup_targets
 * 4. setup_targets → first_mail_sending
 * 5. first_mail_sending → completed
 */
const STEP_TRANSITIONS: Record<OnboardingStep, OnboardingStep[]> = {
  'welcome': ['setup_integrations'],
  'setup_integrations': ['setup_mailing_list', 'setup_targets'],
  'setup_mailing_list': ['setup_targets'],
  'setup_targets': ['first_mail_sending'],
  'first_mail_sending': ['completed'],
  'completed': []
};

/**
 * Default next step (when multiple options exist, use first one)
 */
const DEFAULT_NEXT_STEP: Record<OnboardingStep, OnboardingStep | null> = {
  'welcome': 'setup_integrations',
  'setup_integrations': 'setup_mailing_list', // User can choose targets
  'setup_mailing_list': 'setup_targets',
  'setup_targets': 'first_mail_sending',
  'first_mail_sending': 'completed',
  'completed': null
};

export function useOnboarding({ workspaceId, onboardingState }: UseOnboardingOptions): UseOnboardingReturn {
  const fetcher = useFetcher();
  const [localStep, setLocalStep] = useState<OnboardingStep | null>(null);

  // Determine if onboarding is active
  const isOnboardingActive = useMemo(() => {
    if (!onboardingState) return false;
    return (
      onboardingState.onboarding_mode === 'default' &&
      onboardingState.onboarding_step !== 'completed' &&
      !onboardingState.is_completed
    );
  }, [onboardingState]);

  // Current step (use local state if available, otherwise from server)
  const currentStep = useMemo(() => {
    if (localStep) return localStep;
    return onboardingState?.onboarding_step ?? null;
  }, [localStep, onboardingState]);

  // Update step via API
  const updateStep = useCallback((nextStep: OnboardingStep) => {
    setLocalStep(nextStep); // Optimistic update
    
    fetcher.submit(
      JSON.stringify({
        workspaceId,
        onboardingStep: nextStep
      }),
      {
        method: 'POST',
        action: '/api/settings/update-onboarding-step',
        encType: 'application/json'
      }
    );
  }, [workspaceId, fetcher]);

  // Skip to a specific step (bypassing validation for skip scenarios)
  const skipToStep = useCallback((nextStep: OnboardingStep) => {
    updateStep(nextStep);
  }, [updateStep]);

  // Update GitHub connected state
  const setGithubConnected = useCallback((connected: boolean) => {
    fetcher.submit(
      JSON.stringify({
        workspaceId,
        githubConnected: connected
      }),
      {
        method: 'POST',
        action: '/api/settings/update-onboarding-step',
        encType: 'application/json'
      }
    );
  }, [workspaceId, fetcher]);

  // Update Slack connected state
  const setSlackConnected = useCallback((connected: boolean) => {
    fetcher.submit(
      JSON.stringify({
        workspaceId,
        slackConnected: connected
      }),
      {
        method: 'POST',
        action: '/api/settings/update-onboarding-step',
        encType: 'application/json'
      }
    );
  }, [workspaceId, fetcher]);

  // Check if current step matches target
  const isCurrentStep = useCallback((step: OnboardingStep) => {
    return currentStep === step;
  }, [currentStep]);

  // Get next step for current step
  const getNextStep = useCallback(() => {
    if (!currentStep) return null;
    return DEFAULT_NEXT_STEP[currentStep];
  }, [currentStep]);

  return {
    isOnboardingActive,
    currentStep,
    isCompleted: onboardingState?.is_completed ?? false,
    isGithubConnected: onboardingState?.github_connected ?? false,
    isSlackConnected: onboardingState?.slack_connected ?? false,
    isTargetConfigured: onboardingState?.target_configured ?? false,
    updateStep,
    skipToStep,
    setGithubConnected,
    setSlackConnected,
    isUpdating: fetcher.state !== 'idle',
    isCurrentStep,
    getNextStep
  };
}

/**
 * Helper to check if onboarding state indicates active onboarding
 */
export function isOnboardingModeActive(onboardingState: OnboardingState | null): boolean {
  if (!onboardingState) return false;
  return (
    onboardingState.onboarding_mode === 'default' &&
    onboardingState.onboarding_step !== 'completed' &&
    !onboardingState.is_completed
  );
}

/**
 * Helper to get valid next steps for a given step
 */
export function getValidNextSteps(currentStep: OnboardingStep): OnboardingStep[] {
  return STEP_TRANSITIONS[currentStep] || [];
}

