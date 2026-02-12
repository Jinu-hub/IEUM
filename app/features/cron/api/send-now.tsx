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
import { updateFirstMailSend } from "~/features/settings/db/mutations";
import { getTargets } from "~/features/settings/db/queries";

/**
 * Phase1: run 생성만 하고 runId/runStepId 반환.
 * 실제 처리(processTarget)는 클라이언트가 POST /api/cron/send-now/run 으로 Phase2 호출.
 *
 * Railway worker 전환 시:
 * - 이 API 에서 run 생성 후 job_queue 에 job enqueue (runId, runStepId, targetId, workspaceId 등).
 * - 클라이언트는 그대로 runStepId 받아 스테이터스바·run-status 폴링 유지.
 * - Phase2 API 호출은 클라이언트에서 제거. Railway worker 가 job_queue 폴링 후 processTarget 실행.
 */

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

    // 온보딩: first_mail_send 를 yes 로 갱신 (first_mail_run_id 도 설정)
    await updateFirstMailSend(adminClient, { workspaceId, runId, firstMailSend: 'yes' }).catch((err) => {
      logger.warn('updateFirstMailSend failed (non-blocking)', { error: err?.message, workspaceId });
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

