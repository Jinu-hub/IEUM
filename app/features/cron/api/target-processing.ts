/**
 * 타겟 처리 함수
 */

import type { Database } from "database.types";
import { logger } from "~/core/lib/logger";
import adminClient from "~/core/lib/supa-admin-client.server";
import type { CreateContentsInput } from "~/core/lib/types";
import { closeNewsletterRun, createNewsletterRun, incrementUsageCounter, saveRunLogEvent, updateNewsletterRun } from "~/features/contents/db/mutations";
import { getSentDailyEdition } from "~/features/contents/db/queries";
import { sendMails } from "~/features/cron/api/send-mails";
import { saveDailyCoreCollection } from "~/features/daily-core/collect";
import { getDailyCoreData } from "~/features/daily-core/db/queries";
import { generateDailyReport } from "~/features/daily-core/flue";
import { fetchDaysFor } from "~/features/daily-core/normalize";
import { getUserSubscriptionPlanType } from "~/features/settings/db/queries";
import { getWorkspaceOwnerUserId } from "~/features/users/queries";
import { collectTargetSources } from "./collect-sources";
import { checkEmailLimit } from "./limit-checking";
import { recordRuns } from "./run-record";
import { sendSlackNotification } from "./send_notifications";
import type { FetchedData, Target } from "./types";

// Temporary fixed date for works/daily-core-e2e.md. Remove after the E2E run.
const DAILY_CORE_TEST_DATE = "2026-10-22";

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

type RunIds = { runId: string; runStepId: string };

/** A cron run row is made only once a target passes the checks, so skipped targets leave no row. */
async function openRun(target: Target): Promise<RunIds> {
  if (!recordRuns()) return { runId: crypto.randomUUID(), runStepId: crypto.randomUUID() };
  return createNewsletterRun(adminClient, { workspaceId: target.workspace_id, trigger: 'cron', logRef: null });
}

async function noteRun(
  target: Target,
  runMapping: RunIds,
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

async function closeRun(runMapping: RunIds, status: 'failed' | 'canceled', errorSummary: string) {
  if (!recordRuns()) return;
  await closeNewsletterRun(adminClient, { ...runMapping, status, errorSummary });
}

/**
 * 단일 타겟 처리 메인 로직
 *
 * Cron passes no run: the checks before collecting (subscription, mail limit, already sent) skip with a
 * log line only, and the run row is made after them. A manual send passes the run it already made, so
 * those skips close it as canceled. Skips found while collecting close as canceled; errors as failed.
 */
export async function processTarget(target: Target, given?: RunIds): Promise<void> {
  logger.info('--------------------------------');
  logger.info(`--- target: ${target.display_name} ---`);
  logger.info('--------------------------------');
  let runMapping = given;
  const skip = async (reason: string) => {
    const message = `Target processing skipped: ${reason}`;
    if (!runMapping) return logger.warn(message, { targetId: target.target_id });
    await noteRun(target, runMapping, 'warn', 'target_processing_skipped', message);
    await closeRun(runMapping, 'canceled', reason);
  };

  try {

    const ownerUserId = await getWorkspaceOwnerUserId(adminClient, { workspaceId: target.workspace_id });
    const planType = await getUserSubscriptionPlanType(adminClient, { userId: ownerUserId as string });
  
    if (!planType) return await skip('No valid subscription found');

    // 이메일 제한 확인
    const limitCheck = await checkEmailLimit(target.workspace_id, ownerUserId as string
      , planType as Database["public"]["Enums"]["plan_type"]);
    
    if (!limitCheck.allowed) return await skip('Email limit exceeded');

    // One mail per daily core. Checked before collecting so a sent day costs no fetch or model call;
    // sendMails claims the day again in the DB for runs that race past this check.
    const forced = process.env.DAILY_MAIL_FORCE === "1";
    if (recordRuns() && !forced) {
      const existing = await getDailyCoreData(adminClient, { targetId: target.target_id, coreDate: DAILY_CORE_TEST_DATE });
      const sent = existing && (await getSentDailyEdition(adminClient, { dailyCoreId: existing.daily_core_id }));
      if (sent) return await skip(`Daily mail for ${DAILY_CORE_TEST_DATE} already ${sent.status} (edition ${sent.edition_id})`);
    }

    runMapping ??= await openRun(target);
    await noteRun(
      target, runMapping, 'info', 'target_processing_started',
      `Target processing started for target: ${target.display_name}`
    );

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
    if ("skip" in collected) return await skip(collected.skip);
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
    if (report.finalizerError) {
      await noteRun(
        target, runMapping, 'warn', 'report_finalizer_failed',
        `Report ${report.reportNo} uses the writer draft because the finalizer failed: ${report.finalizerError}`
      );
    }
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

    // 이메일 전송
    const sent = await sendMails(
      input,
      report.subject,
      target.mailing_list_id || '',
      fetchedData.slackResult,
      content,
      planType as Database["public"]["Enums"]["plan_type"],
      limitCheck.maxMembers,
      { dailyCoreId: dailyCore.dailyCoreId, dailyReportId: report.reportId, forced }
    );
    if (!sent) {
      await noteRun(target, runMapping, 'warn', 'mail_not_sent', `Daily mail not sent for report ${report.reportNo} (no recipient, already sent, or provider error)`);
      return;
    }

    // slack 통지 메시지 전송 (메일이 실제로 나간 뒤에만. 이미 보유한 integrationsInfo·matchedChannels 전달하여 중복 조회 방지)
    await sendSlackNotification(
      input,
      target.display_name,
      content,
      { integrationsInfo, matchedChannels: matchedSources.matchedChannels }
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
    // An error before the run row exists (a check's DB read) still gets a failed row.
    runMapping ??= await openRun(target).catch(() => undefined);
    if (runMapping) {
      await noteRun(target, runMapping, 'error', 'target_processing_error', `Target processing error: ${error.message}`);
      await closeRun(runMapping, 'failed', error.message);
    }
    throw error;
  }
}

