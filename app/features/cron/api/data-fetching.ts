/**
 * 데이터 조회 함수
 */

import { isScheduledWithinHour } from "~/core/lib/cron-utils";
import { logger } from "~/core/lib/logger";
import adminClient from "~/core/lib/supa-admin-client.server";
import { recordRuns } from "./run-record";
import type { Target } from "./types";

/**
 * 모든 활성 타겟 조회
 */
export async function fetchAllActiveTargets(): Promise<Target[]> {
  const { data: allTargets, error } = await adminClient
    .from('targets')
    .select('*')
    .eq('is_active', true)
    .order('workspace_id', { ascending: true });

  if (error) {
    logger.error('Failed to fetch targets', { error });
    throw new Error('Failed to fetch targets');
  }

  logger.info('Fetched all active targets', { 
    totalTargets: allTargets?.length || 0
  });
  if (!recordRuns()) logger.info("CRON_RECORD=0, newsletter run rows are not saved");

  return allTargets || [];
}

/**
 * 스케줄된 타겟만 조회 (현재 시간부터 1시간 이내에 실행될 스케줄)
 */
export async function fetchScheduledTargets(): Promise<Target[]> {
  const allTargets = await fetchAllActiveTargets();

  // 현재 시간부터 1시간 이내에 실행될 스케줄인 타겟만 필터링
  const scheduledTargets = allTargets.filter(target => {
    if (!target.schedule_cron) return false;
    return isScheduledWithinHour(target.schedule_cron, target.timezone || 'UTC');
  });

  logger.info('Filtered targets for next hour', { 
    totalTargets: allTargets.length,
    scheduledTargets: scheduledTargets.length,
    targets: scheduledTargets.map(t => ({ target_id: t.target_id, schedule_cron: t.schedule_cron }))
  });

  return scheduledTargets;
}
