/**
 * Actions API Endpoint
 *
 * 연계액션을 관리하는 API 엔드포인트입니다.
 * 연계액션 상태 확인, 연계액션을 실행하는 기능을 제공합니다.
 */

import { type ActionFunctionArgs, data, type LoaderFunctionArgs } from "react-router";
import { runGithubFetch } from "~/core/integrations/github/run";
import { runSlackFetch } from "~/core/integrations/slack/run";
import { isScheduledWithinHour } from "~/core/lib/cron-utils";
import { logger } from "~/core/lib/logger";
import adminClient from "~/core/lib/supa-admin-client.server";
import type { CreateContentsInput, EnableCreateContents } from "~/core/lib/types";
import { createNewsletterRun, incrementUsageCounterForEmail, updateNewsletterRun, updateNewsletterRunError } from "~/features/contents/db/mutations";
import { getIntegrationsInfo, getPlanLimits, getTargetSources, getUserSubscriptionPlanType } from "~/features/settings/db/queries";
import { getWorkspaceOwnerUserId } from "~/features/users/queries";
import { createContents } from "./create-contents";
import { sendMails } from "./send-mails";

/**
 * 타겟 정보 타입 (데이터베이스 타입 기반)
 */
type Target = {
  target_id: string;
  schedule_cron: string | null;
  is_active: boolean;
  display_name: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
};

/**
 * Cron 액션 응답 타입
 */
type CronActionResponse = {
  status: 'success' | 'error';
  data?: {
    targets: Target[];
    totalTargets: number;
    scheduledTargets: number;
  };
  error?: string;
};

/**
 * Loader: GET 요청으로 cron 타겟 정보 반환 (테스트용)
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  console.log('🚀 Cron actions API (GET) 호출됨');

  try {
    //const currentHour = new Date().getHours();
    // 모든 활성화된 타겟을 가져옵니다
    const { data: allTargets, error } = await adminClient
      .from('targets')
      .select('*')
      .eq('is_active', true)
      .order('workspace_id', { ascending: true });

    if (error) {
      logger.error('Failed to fetch targets', { error });
      return data({ 
        status: 'error', 
        error: 'Failed to fetch targets' 
      }, { status: 500 });
    }

    // 현재 시간부터 1시간 이내에 실행될 스케줄인 타겟만 필터링
    const targets = allTargets?.filter(target => {
      if (!target.schedule_cron) return false;
      return isScheduledWithinHour(target.schedule_cron, target.timezone);
    }) || [];

    logger.info('Filtered targets for next hour', { 
      totalTargets: allTargets?.length || 0,
      scheduledTargets: targets.length,
      targets: targets.map(t => ({ target_id: t.target_id, schedule_cron: t.schedule_cron }))
    });
    
    const runMapping: Record<string, { runId: string; runStepId: string }> = {};
    for (const target of allTargets ?? []) {
      const { runId, runStepId } = await createNewsletterRun(adminClient, {
        workspaceId: target.workspace_id,
        trigger: 'cron', logRef: null,
      });
      runMapping[target.target_id] = { runId, runStepId };
    }

    for (const target of allTargets ?? []) {
      logger.info('--------------------------------');
      logger.info(`--- target: ${target.display_name} ---`);
      logger.info('--------------------------------');
      await updateNewsletterRun(adminClient, { 
       runId: runMapping[target.target_id].runId, 
       runStepId: runMapping[target.target_id].runStepId,
       status: 'running', step: 'collect_data', metricsJson: {} 
      });

      try {
        const integrationsInfo = await getIntegrationsInfo(adminClient, { workspaceId: target.workspace_id });
        const githubData = integrationsInfo?.find((integration: any) => integration.type === 'github')?.resource_cache_json as any;
        const slackData = integrationsInfo?.find((integration: any) => integration.type === 'slack')?.resource_cache_json as any;
        const sources = await getTargetSources(adminClient, { workspaceId: target.workspace_id, targetId: target.target_id });
        
        if (sources.length > 0) {
          
          let githubRepos = null;
          let slackChannels = null;
          const matchedRepos: string[] = [];
          const matchedChannels: string[] = [];
          const sourcesWithType = sources.map((s: any) => ({
            ...s,
            integrationType: integrationsInfo.find((i: any) => i.integration_id === s.integrationId)?.type || ''
          }));
          
          for (const source of sources) {
            if (source.sourceType === 'slack_channel') {
              const cleanSourceIdent = source.sourceIdent?.startsWith('#') 
                ? source.sourceIdent.substring(1) 
                : source.sourceIdent;
              const matchedChannel = slackData?.channels?.find((channel: any) => channel.name === cleanSourceIdent);
              if (matchedChannel && matchedChannel.id) {
                matchedChannels.push(matchedChannel.id);
              }
            } else if (source.sourceType === 'github_repo') {
              const matchedRepo = githubData?.repos?.find((repo: any) => repo.full_name === source.sourceIdent || repo.name === source.sourceIdent);
              if (matchedRepo && matchedRepo.full_name) {
                matchedRepos.push(matchedRepo.full_name);
              }
            }
          }
          const { getGitHubToken, getSlackBotToken } = await import("~/core/lib/secrets-manager.server");
          const githubCredentialRef = integrationsInfo.find((integration: any) => integration.type === 'github')?.credential_ref;
          const slackCredentialRef = integrationsInfo.find((integration: any) => integration.type === 'slack')?.credential_ref;
          let githubToken = null;
          let slackToken = null;
          let githubResult = null;
          let slackResult = null;
          const enableCreateContents: EnableCreateContents = {
            slack: false,
            github: false,
            discord: false,
          };

          if (githubCredentialRef && matchedRepos.length > 0) {
            githubToken = await getGitHubToken(githubCredentialRef as string) || undefined;
            githubRepos = matchedRepos.join(',');
            logger.info('[github]');
            logger.info(` credentialRef: ${githubCredentialRef}`);
            //logger.info(` token: ${githubToken}`);
            logger.info(` repos: ${githubRepos}`);
            
            githubResult = await runGithubFetch({
              repos: githubRepos,
              outDir: 'output-test',
              token: githubToken,
              installationId: githubCredentialRef,
              days: 7,
            }).catch((error: any) => {
              logger.error('Github fetch error', { 
                error: error.message || String(error),
                status: error.status,
                response: error.response?.data,
                stack: error.stack
              });
              throw error;
            });
            enableCreateContents.github = (githubResult && Object.keys(githubResult).length > 0) ? true : false;
            //await saveContentToFile(githubResult, 'output-test', 'github_', 'json');
          } else {
            logger.info('CredentialRef가 유효하지 않거나, 매칭된 Repository가 없습니다.');
          }

          if (slackCredentialRef && matchedChannels.length > 0) {
            slackToken = await getSlackBotToken(slackCredentialRef as string) || undefined;
            slackChannels = matchedChannels.join(',');
            logger.info('[slack]');
            logger.info(` credentialRef: ${slackCredentialRef}`);
            logger.info(` token: ${slackToken}`);
            logger.info(` channels: ${slackChannels}`);
            
            slackResult = await runSlackFetch({
              channels: slackChannels,
              outDir: 'output-test',
              token: slackToken,
              days: 7,
              sources: sourcesWithType, 
            }).catch((error) => {
              logger.error('Slack fetch error', { error });
            });
            enableCreateContents.slack = (slackResult && Object.keys(slackResult).length > 0) ? true : false;
          } else {
            logger.info('CredentialRef가 유효하지 않거나, 매칭된 Channel가 없습니다.');
          }

          if (!githubResult && !slackResult) {
            return new Response("Failed to fetch GitHub and Slack data", { status: 500 });
          }

          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(endDate.getDate() - 7);
          const range = `${startDate.getFullYear()}-${startDate.getMonth() + 1}-${startDate.getDate()} ~ ${endDate.getFullYear()}-${endDate.getMonth() + 1}-${endDate.getDate()}`;
          const input: CreateContentsInput = {
            githubResult : githubResult || null,
            slackResult : slackResult ? Object.fromEntries(
              Object.entries(slackResult).map(([key, value]) => [key, value.messages])
            ) : null,
            workspaceId: target.workspace_id,
            targetId: target.target_id,
            period: 'weekly',
            range: range,
            from: startDate,
            to: endDate,
            runId: runMapping[target.target_id].runId,
            runStepId: runMapping[target.target_id].runStepId,
            language: "ja",
            source: "slack",
            timezone: target.timezone,
            enableCreateContents: enableCreateContents
          }

          const ownerUserId = await getWorkspaceOwnerUserId(adminClient, { workspaceId: target.workspace_id });
          const planType = await getUserSubscriptionPlanType(adminClient, { userId: ownerUserId as string }) || 'free';
          const planLimit = await getPlanLimits(adminClient, { planType });

          // usage_counters 등록/업데이트
          const usageCounter = await incrementUsageCounterForEmail(adminClient, { workspaceId: target.workspace_id, userId: ownerUserId as string });
          if (usageCounter) {
            logger.info('Usage counter updated', { usageCounter });

            if (planLimit && planLimit.max_weekly_emails_per_month !== null) {
              // email_sent_count가 limit보다 크면 continue
              if (usageCounter.email_sent_count > planLimit.max_weekly_emails_per_month) {
                logger.info('Email limit exceeded', {
                  email_sent_count: usageCounter.email_sent_count,
                  max_weekly_emails_per_month: planLimit.max_weekly_emails_per_month,
                  plan_type: planType,
                  target_id: target.target_id
                });
                continue;
              }
            }
          } else {
            logger.error('Failed to update usage counter');
          }

          // コンテンツを生成
          const content = await createContents(input);
          logger.info('Contents generation completed', { 
            targetId: target.target_id,
            result: content.status
          });
          
          await updateNewsletterRun(adminClient, { 
            runId: runMapping[target.target_id].runId, 
            runStepId: runMapping[target.target_id].runStepId, 
            status: 'success', 
            step: 'send_email',
            metricsJson: {} 
          });
          
          // max_members_per_target가 null이거나 undefined면 0 (데이터 없음 = 제한 없음)
          const maxMembers = planLimit?.max_members_per_target ?? 0;
          
          await sendMails(input, target.display_name, target.mailing_list_id || '', 
            slackResult, content.data as { finalContents: string, htmlContents: string }, planType, maxMembers)
        }
      } catch (error: any) {
        logger.error('Cron actions target running error', { error: error.message });
        await updateNewsletterRunError(adminClient, { 
          runId: runMapping[target.target_id].runId, 
          runStepId: runMapping[target.target_id].runStepId, 
          errorSummary: error.message 
        });
      }
    }

    return data({ 
      status: 'success', 
      data: {
        targets,
        totalTargets: allTargets?.length || 0,
        scheduledTargets: targets.length
      }
    });
  } catch (error: any) {
    logger.error('Cron actions loader error', { error: error.message });
    return data({ 
      status: 'error', 
      error: error.message 
    }, { status: 500 });
  }
}

/**
 * Action: GitHub 통합 설정 관리
 */
export async function action({ request, params }: ActionFunctionArgs) {
  console.log('🚀 Cron actions API (GET) 호출됨');
  
  try {
    //const currentHour = new Date().getHours();
    // 모든 활성화된 타겟을 가져옵니다
    const { data: allTargets, error } = await adminClient
      .from('targets')
      .select('*')
      .eq('is_active', true)
      .order('workspace_id', { ascending: true });

    if (error) {
      logger.error('Failed to fetch targets', { error });
      return data({ 
        status: 'error', 
        error: 'Failed to fetch targets' 
      }, { status: 500 });
    }

    // 현재 시간부터 1시간 이내에 실행될 스케줄인 타겟만 필터링
    const targets = allTargets?.filter(target => {
      if (!target.schedule_cron) return false;
      return isScheduledWithinHour(target.schedule_cron, target.timezone);
    }) || [];

    logger.info('Filtered targets for next hour', { 
      totalTargets: allTargets?.length || 0,
      scheduledTargets: targets.length,
      targets: targets.map(t => ({ target_id: t.target_id, schedule_cron: t.schedule_cron }))
    });
    
    const runMapping: Record<string, { runId: string; runStepId: string }> = {};
    for (const target of allTargets ?? []) {
      const { runId, runStepId } = await createNewsletterRun(adminClient, {
        workspaceId: target.workspace_id,
        trigger: 'cron', logRef: null,
      });
      runMapping[target.target_id] = { runId, runStepId };
    }

    for (const target of allTargets ?? []) {
      logger.info(`--- target: ${target.display_name} ---`);
      await updateNewsletterRun(adminClient, { 
       runId: runMapping[target.target_id].runId, 
       runStepId: runMapping[target.target_id].runStepId,
       status: 'running', step: 'collect_data', metricsJson: {} 
      });
      try {
        const integrationsInfo = await getIntegrationsInfo(adminClient, { workspaceId: target.workspace_id });
        const githubData = integrationsInfo?.find((integration: any) => integration.type === 'github')?.resource_cache_json as any;
        const slackData = integrationsInfo?.find((integration: any) => integration.type === 'slack')?.resource_cache_json as any;
        const sources = await getTargetSources(adminClient, { workspaceId: target.workspace_id, targetId: target.target_id });
        
        if (sources.length > 0) {
          
          let githubRepos = null;
          let slackChannels = null;
          const matchedRepos: string[] = [];
          const matchedChannels: string[] = [];
          const sourcesWithType = sources.map((s: any) => ({
            ...s,
            integrationType: integrationsInfo.find((i: any) => i.integration_id === s.integrationId)?.type || ''
          }));
          
          for (const source of sources) {
            if (source.sourceType === 'slack_channel') {
              const cleanSourceIdent = source.sourceIdent?.startsWith('#') 
                ? source.sourceIdent.substring(1) 
                : source.sourceIdent;
              const matchedChannel = slackData?.channels?.find((channel: any) => channel.name === cleanSourceIdent);
              if (matchedChannel && matchedChannel.id) {
                matchedChannels.push(matchedChannel.id);
              }
            } else if (source.sourceType === 'github_repo') {
              const matchedRepo = githubData?.repos?.find((repo: any) => repo.full_name === source.sourceIdent || repo.name === source.sourceIdent);
              if (matchedRepo && matchedRepo.full_name) {
                matchedRepos.push(matchedRepo.full_name);
              }
            }
          }
          const { getGitHubToken, getSlackBotToken } = await import("~/core/lib/secrets-manager.server");
          const githubCredentialRef = integrationsInfo.find((integration: any) => integration.type === 'github')?.credential_ref;
          const slackCredentialRef = integrationsInfo.find((integration: any) => integration.type === 'slack')?.credential_ref;
          let githubToken = null;
          let slackToken = null;
          let githubResult = null;
          let slackResult = null;
          const enableCreateContents: EnableCreateContents = {
            slack: false,
            github: false,
            discord: false,
          };

          if (githubCredentialRef && matchedRepos.length > 0) {
            githubToken = await getGitHubToken(githubCredentialRef as string) || undefined;
            githubRepos = matchedRepos.join(',');
            logger.info('[github]');
            logger.info(` credentialRef: ${githubCredentialRef}`);
            //logger.info(` token: ${githubToken}`);
            logger.info(` repos: ${githubRepos}`);
            
            githubResult = await runGithubFetch({
              repos: githubRepos,
              outDir: 'output-test',
              token: githubToken,
              installationId: githubCredentialRef,
              days: 7,
            }).catch((error: any) => {
              logger.error('Github fetch error', { 
                error: error.message || String(error),
                status: error.status,
                response: error.response?.data,
                stack: error.stack
              });
              throw error;
            });
            enableCreateContents.github = (githubResult && Object.keys(githubResult).length > 0) ? true : false;
            //await saveContentToFile(githubResult, 'output-test', 'github_', 'json');
          } else {
            logger.info('CredentialRef가 유효하지 않거나, 매칭된 Repository가 없습니다.');
          }

          if (slackCredentialRef && matchedChannels.length > 0) {
            slackToken = await getSlackBotToken(slackCredentialRef as string) || undefined;
            slackChannels = matchedChannels.join(',');
            logger.info('[slack]');
            logger.info(` credentialRef: ${slackCredentialRef}`);
            logger.info(` token: ${slackToken}`);
            logger.info(` channels: ${slackChannels}`);
            
            slackResult = await runSlackFetch({
              channels: slackChannels,
              outDir: 'output-test',
              token: slackToken,
              days: 7,
              sources: sourcesWithType, 
            }).catch((error) => {
              logger.error('Slack fetch error', { error });
            });
            enableCreateContents.slack = (slackResult && Object.keys(slackResult).length > 0) ? true : false;
          } else {
            logger.info('CredentialRef가 유효하지 않거나, 매칭된 Channel가 없습니다.');
          }

          if (!githubResult && !slackResult) {
            return new Response("Failed to fetch GitHub and Slack data", { status: 500 });
          }

          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(endDate.getDate() - 7);
          const range = `${startDate.getFullYear()}-${startDate.getMonth() + 1}-${startDate.getDate()} ~ ${endDate.getFullYear()}-${endDate.getMonth() + 1}-${endDate.getDate()}`;
          const input: CreateContentsInput = {
            githubResult : githubResult || null,
            slackResult : slackResult ? Object.fromEntries(
              Object.entries(slackResult).map(([key, value]) => [key, value.messages])
            ) : null,
            workspaceId: target.workspace_id,
            targetId: target.target_id,
            period: 'weekly',
            range: range,
            from: startDate,
            to: endDate,
            runId: runMapping[target.target_id].runId,
            runStepId: runMapping[target.target_id].runStepId,
            language: "ja",
            source: "slack",
            timezone: target.timezone,
            enableCreateContents: enableCreateContents
          }

          const ownerUserId = await getWorkspaceOwnerUserId(adminClient, { workspaceId: target.workspace_id });
          const planType = await getUserSubscriptionPlanType(adminClient, { userId: ownerUserId as string }) || 'free';
          const planLimit = await getPlanLimits(adminClient, { planType });

          // usage_counters 등록/업데이트
          const usageCounter = await incrementUsageCounterForEmail(adminClient, { workspaceId: target.workspace_id, userId: ownerUserId as string });
          if (usageCounter) {
            logger.info('Usage counter updated', { usageCounter });

            if (planLimit && planLimit.max_weekly_emails_per_month !== null) {
              // email_sent_count가 limit보다 크면 continue
              if (usageCounter.email_sent_count > planLimit.max_weekly_emails_per_month) {
                logger.info('Email limit exceeded', {
                  email_sent_count: usageCounter.email_sent_count,
                  max_weekly_emails_per_month: planLimit.max_weekly_emails_per_month,
                  plan_type: planType,
                  target_id: target.target_id
                });
                continue;
              }
            }
          } else {
            logger.error('Failed to update usage counter');
          }

          // コンテンツを生成
          const content = await createContents(input);
          logger.info('Contents generation completed', { 
            targetId: target.target_id,
            result: content.status
          });
          
          await updateNewsletterRun(adminClient, { 
            runId: runMapping[target.target_id].runId, 
            runStepId: runMapping[target.target_id].runStepId, 
            status: 'success', 
            step: 'send_email',
            metricsJson: {} 
          });
          
          // max_members_per_target가 null이거나 undefined면 0 (데이터 없음 = 제한 없음)
          const maxMembers = planLimit?.max_members_per_target ?? 0;
          
          await sendMails(input, target.display_name, target.mailing_list_id || '', 
            slackResult, content.data as { finalContents: string, htmlContents: string }, planType, maxMembers)
        }
      } catch (error: any) {
        logger.error('Cron actions target running error', { error: error.message });
        await updateNewsletterRunError(adminClient, { 
          runId: runMapping[target.target_id].runId, 
          runStepId: runMapping[target.target_id].runStepId, 
          errorSummary: error.message 
        });
      }
    }

    return data({ 
      status: 'success', 
      data: {
        targets,
        totalTargets: allTargets?.length || 0,
        scheduledTargets: targets.length
      }
    });
  } catch (error: any) {
    logger.error('Cron actions action error', { error: error.message });
    return data({ 
      status: 'error', 
      error: error.message 
    }, { status: 500 });
  }
}
