/**
 * 제한 확인 함수
 */

import { logger } from "~/core/lib/logger";
import adminClient from "~/core/lib/supa-admin-client.server";
import { incrementUsageCounterForEmail } from "~/features/contents/db/mutations";
import { getPlanLimits, getUserSubscriptionPlanType } from "~/features/settings/db/queries";
import { getWorkspaceOwnerUserId } from "~/features/users/queries";
import type { EmailLimitCheck } from "./types";

/**
 * 사용량 카운터 업데이트 및 이메일 제한 확인
 */
export async function checkEmailLimit(
  workspaceId: string,
  userId: string
): Promise<EmailLimitCheck> {
  const ownerUserId = await getWorkspaceOwnerUserId(adminClient, { workspaceId });
  const planType = await getUserSubscriptionPlanType(adminClient, { userId: ownerUserId as string }) || 'free';
  const planLimit = await getPlanLimits(adminClient, { planType });

  // usage_counters 등록/업데이트
  const usageCounter = await incrementUsageCounterForEmail(adminClient, { 
    workspaceId, 
    userId: ownerUserId as string 
  });

  if (!usageCounter) {
    logger.error('Failed to update usage counter');
    return {
      allowed: false,
      usageCounter: null,
      planLimit,
      planType,
      maxMembers: planLimit?.max_members_per_target ?? 0
    };
  }

  logger.info('Usage counter updated', { usageCounter });

  let allowed = true;
  if (planLimit && planLimit.max_weekly_emails_per_month !== null) {
    if (usageCounter.email_sent_count > planLimit.max_weekly_emails_per_month) {
      logger.info('Email limit exceeded', {
        email_sent_count: usageCounter.email_sent_count,
        max_weekly_emails_per_month: planLimit.max_weekly_emails_per_month,
        plan_type: planType
      });
      allowed = false;
    }
  }

  return {
    allowed,
    usageCounter,
    planLimit,
    planType,
    maxMembers: planLimit?.max_members_per_target ?? 0
  };
}

