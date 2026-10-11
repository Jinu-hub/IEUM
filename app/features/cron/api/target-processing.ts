/**
 * 타겟 처리 함수
 */

import type { Database } from "database.types";
import { logger } from "~/core/lib/logger";
import adminClient from "~/core/lib/supa-admin-client.server";
import type { CreateContentsInput } from "~/core/lib/types";
import { incrementUsageCounter, saveRunLogEvent, updateNewsletterRun, updateNewsletterRunError } from "~/features/contents/db/mutations";
import { sendMails } from "~/features/cron/api/send-mails";
import { getUserSubscriptionPlanType } from "~/features/settings/db/queries";
import { getWorkspaceOwnerUserId } from "~/features/users/queries";
import { saveDailyCoreCollection } from "~/features/daily-core/collect";
import { generateDailyReport } from "~/features/daily-core/flue";
import { fetchDaysFor } from "~/features/daily-core/normalize";
import { collectTargetSources } from "./collect-sources";
import { checkEmailLimit } from "./limit-checking";
import { recordRuns } from "./run-record";
import { sendSlackNotification } from "./send_notifications";
import type { FetchedData, Target } from "./types";

// Temporary fixed date for works/daily-core-e2e.md. Remove after the E2E run.
const DAILY_CORE_TEST_DATE = "2026-10-09";

/**
 * 날짜 범위 생성 (Daily Core 날짜 하루). period_key는 UTC 날짜로 만들어지므로 UTC 자정으로 둔다.
 */
export function createDateRange(coreDate: string): { startDate: Date; endDate: Date; range: string } {
  const startDate = new Date(`${coreDate}T00:00:00Z`);
  const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
  return { startDate, endDate, range: coreDate };
}

/**
 * CreateContentsInput 생성
 */
export function createContentsInput(
  target: Target,
  runMapping: { runId: string; runStepId: string },
  fetchedData: FetchedData,
  dateRange: { startDate: Date; endDate: Date; range: string },
  runStartedAt?: number
): CreateContentsInput {
  return {
    githubResult: fetchedData.githubResult || null,
    slackResult: fetchedData.slackResult ? Object.fromEntries(
      Object.entries(fetchedData.slackResult).map(([key, value]: [string, any]) => [key, value.messages])
    ) : null,
    workspaceId: target.workspace_id,
    targetId: target.target_id,
    period: 'daily',
    range: dateRange.range,
    from: dateRange.startDate,
    to: dateRange.endDate,
    runId: runMapping.runId,
    runStepId: runMapping.runStepId,
    language: target.language,
    source: "slack",
    timezone: target.timezone,
    enableCreateContents: fetchedData.enableCreateContents,
    runStartedAt,
  };
}

async function noteRun(
  target: Target,
  runMapping: { runId: string; runStepId: string },
  level: string,
  stepName: string,
  message: string
) {
  const log = level === "error" ? logger.error : level === "warn" ? logger.warn : logger.info;
  log(message, { targetId: target.target_id });
  if (!recordRuns()) return;
  await saveRunLogEvent(adminClient, {
    workspaceId: target.workspace_id,
    runId: runMapping.runId,
    level,
    stepName,
    message,
  });
}

async function closeRun(
  runMapping: { runId: string; runStepId: string },
  errorSummary: string
) {
  if (!recordRuns()) return;
  await updateNewsletterRunError(adminClient, {
    runId: runMapping.runId,
    runStepId: runMapping.runStepId,
    errorSummary,
  });
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
  await noteRun(
    target, runMapping, 'info', 'target_processing_started',
    `Target processing started for target: ${target.display_name}`
  );

  try {

    const ownerUserId = await getWorkspaceOwnerUserId(adminClient, { workspaceId: target.workspace_id });
    const planType = await getUserSubscriptionPlanType(adminClient, { userId: ownerUserId as string });
  
    if (!planType) {
      await noteRun(target, runMapping, 'warn', 'target_processing_skipped', 'Target processing skipped: No valid subscription found');
      await closeRun(runMapping, 'No valid subscription found');
      return;
    }

    // 이메일 제한 확인
    const limitCheck = await checkEmailLimit(target.workspace_id, ownerUserId as string
      , planType as Database["public"]["Enums"]["plan_type"]);
    
    if (!limitCheck.allowed) {
      await noteRun(target, runMapping, 'warn', 'target_processing_skipped', 'Target processing skipped: Email limit exceeded');
      await closeRun(runMapping, 'Email limit exceeded');
      return;
    }

    const runStartedAt = Date.now();
    if (recordRuns()) {
      await updateNewsletterRun(adminClient, {
        runId: runMapping.runId,
        runStepId: runMapping.runStepId,
        status: 'running',
        step: 'collect_data',
        metricsJson: {}
      });
    }

    const fetchDays = fetchDaysFor(DAILY_CORE_TEST_DATE, target.timezone ?? "UTC");
    const collected = await collectTargetSources(target, fetchDays);
    if ("skip" in collected) {
      await noteRun(target, runMapping, 'warn', 'target_processing_skipped', `Target processing skipped: ${collected.skip}`);
      await closeRun(runMapping, collected.skip);
      return;
    }
    const { fetchedData, integrationsInfo, matchedSources } = collected;

    const dailyCore = await saveDailyCoreCollection(target, collected, DAILY_CORE_TEST_DATE);
    await noteRun(
      target, runMapping, 'info', 'daily_core_collected',
      `Daily core collected: ${dailyCore.dailyCoreId} (${DAILY_CORE_TEST_DATE}, ${dailyCore.itemCount} items, ${dailyCore.sourceDataIds.length} sources)`
    );

    const dateRange = createDateRange(DAILY_CORE_TEST_DATE);
    const input = createContentsInput(target, runMapping, fetchedData, dateRange, runStartedAt);

    // Core → Report (Flue Worker). A failure throws, so no mail goes out and the run closes as an error.
    const generated = await generateDailyReport(dailyCore.dailyCoreId);
    const { core, report } = generated;
    input.accuratedTokens = generated.totalTokens;
    await noteRun(
      target, runMapping, 'info', 'daily_report_generated',
      `Daily report generated: report ${report.reportNo} from core generation ${core.generationNo} (core ${core.elapsedMs}ms, report ${report.elapsedMs ?? 0}ms, $${generated.cost.toFixed(4)})`
    );
    const content = { finalContents: report.markdown, htmlContents: report.html };

    if (recordRuns()) {
      await updateNewsletterRun(adminClient, {
        runId: runMapping.runId,
        runStepId: runMapping.runStepId,
        status: 'success',
        step: 'send_email',
        metricsJson: {
          daily_core_id: dailyCore.dailyCoreId,
          core_generation_no: core.generationNo,
          report_id: report.reportId,
          report_no: report.reportNo,
          core_ms: core.elapsedMs,
          report_ms: report.elapsedMs ?? 0,
          cost_usd: generated.cost,
        },
        accuratedTokens: input.accuratedTokens
      });
    }

    // slack 통지 메시지 전송 (이미 보유한 integrationsInfo·matchedChannels 전달하여 중복 조회 방지)
    await sendSlackNotification(
      input,
      target.display_name,
      content,
      { integrationsInfo, matchedChannels: matchedSources.matchedChannels }
    );

    // 이메일 전송
    await sendMails(
      input,
      report.subject,
      target.mailing_list_id || '',
      fetchedData.slackResult,
      content,
      planType as Database["public"]["Enums"]["plan_type"],
      limitCheck.maxMembers
    );

    if (recordRuns()) {
      if (limitCheck.usageCounter?.counter_id) {
        await incrementUsageCounter(adminClient, {
          counterId: limitCheck.usageCounter.counter_id,
          accuratedTokens: input.accuratedTokens || 0
        });
      } else {
        logger.warn('Skipping usage counter update: missing counter_id', {
          counterId: limitCheck.usageCounter?.counter_id
        });
      }
    }

  } catch (error: any) {
    logger.error('Cron actions target running error', { error: error.message });
    await noteRun(target, runMapping, 'error', 'target_processing_error', `Target processing error: ${error.message}`);
    await closeRun(runMapping, error.message);
    throw error;
  }
}

