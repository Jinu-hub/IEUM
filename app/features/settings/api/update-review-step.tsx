/**
 * Update Review Step API
 * 
 * レビューモードのステップを更新するAPIエンドポイント。
 * onboarding_statesのreview_stepを更新します。
 */

import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import type { Database } from "database.types";
import { logger } from "~/core/lib/logger";
import makeServerClient from "~/core/lib/supa-client.server";
import { REVIEW_STEP } from "~/core/lib/constants";
import { updateReviewStep, updateSlackConnectedState } from "../db/mutations";
import { getWorkspace, getWorkspaceOnboardingState } from "../db/queries";

type ReviewStep = Database["public"]["Enums"]["review_step"];

/**
 * レビューステップの有効な遷移を定義
 */
const VALID_TRANSITIONS: Record<ReviewStep, ReviewStep[]> = {
  'review_start': ['review_connect'],
  'review_connect': ['review_setup_channel'],
  'review_setup_channel': ['review_collecting_data'],
  'review_collecting_data': ['review_completed'],
  'review_completed': []
};

/**
 * ステップ遷移のバリデーション
 */
function isValidTransition(currentStep: ReviewStep | null, nextStep: ReviewStep): boolean {
  // 初回はどのステップからでも開始可能
  if (!currentStep) {
    return nextStep === 'review_start';
  }
  
  const validNextSteps = VALID_TRANSITIONS[currentStep] || [];
  return validNextSteps.includes(nextStep);
}

/**
 * Action: レビューステップを更新
 */
export async function action({ request }: ActionFunctionArgs) {
  logger.info('🚀 Update review step API called');

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
    const { workspaceId, reviewStep, slackConnected } = body;

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

    // レビューモードの検証
    if (workspace.kind !== 'app_review') {
      return data({ 
        status: 'error', 
        error: 'This workspace is not in review mode' 
      }, { status: 400 });
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

    // Slack連携状態の更新
    if (typeof slackConnected === 'boolean') {
      await updateSlackConnectedState(client, { 
        workspaceId, 
        slackConnected 
      });
      logger.info(`Slack connected state updated to: ${slackConnected}`);
    }

    // レビューステップの更新
    if (reviewStep) {
      // ステップ値の検証
      if (!REVIEW_STEP.includes(reviewStep)) {
        return data({ 
          status: 'error', 
          error: `Invalid review step: ${reviewStep}` 
        }, { status: 400 });
      }

      // 遷移の検証
      const currentReviewStep = currentState?.review_step as ReviewStep | null;
      if (!isValidTransition(currentReviewStep, reviewStep)) {
        return data({ 
          status: 'error', 
          error: `Invalid transition from ${currentReviewStep} to ${reviewStep}` 
        }, { status: 400 });
      }

      const result = await updateReviewStep(client, { 
        workspaceId, 
        reviewStep: reviewStep as ReviewStep
      });

      logger.info(`✅ Review step updated: ${currentReviewStep} -> ${reviewStep}`);

      return data({ 
        status: 'success', 
        data: {
          previousStep: currentReviewStep,
          currentStep: reviewStep,
          onboardingState: result
        }
      });
    }

    // slackConnectedのみ更新した場合
    return data({ 
      status: 'success', 
      data: {
        slackConnected
      }
    });

  } catch (error: any) {
    logger.error('Update review step error', { error: error.message });
    return data({ 
      status: 'error', 
      error: error.message 
    }, { status: 500 });
  }
}

