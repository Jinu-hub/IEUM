/**
 * Actions API Endpoint
 *
 * 연계액션을 관리하는 API 엔드포인트입니다.
 * 연계액션 상태 확인, 연계액션을 실행하는 기능을 제공합니다.
 */

import { type LoaderFunctionArgs, type ActionFunctionArgs, data } from "react-router";
import { logger } from "~/core/lib/logger";
import adminClient from "~/core/lib/supa-admin-client.server";
import { isScheduledWithinHour } from "~/core/lib/cron-utils";
import makeServerClient from "~/core/lib/supa-client.server";
import { getIntegrationsInfo, getTargetSources } from "~/features/settings/db/queries";
import { runGithubFetch } from "~/core/integrations/github/run";
import { runSlackFetch } from "~/core/integrations/slack/run";

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
        
        if (githubCredentialRef && matchedRepos.length > 0) {
          githubToken = await getGitHubToken(githubCredentialRef as string) || undefined;
          githubRepos = matchedRepos.join(',');
          logger.info('[github]');
          logger.info(` credentialRef: ${githubCredentialRef}`);
          logger.info(` token: ${githubToken}`);
          logger.info(` repos: ${githubRepos}`);
          
          runGithubFetch({
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
          
          runSlackFetch({
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
  // 테스트를 위해 인증을 임시로 비활성화
  console.log('🚀 Cron actions API 호출됨:', {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries())
  });

  // POST 요청만 허용
  if (request.method !== "POST") {
    return data({ 
      status: 'error', 
      error: 'Only POST requests are allowed' 
    }, { status: 405 });
  }
  try {
    // 모든 활성화된 타겟을 가져옵니다
    const { data: allTargets, error } = await adminClient
      .from('targets')
      .select('*')
      .eq('is_active', true);

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
        
        if (githubCredentialRef && matchedRepos.length > 0) {
          githubToken = await getGitHubToken(githubCredentialRef as string) || undefined;
          githubRepos = matchedRepos.join(',');
          logger.info('[github]');
          logger.info(` credentialRef: ${githubCredentialRef}`);
          logger.info(` token: ${githubToken}`);
          logger.info(` repos: ${githubRepos}`);
          
          runGithubFetch({
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
          
          runSlackFetch({
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
      }
    }
    
  } catch (error: any) {
    logger.error('Cron actions error', { error: error.message });
    return data({ 
      status: 'error', 
      error: error.message 
    }, { status: 500 });
  }
}
