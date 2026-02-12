/**
 * 상태 조회 API 엔드포인트
 * 
 * Newsletter run step의 현재 상태를 조회합니다.
 */

import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import makeServerClient from "~/core/lib/supa-client.server";
import adminClient from "~/core/lib/supa-admin-client.server";
import { getNewsletterRunStep } from "~/features/contents/db/queries";

export async function loader({ request }: LoaderFunctionArgs) {
  const [client] = makeServerClient(request);
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return data({ status: 'error', message: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const runStepId = url.searchParams.get('runStepId');

  if (!runStepId) {
    return data({ status: 'error', message: 'runStepId is required' }, { status: 400 });
  }

  try {
    // adminClient 사용 - RLS 정책 우회 및 rate limit 방지
    const stepStatus = await getNewsletterRunStep(adminClient, { runStepId });
    return data(
      { status: 'success', data: stepStatus },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          Pragma: 'no-cache',
        },
      }
    );
  } catch (error: any) {
    return data({ status: 'error', error: error.message }, { status: 500 });
  }
}

