/**
 * Actions API Endpoint
 *
 * 연계액션을 관리하는 API 엔드포인트입니다.
 * 연계액션 상태 확인, 연계액션을 실행하는 기능을 제공합니다.
 */

import { type ActionFunctionArgs, data, type LoaderFunctionArgs } from "react-router";
import { processAllActiveTargets, processScheduledTargets } from "./target-batch-processing";

/**
 * Loader: GET 요청으로 cron 타겟 정보 반환 (테스트용)
 * 모든 활성 타겟을 처리합니다.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  console.log('🚀 Cron actions API (GET) 호출됨');

  const result = await processAllActiveTargets();

  if (result.status === 'error') {
    return data(result, { status: 500 });
  }

  return data(result);
}

/**
 * Action: POST 요청으로 cron 타겟 처리 실행
 * 스케줄된 타겟만 처리합니다 (현재 시간부터 1시간 이내에 실행될 스케줄).
 */
export async function action({ request, params }: ActionFunctionArgs) {
  console.log('🚀 Cron actions API (POST) 호출됨');

  const result = await processScheduledTargets();

  if (result.status === 'error') {
    return data(result, { status: 500 });
  }

  return data(result);
}
