/**
 * 즉시 실행 API 엔드포인트
 * 
 * 타겟을 즉시 실행하여 뉴스레터를 생성하고 전송합니다.
 */

import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { logger } from "~/core/lib/logger";
import adminClient from "~/core/lib/supa-admin-client.server";
import makeServerClient from "~/core/lib/supa-client.server";
import { createNewsletterRun } from "~/features/contents/db/mutations";
import { getTargets } from "~/features/settings/db/queries";
import { processTarget } from "./target-processing";
import type { Target } from "./types";

export async function action({ request }: ActionFunctionArgs) {
  const [client] = makeServerClient(request);
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return data({ status: 'error', message: 'Unauthorized' }, { status: 401 });
  }

  if (request.method !== "POST") {
    return data({ status: 'error', message: 'Only POST requests are allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { targetId, workspaceId } = body;

    if (!targetId || !workspaceId) {
      return data({ status: 'error', message: 'targetId and workspaceId are required' }, { status: 400 });
    }

    // 타겟 정보 조회
    const targets = await getTargets(client, { workspaceId });
    const target = targets.find(t => t.targetId === targetId);
    
    if (!target) {
      return data({ status: 'error', message: 'Target not found' }, { status: 404 });
    }

    // 중복 실행 방지: 최근 5분 내에 같은 타겟으로 manual trigger가 실행 중이거나 완료되었는지 확인
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    
    const { data: recentRuns, error: checkError } = await adminClient
      .from('newsletter_runs')
      .select('run_id, status, started_at')
      .eq('workspace_id', workspaceId)
      .eq('trigger', 'manual')
      .gte('started_at', fiveMinutesAgo.toISOString())
      .in('status', ['queued', 'running'])
      .order('started_at', { ascending: false })
      .limit(1);

    if (checkError) {
      logger.warn('Failed to check recent runs', { error: checkError.message });
    }

    // 최근 실행 중인 run이 있으면 중복 방지
    if (recentRuns && recentRuns.length > 0) {
      const recentRun = recentRuns[0];
      // 같은 타겟에 대한 run인지 확인하기 위해 newsletter_editions 확인
      const { data: recentEditions } = await adminClient
        .from('newsletter_editions')
        .select('target_id')
        .eq('run_id', recentRun.run_id)
        .eq('target_id', targetId)
        .limit(1);

      if (recentEditions && recentEditions.length > 0) {
        return data({ 
          status: 'error', 
          message: '이미 실행 중입니다. 잠시 후 다시 시도해주세요.' 
        }, { status: 409 });
      }
    }

    // Newsletter run 생성 (adminClient 사용 - RLS 정책 우회)
    const { runId, runStepId } = await createNewsletterRun(adminClient, {
      workspaceId,
      trigger: 'manual',
      logRef: null,
    });

    // 타겟을 processTarget에 맞는 형식으로 변환
    const targetForProcessing: Target = {
      target_id: target.targetId,
      workspace_id: workspaceId,
      display_name: target.displayName,
      mailing_list_id: target.mailingListId || null,
      timezone: target.timezone || 'Asia/Tokyo',
      schedule_cron: target.scheduleCron || null,
      is_active: target.isActive,
      language: target.language || 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 비동기로 처리 시작 (응답은 즉시 반환)
    processTarget(targetForProcessing, { runId, runStepId })
      .catch(error => {
        logger.error('Send now processing error', { error: error.message, targetId, runId });
      });

    return data({ 
      status: 'success', 
      runId, 
      runStepId,
    }, { status: 200 });

  } catch (error: any) {
    logger.error('Send now error', { error: error.message });
    return data({ 
      status: 'error', 
      error: error.message 
    }, { status: 500 });
  }
}

