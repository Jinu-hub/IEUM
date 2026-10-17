/**
 * 타겟 배치 처리 함수
 */

import { logger } from "~/core/lib/logger";
import { fetchAllActiveTargets, fetchScheduledTargets } from "./data-fetching";
import { processTarget } from "./target-processing";
import type { CronActionResponse } from "./types";

/**
 * 모든 활성 타겟 처리
 */
export async function processAllActiveTargets(): Promise<CronActionResponse> {
  try {
    // 모든 활성 타겟 조회
    const allTargets = await fetchAllActiveTargets();

    // 각 타겟 처리 (run 행은 processTarget이 검사를 통과한 타겟에만 만듦)
    for (const target of allTargets) {
      try {
        await processTarget(target);
      } catch (error: any) {
        // processTarget 내부에서 이미 에러 로깅 및 업데이트 처리
        // 여기서는 계속 진행
        logger.error('Failed to process target', { 
          targetId: target.target_id, 
          error: error.message 
        });
      }
    }

    return {
      status: 'success',
      data: {
        targets: allTargets,
        totalTargets: allTargets.length,
        scheduledTargets: 0
      }
    };
  } catch (error: any) {
    logger.error('Cron actions processing error', { error: error.message });
    return {
      status: 'error',
      error: error.message
    };
  }
}

/**
 * 스케줄된 타겟만 처리 (현재 시간부터 1시간 이내에 실행될 스케줄)
 */
export async function processScheduledTargets(): Promise<CronActionResponse> {
  try {
    // 스케줄된 타겟만 조회
    const scheduledTargets = await fetchScheduledTargets();

    if (scheduledTargets.length === 0) {
      logger.info('No scheduled targets found');
      return {
        status: 'success',
        data: {
          targets: [],
          totalTargets: 0,
          scheduledTargets: 0
        }
      };
    }

    // 각 타겟 처리 (run 행은 processTarget이 검사를 통과한 타겟에만 만듦)
    for (const target of scheduledTargets) {
      try {
        await processTarget(target);
      } catch (error: any) {
        // processTarget 내부에서 이미 에러 로깅 및 업데이트 처리
        // 여기서는 계속 진행
        logger.error('Failed to process target', { 
          targetId: target.target_id, 
          error: error.message 
        });
      }
    }

    return {
      status: 'success',
      data: {
        targets: scheduledTargets,
        totalTargets: scheduledTargets.length,
        scheduledTargets: scheduledTargets.length
      }
    };
  } catch (error: any) {
    logger.error('Cron actions processing error', { error: error.message });
    return {
      status: 'error',
      error: error.message
    };
  }
}
