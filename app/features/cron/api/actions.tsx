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
import { getIntegrationsInfo, getMailingListMembers, getTargetSources } from "~/features/settings/db/queries";
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
      return isScheduledWithinHour(target.schedule_cron);
    }) || [];

    logger.info('Filtered targets for next hour', { 
      totalTargets: allTargets?.length || 0,
      scheduledTargets: targets.length,
      targets: targets.map(t => ({ target_id: t.target_id, schedule_cron: t.schedule_cron }))
    });

    for (const target of allTargets) {
      logger.info(`--- target: ${target.display_name} ---`);
      const integrationsInfo = await getIntegrationsInfo(adminClient, { workspaceId: target.workspace_id });
      const githubData = integrationsInfo?.find((integration: any) => integration.type === 'github')?.resource_cache_json as any;
      const slackData = integrationsInfo?.find((integration: any) => integration.type === 'slack')?.resource_cache_json as any;
      const sources = await getTargetSources(adminClient, { workspaceId: target.workspace_id, targetId: target.target_id });
      
      if (sources.length > 0) {
        
        let githubRepos = null;
        let slackChannels = null;
        const matchedRepos: string[] = [];
        const matchedChannels: string[] = [];
        
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
            const matchedRepo = githubData?.repos?.find((repo: any) => repo.name === source.sourceIdent);
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
            days: 7,
          }).catch((error) => {
            logger.error('Github fetch error', { error });
          });
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
          }).catch((error) => {
            logger.error('Slack fetch error', { error });
          });
        } else {
          logger.info('CredentialRef가 유효하지 않거나, 매칭된 Channel가 없습니다.');
        }

        if (!githubResult && !slackResult) {
          return new Response("Failed to fetch GitHub and Slack data", { status: 500 });
        }

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        const period = `${startDate.getFullYear()}-${startDate.getMonth() + 1}-${startDate.getDate()} ~ ${endDate.getFullYear()}-${endDate.getMonth() + 1}-${endDate.getDate()}`;

        // コンテンツを生成
        const content = await createContents({
          githubResult : githubResult || null,
          slackResult : slackResult ? Object.fromEntries(
            Object.entries(slackResult).map(([key, value]) => [key, value.messages])
          ) : null,
          workspaceId: target.workspace_id,
          targetId: target.target_id,
          period: period,
          language: "ja",
          source: "slack",
          timezone: "Asia/Tokyo"
        });
        
        logger.info('Contents generation completed', { 
          targetId: target.target_id,
          result: content.status
        });
        
        await sendMails(target.workspace_id, target.mailing_list_id || '', slackResult);
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
      return isScheduledWithinHour(target.schedule_cron);
    }) || [];

    logger.info('Filtered targets for next hour', { 
      totalTargets: allTargets?.length || 0,
      scheduledTargets: targets.length,
      targets: targets.map(t => ({ target_id: t.target_id, schedule_cron: t.schedule_cron }))
    });

    for (const target of allTargets) {
      logger.info(`--- target: ${target.display_name} ---`);
      let emailList: string[] = [];
      const integrationsInfo = await getIntegrationsInfo(adminClient, { workspaceId: target.workspace_id });
      const githubData = integrationsInfo?.find((integration: any) => integration.type === 'github')?.resource_cache_json as any;
      const slackData = integrationsInfo?.find((integration: any) => integration.type === 'slack')?.resource_cache_json as any;
      const sources = await getTargetSources(adminClient, { workspaceId: target.workspace_id, targetId: target.target_id });
      if (sources.length > 0) {
        let githubRepos = null;
        let slackChannels = null;
        const matchedRepos: string[] = [];
        const matchedChannels: string[] = [];
        
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
            const matchedRepo = githubData?.repos?.find((repo: any) => repo.name === source.sourceIdent);
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
            days: 7,
          }).catch((error) => {
            logger.error('Github fetch error', { error });
          });
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
          }).catch((error) => {
            logger.error('Slack fetch error', { error });
          });
        } else {
          logger.info('CredentialRef가 유효하지 않거나, 매칭된 Channel가 없습니다.');
        }

        if (!githubResult && !slackResult) {
          return new Response("Failed to fetch GitHub and Slack data", { status: 500 });
        }
        
        if (slackResult) {
          const slackEmails = Object.values(slackResult)
            .map((channel: any) => channel.emailList || [])
            .flat()
            .filter((email: string) => email && email.trim() !== ''); 
          logger.info('Slack emails', { slackEmails });
          emailList.push(...slackEmails);
        }

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        const period = `${startDate.getFullYear()}-${startDate.getMonth() + 1}-${startDate.getDate()} ~ ${endDate.getFullYear()}-${endDate.getMonth() + 1}-${endDate.getDate()}`;

        // コンテンツを生成
        const contentsResult = await createContents({
          githubResult : githubResult || null,
          slackResult : slackResult ? Object.fromEntries(
            Object.entries(slackResult).map(([key, value]) => [key, value.messages])
          ) : null,
          workspaceId: target.workspace_id,
          targetId: target.target_id,
          period: period,
          language: "ja",
          source: "slack",
          timezone: "Asia/Tokyo"
        });
        
        logger.info('Contents generation completed', { 
          targetId: target.target_id,
          result: contentsResult.status
        });
      }

      const mailingListId = target.mailing_list_id;
      if (mailingListId) {
        const members = await getMailingListMembers(adminClient, { mailingListId: mailingListId });
        console.log('members', members);
        if (members.length > 0) {
          logger.info('Mailing list members found', { mailingListId, members: members.length });
          emailList.push(...members.map((member: any) => member.email));
        } else {
          logger.info('Mailing list members not found', { mailingListId });
        }
      }

      // 중복 제거 및 최종 이메일 목록
      const uniqueEmails = [...new Set(emailList)].filter(email => email && email.trim() !== '');
      logger.info('Final email list', { 
        totalEmails: emailList.length, 
        uniqueEmails: uniqueEmails.length,
        emails: uniqueEmails 
      });

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
