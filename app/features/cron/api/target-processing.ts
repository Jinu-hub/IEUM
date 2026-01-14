/**
 * 타겟 처리 함수
 */

import { logger } from "~/core/lib/logger";
import adminClient from "~/core/lib/supa-admin-client.server";
import type { CreateContentsInput } from "~/core/lib/types";
import { updateNewsletterRun, updateNewsletterRunError } from "~/features/contents/db/mutations";
import { getIntegrationsInfo, getTargetSources } from "~/features/settings/db/queries";
import { createContents } from "./create-contents";
import { fetchIntegrationData } from "./integration-fetching";
import { checkEmailLimit } from "./limit-checking";
import { sendMails } from "./send-mails";
import { matchSourcesToIntegrations } from "./source-matching";
import type { FetchedData, Target } from "./types";

/**
 * 날짜 범위 생성
 */
export function createDateRange(): { startDate: Date; endDate: Date; range: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7);
  const range = `${startDate.getFullYear()}-${startDate.getMonth() + 1}-${startDate.getDate()} ~ ${endDate.getFullYear()}-${endDate.getMonth() + 1}-${endDate.getDate()}`;
  
  return { startDate, endDate, range };
}

/**
 * CreateContentsInput 생성
 */
export function createContentsInput(
  target: Target,
  runMapping: { runId: string; runStepId: string },
  fetchedData: FetchedData,
  dateRange: { startDate: Date; endDate: Date; range: string }
): CreateContentsInput {
  return {
    githubResult: fetchedData.githubResult || null,
    slackResult: fetchedData.slackResult ? Object.fromEntries(
      Object.entries(fetchedData.slackResult).map(([key, value]: [string, any]) => [key, value.messages])
    ) : null,
    workspaceId: target.workspace_id,
    targetId: target.target_id,
    period: 'weekly',
    range: dateRange.range,
    from: dateRange.startDate,
    to: dateRange.endDate,
    runId: runMapping.runId,
    runStepId: runMapping.runStepId,
    language: target.language,
    source: "slack",
    timezone: target.timezone,
    enableCreateContents: fetchedData.enableCreateContents
  };
}

/**
 * 단일 타겟 처리 메인 로직
 */
export async function processTarget(
  target: Target,
  runMapping: { runId: string; runStepId: string }
): Promise<void> {
  logger.info('--------------------------------');
  logger.info(`--- target: ${target.display_name} ---`);
  logger.info('--------------------------------');

  await updateNewsletterRun(adminClient, { 
    runId: runMapping.runId, 
    runStepId: runMapping.runStepId,
    status: 'running', 
    step: 'collect_data', 
    metricsJson: {} 
  });

  try {
    // 통합 정보 조회
    const integrationsInfo = await getIntegrationsInfo(adminClient, { workspaceId: target.workspace_id });
    const githubData = integrationsInfo?.find((integration: any) => integration.type === 'github')?.resource_cache_json as any;
    const slackData = integrationsInfo?.find((integration: any) => integration.type === 'slack')?.resource_cache_json as any;
    const sources = await getTargetSources(adminClient, { 
      workspaceId: target.workspace_id, 
      targetId: target.target_id 
    });

    if (sources.length === 0) {
      logger.info('No sources found for target', { targetId: target.target_id });
      return;
    }

    // 소스 매칭
    const matchedSources = matchSourcesToIntegrations(
      sources,
      integrationsInfo,
      githubData,
      slackData
    );

    // 매칭된 소스가 없는 경우 경고 로그를 출력하고 스킵
    if (matchedSources.matchedRepos.length === 0 && matchedSources.matchedChannels.length === 0) {
      logger.warn('No matched sources found for target, skipping', {
        targetId: target.target_id,
        targetName: target.display_name,
        sourcesCount: sources.length,
        sourcesWithType: matchedSources.sourcesWithType.map((s: any) => ({
          sourceType: s.sourceType,
          sourceIdent: s.sourceIdent,
          integrationType: s.integrationType
        }))
      });
      
      await updateNewsletterRunError(adminClient, { 
        runId: runMapping.runId, 
        runStepId: runMapping.runStepId, 
        errorSummary: 'No matched sources found for target', 
      });
      return;
    }

    // 데이터 페칭
    const fetchedData = await fetchIntegrationData(integrationsInfo, matchedSources);

    // 날짜 범위 생성
    const dateRange = createDateRange();

    // CreateContentsInput 생성
    const input = createContentsInput(target, runMapping, fetchedData, dateRange);

    // 이메일 제한 확인
    const limitCheck = await checkEmailLimit(target.workspace_id, target.workspace_id);
    
    if (!limitCheck.allowed) {
      logger.info('Email limit exceeded, skipping target', {
        target_id: target.target_id,
        email_sent_count: limitCheck.usageCounter?.email_sent_count,
        max_weekly_emails_per_month: limitCheck.planLimit?.max_weekly_emails_per_month
      });
      return;
    }

    // 컨텐츠 생성
    const content = await createContents(input);
    logger.info('Contents generation completed', { 
      targetId: target.target_id,
      result: content.status
    });

    await updateNewsletterRun(adminClient, { 
      runId: runMapping.runId, 
      runStepId: runMapping.runStepId, 
      status: 'success', 
      step: 'send_email',
      metricsJson: {} 
    });

    // 이메일 전송
    await sendMails(
      input,
      target.display_name,
      target.mailing_list_id || '',
      fetchedData.slackResult,
      content.data as { finalContents: string, htmlContents: string },
      limitCheck.planType,
      limitCheck.maxMembers
    );
  } catch (error: any) {
    logger.error('Cron actions target running error', { error: error.message });
    await updateNewsletterRunError(adminClient, { 
      runId: runMapping.runId, 
      runStepId: runMapping.runStepId, 
      errorSummary: error.message 
    });
    throw error;
  }
}

