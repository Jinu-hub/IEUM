/**
 * Update Onboarding Step API
 * 
 * オンボーディングモードのステップを更新するAPIエンドポイント。
 * onboarding_statesのonboarding_stepを更新します。
 */

import type { Database } from "database.types";
import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { ONBOARDING_STEP, SETUP_INTEGRATIONS, SETUP_MAILING_LIST, SETUP_TARGETS } from "~/core/lib/constants";
import { logger } from "~/core/lib/logger";
import makeServerClient from "~/core/lib/supa-client.server";
import { updateGithubConnectedState, updateOnboardingStep, updateSetupIntegrationsStep, updateSetupMailingListStep, updateSetupTargetsStep, updateSlackConnectedState } from "../db/mutations";
import { getWorkspace, getWorkspaceOnboardingState } from "../db/queries";

type OnboardingStep = Database["public"]["Enums"]["onboarding_step"];
type SetupIntegrationsStep = Database["public"]["Enums"]["setup_integrations"];
type SetupMailingListStep = Database["public"]["Enums"]["setup_mailing_list"];
type SetupTargetsStep = Database["public"]["Enums"]["setup_targets"];

/**
 * オンボーディングステップの有効な遷移を定義
 */
const VALID_TRANSITIONS: Record<OnboardingStep, OnboardingStep[]> = {
  'welcome': ['setup_integrations'],
  //'setup_workspace': ['connect_github'], // setup_workspaceからもconnect_githubへ遷移可能
  'setup_integrations': ['setup_mailing_list', 'setup_targets'],
  'setup_mailing_list': ['setup_targets'],
  'setup_targets': ['first_mail_sending'],
  //'setup_rules': ['first_mail_sending'], // setup_rulesからもfirst_mail_sendingへ遷移可能
  'first_mail_sending': ['completed'],
  'completed': []
};

/**
 * ステップ遷移のバリデーション
 */
function isValidTransition(currentStep: OnboardingStep | null, nextStep: OnboardingStep): boolean {
  // 初回はwelcomeから開始
  if (!currentStep) {
    return nextStep === 'welcome';
  }
  
  const validNextSteps = VALID_TRANSITIONS[currentStep] || [];
  return validNextSteps.includes(nextStep);
}

/**
 * Action: オンボーディングステップを更新
 */
export async function action({ request }: ActionFunctionArgs) {
  logger.info('🚀 Update onboarding step API called');

  if (request.method !== "POST") {
    return data({ 
      status: 'error', 
      error: 'Only POST requests are allowed' 
    }, { status: 405 });
  }

  try {
    const [client] = makeServerClient(request);
    const { data: { user } } = await client.auth.getUser();
    
    if (!user) {
      return data({ status: 'error', error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId, onboardingStep, setupIntegrationsStep, setupMailingListStep, setupTargetsStep, githubConnected, slackConnected } = body;

    if (!workspaceId) {
      return data({ 
        status: 'error', 
        error: 'workspaceId is required' 
      }, { status: 400 });
    }

    // ワークスペース検証
    const workspaceData = await getWorkspace(client, { userId: user.id });
    const workspace = workspaceData.find(w => w.workspace_id === workspaceId);
    
    if (!workspace) {
      return data({ status: 'error', error: 'Invalid workspace' }, { status: 403 });
    }

    // 現在のonboarding stateを取得
    let currentState;
    try {
      currentState = await getWorkspaceOnboardingState(client, { workspaceId });
    } catch (error) {
      return data({ 
        status: 'error', 
        error: 'Onboarding state not found' 
      }, { status: 404 });
    }

    // オンボーディングモードの検証（defaultモードのみ）
    if (currentState.onboarding_mode !== 'default') {
      return data({ 
        status: 'error', 
        error: 'This workspace is not in onboarding mode' 
      }, { status: 400 });
    }

    // GitHub連携状態の更新
    if (typeof githubConnected === 'boolean') {
      await updateGithubConnectedState(client, { 
        workspaceId, 
        githubConnected 
      });
      logger.info(`GitHub connected state updated to: ${githubConnected}`);
    }

    // Slack連携状態の更新
    if (typeof slackConnected === 'boolean') {
      await updateSlackConnectedState(client, { 
        workspaceId, 
        slackConnected 
      });
      logger.info(`Slack connected state updated to: ${slackConnected}`);
    }

    // setup_integrationsサブステップの更新
    if (setupIntegrationsStep) {
      // サブステップ値の検証
      if (!SETUP_INTEGRATIONS.includes(setupIntegrationsStep)) {
        return data({ 
          status: 'error', 
          error: `Invalid setup_integrations step: ${setupIntegrationsStep}` 
        }, { status: 400 });
      }

      await updateSetupIntegrationsStep(client, { 
        workspaceId, 
        setupIntegrationsStep: setupIntegrationsStep as SetupIntegrationsStep
      });

      logger.info(`✅ Setup integrations sub-step updated to: ${setupIntegrationsStep}`);

      // サブステップのみ更新した場合は早期リターン
      if (!onboardingStep) {
        return data({ 
          status: 'success', 
          data: {
            setupIntegrationsStep
          }
        });
      }
    }

    // setup_mailing_listサブステップの更新
    if (setupMailingListStep) {
      // サブステップ値の検証
      if (!SETUP_MAILING_LIST.includes(setupMailingListStep)) {
        return data({ 
          status: 'error', 
          error: `Invalid setup_mailing_list step: ${setupMailingListStep}` 
        }, { status: 400 });
      }

      await updateSetupMailingListStep(client, { 
        workspaceId, 
        setupMailingListStep: setupMailingListStep as SetupMailingListStep
      });

      logger.info(`✅ Setup mailing list sub-step updated to: ${setupMailingListStep}`);

      // サブステップのみ更新した場合は早期リターン
      if (!onboardingStep) {
        return data({ 
          status: 'success', 
          data: {
            setupMailingListStep
          }
        });
      }
    }

    // setup_targetsサブステップの更新
    if (setupTargetsStep) {
      // サブステップ値の検証
      if (!SETUP_TARGETS.includes(setupTargetsStep)) {
        return data({ 
          status: 'error', 
          error: `Invalid setup_targets step: ${setupTargetsStep}` 
        }, { status: 400 });
      }

      await updateSetupTargetsStep(client, { 
        workspaceId, 
        setupTargetsStep: setupTargetsStep as SetupTargetsStep
      });

      logger.info(`✅ Setup targets sub-step updated to: ${setupTargetsStep}`);

      // サブステップのみ更新した場合は早期リターン
      if (!onboardingStep) {
        return data({ 
          status: 'success', 
          data: {
            setupTargetsStep
          }
        });
      }
    }

    // オンボーディングステップの更新
    if (onboardingStep) {
      // ステップ値の検証
      if (!ONBOARDING_STEP.includes(onboardingStep)) {
        return data({ 
          status: 'error', 
          error: `Invalid onboarding step: ${onboardingStep}` 
        }, { status: 400 });
      }

      // 遷移の検証
      const currentOnboardingStep = currentState?.onboarding_step as OnboardingStep | null;
      if (!isValidTransition(currentOnboardingStep, onboardingStep)) {
        return data({ 
          status: 'error', 
          error: `Invalid transition from ${currentOnboardingStep} to ${onboardingStep}` 
        }, { status: 400 });
      }

      const result = await updateOnboardingStep(client, { 
        workspaceId, 
        onboardingStep: onboardingStep as OnboardingStep
      });

      logger.info(`✅ Onboarding step updated: ${currentOnboardingStep} -> ${onboardingStep}`);

      return data({ 
        status: 'success', 
        data: {
          previousStep: currentOnboardingStep,
          currentStep: onboardingStep,
          onboardingState: result
        }
      });
    }

    // githubConnected または slackConnected のみ更新した場合
    return data({ 
      status: 'success', 
      data: {
        githubConnected,
        slackConnected
      }
    });

  } catch (error: any) {
    logger.error('Update onboarding step error', { error: error.message });
    return data({ 
      status: 'error', 
      error: error.message 
    }, { status: 500 });
  }
}

