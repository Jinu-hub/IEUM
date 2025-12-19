/**
 * useOnboarding Hook
 * 
 * Custom hook for managing onboarding state and actions.
 * Provides utilities for checking onboarding status, updating steps, and handling skip actions.
 */

import type { Database } from 'database.types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFetcher } from 'react-router';

type OnboardingStep = Database["public"]["Enums"]["onboarding_step"];
type OnboardingType = Database["public"]["Enums"]["onboarding_type"];
type SetupIntegrationsStep = Database["public"]["Enums"]["setup_integrations"];

interface OnboardingState {
  workspace_id: string;
  onboarding_mode: OnboardingType;
  onboarding_step: OnboardingStep;
  setup_integrations: SetupIntegrationsStep;
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
  /** Current integrations sub-step */
  currentIntegrationsSubStep: SetupIntegrationsStep | null;
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
  /** Update the integrations sub-step */
  updateIntegrationsSubStep: (nextSubStep: SetupIntegrationsStep) => void;
  /** Mark GitHub as connected */
  setGithubConnected: (connected: boolean) => void;
  /** Mark Slack as connected */
  setSlackConnected: (connected: boolean) => void;
  /** Whether an update is in progress */
  isUpdating: boolean;
  /** Check if current step matches target */
  isCurrentStep: (step: OnboardingStep) => boolean;
  /** Check if current integrations sub-step matches target */
  isCurrentIntegrationsSubStep: (subStep: SetupIntegrationsStep) => boolean;
  /** Get the next step for the current step */
  getNextStep: () => OnboardingStep | null;
  /** Get the next integrations sub-step */
  getNextIntegrationsSubStep: () => SetupIntegrationsStep | null;
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

/**
 * Integrations sub-step transitions
 * Flow: 'start' → 'connect_github' → 'connect_slack' → 'setup_slack_channel' → 'end'
 */
const INTEGRATIONS_SUB_STEP_TRANSITIONS: Record<SetupIntegrationsStep, SetupIntegrationsStep | null> = {
  'start': 'connect_github',
  'connect_github': 'connect_slack',
  'connect_slack': 'setup_slack_channel',
  'setup_slack_channel': 'end',
  'end': null
};

export function useOnboarding({ workspaceId, onboardingState }: UseOnboardingOptions): UseOnboardingReturn {
  const fetcher = useFetcher();
  const [localStep, setLocalStep] = useState<OnboardingStep | null>(null);
  const [localIntegrationsSubStep, setLocalIntegrationsSubStep] = useState<SetupIntegrationsStep | null>(null);

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

  // Current integrations sub-step
  const currentIntegrationsSubStep = useMemo(() => {
    if (localIntegrationsSubStep) return localIntegrationsSubStep;
    return onboardingState?.setup_integrations ?? null;
  }, [localIntegrationsSubStep, onboardingState]);

  // Auto-advance from 'start' to 'connect_github' after 3 seconds
  useEffect(() => {
    if (isOnboardingActive && currentStep === 'setup_integrations' && currentIntegrationsSubStep === 'start') {
      const timer = setTimeout(() => {
        updateIntegrationsSubStep('connect_github');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnboardingActive, currentStep, currentIntegrationsSubStep]);

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

  // Update integrations sub-step via API
  const updateIntegrationsSubStep = useCallback((nextSubStep: SetupIntegrationsStep) => {
    setLocalIntegrationsSubStep(nextSubStep); // Optimistic update
    
    fetcher.submit(
      JSON.stringify({
        workspaceId,
        setupIntegrationsStep: nextSubStep
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

  // Check if current integrations sub-step matches target
  const isCurrentIntegrationsSubStep = useCallback((subStep: SetupIntegrationsStep) => {
    return currentIntegrationsSubStep === subStep;
  }, [currentIntegrationsSubStep]);

  // Get next step for current step
  const getNextStep = useCallback(() => {
    if (!currentStep) return null;
    return DEFAULT_NEXT_STEP[currentStep];
  }, [currentStep]);

  // Get next integrations sub-step
  const getNextIntegrationsSubStep = useCallback(() => {
    if (!currentIntegrationsSubStep) return null;
    return INTEGRATIONS_SUB_STEP_TRANSITIONS[currentIntegrationsSubStep];
  }, [currentIntegrationsSubStep]);

  return {
    isOnboardingActive,
    currentStep,
    currentIntegrationsSubStep,
    isCompleted: onboardingState?.is_completed ?? false,
    isGithubConnected: onboardingState?.github_connected ?? false,
    isSlackConnected: onboardingState?.slack_connected ?? false,
    isTargetConfigured: onboardingState?.target_configured ?? false,
    updateStep,
    skipToStep,
    updateIntegrationsSubStep,
    setGithubConnected,
    setSlackConnected,
    isUpdating: fetcher.state !== 'idle',
    isCurrentStep,
    isCurrentIntegrationsSubStep,
    getNextStep,
    getNextIntegrationsSubStep
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

