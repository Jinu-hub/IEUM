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
import { getIntegrationsInfo, getTargetSources } from "~/features/settings/db/queries";
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
  /*
  const toEmail1 = "takefree.withu@gmail.com";
  const toEmail2 = "takefree2013withu@gmail.com";
  const toEmail3 = "takefree2020withu@gmail.com";
  const toEmail4 = "jinu30dev@gmail.com";
  const toEmail5 = "nex30letter@gmail.com";
  const ccEmail1 = "son@digitalsheep.co.jp";
  const ccEmail2 = "junu31dev@gmail.com";
  const ccEmail3 = "jinu30test@gmail.com";
  const mailParams = [ 
    {
    toEmail: toEmail1,
    bccEmails: [ccEmail1, ccEmail2, ccEmail3, toEmail2, toEmail3, toEmail4, toEmail5],
    subject: 'Quick update from Nexletter',
    html: `
<p>Hi there,</p>
<p>Just a quick check-in to ensure our newsletter delivery system is running smoothly.</p>
<p>Everything looks good on our end. We'll continue to keep you updated with the latest content.</p>
<p>Thanks,<br>Jinu</p>
    `
  },
  {
    toEmail: toEmail2,
    bccEmails: [ccEmail1, ccEmail2, ccEmail3, toEmail1, toEmail3, toEmail4, toEmail5],
    subject: 'Newsletter system status update',
    html: `
<p>Hello,</p>
<p>This is a routine check to confirm our newsletter delivery infrastructure is operating normally.</p>
<p>All systems are functioning as expected. Thank you for being part of our community.</p>
<p>Best regards,<br>Jinu</p>
    `
  },
  {
    toEmail: toEmail3,
    bccEmails: [ccEmail1, ccEmail2, ccEmail3, toEmail1, toEmail2, toEmail4, toEmail5],
    subject: 'Regular newsletter delivery confirmation',
    html: `
<p>Hi there,</p>
<p>Just confirming that our newsletter delivery service is active and ready to send your weekly updates.</p>
<p>We're committed to keeping you informed with valuable content. Stay tuned for more!</p>
<p>Thanks,<br>Jinu</p>
    `
  },
  {
    toEmail: toEmail4,
    bccEmails: [ccEmail1, ccEmail2, ccEmail3, toEmail1, toEmail2, toEmail3, toEmail5],
    subject: 'Your newsletter subscription is active',
    html: `
<p>Hello,</p>
<p>This message confirms that your newsletter subscription is active and our delivery system is working properly.</p>
<p>We appreciate your continued interest in our content. More updates coming soon!</p>
<p>Best,<br>Jinu</p>
    `
  },
  {
    toEmail: toEmail5,
    bccEmails: [ccEmail1, ccEmail2, ccEmail3, toEmail1, toEmail2, toEmail3, toEmail4],
    subject: 'Nexletter delivery system notification',
    html: `
<p>Hi,</p>
<p>This is an automated message to verify that our newsletter delivery channels are functioning correctly.</p>
<p>Your subscription remains active, and we're preparing fresh content for you. Thank you for staying with us!</p>
<p>Regards,<br>Jinu</p>
    `
  }
 ]

  for (let i = 0; i < mailParams.length; i++) {
    const mailParam = mailParams[i];
    const { toEmail, bccEmails, subject, html } = mailParam;
    
    // 2番目以降は1秒待つ
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    const result = await sendWarmingUpEmail(toEmail, bccEmails, subject, html);
    if (result.error) {
      console.log(`Failed to send email to ${toEmail}:`, result.error);
    } else {
      console.log(`Sent email to ${toEmail}:`, result.data);
    }
  }
  return data({ 
    status: 'success', 
    data: {
      result: 'success'
    }
  });
  */
 

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

          // usage_counters 등록/업데이트
          await incrementUsageCounterForEmail(adminClient, { workspaceId: target.workspace_id });

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
          
          await sendMails(input, target.display_name, target.mailing_list_id || '', 
            slackResult, content.data as { finalContents: string, htmlContents: string })
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

          // usage_counters 등록/업데이트
          await incrementUsageCounterForEmail(adminClient, { workspaceId: target.workspace_id });

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
          
          await sendMails(input, target.display_name, target.mailing_list_id || '', 
            slackResult, content.data as { finalContents: string, htmlContents: string })
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
