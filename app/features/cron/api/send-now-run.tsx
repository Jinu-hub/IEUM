/**
 * Phase2: 즉시 실행 처리 API (Vercel 사용 시)
 *
 * send-now(Phase1) 로 생성된 run 에 대해 processTarget 을 동기 실행합니다.
 * 클라이언트는 Phase1 응답으로 runStepId 를 받은 뒤 스테이터스바로 run-status 를 폴링하고,
 * 이 API 를 호출해 처리 진행을 실시간으로 봅니다.
 *
 * Railway worker 전환 시:
 * - 클라이언트는 이 API 를 호출하지 않음 (targets.tsx 의 Phase2 fetch 블록 제거).
 * - Phase1(send-now) 에서 job_queue 에 enqueue 만 하고, Railway worker 가 job_queue 폴링 후
 *   동일한 processTarget 로직을 worker 쪽에서 실행. 이 파일(send-now/run) 은 사용하지 않거나 수동 재실행용으로만 유지.
 */

import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { logger } from "~/core/lib/logger";
import makeServerClient from "~/core/lib/supa-client.server";
import { processTarget } from "./target-processing";
import { getTargets } from "~/features/settings/db/queries";
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
    const { runId, runStepId, targetId, workspaceId } = body;

    if (!runId || !runStepId || !targetId || !workspaceId) {
      return data({
        status: 'error',
        message: 'runId, runStepId, targetId and workspaceId are required',
      }, { status: 400 });
    }

    const targets = await getTargets(client, { workspaceId });
    const target = targets.find(t => t.targetId === targetId);
    if (!target) {
      return data({ status: 'error', message: 'Target not found' }, { status: 404 });
    }

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

    await processTarget(targetForProcessing, { runId, runStepId });

    return data({ status: 'success', runId, runStepId }, { status: 200 });
  } catch (error: any) {
    logger.error('Send now run error', { error: error.message });
    return data(
      { status: 'error', error: error.message },
      { status: 500 }
    );
  }
}
