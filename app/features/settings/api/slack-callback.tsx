import { data, type LoaderFunctionArgs, redirect } from "react-router";
import { logger } from "~/core/lib/logger";
import adminClient from "~/core/lib/supa-admin-client.server";
import { generateCredentialRef } from "./common";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    logger.info('🔄 Slack OAuth 콜백 수신:', {
      hasCode: !!code,
      hasState: !!state,
      error,
      fullUrl: request.url
    });

    // OAuth 에러 처리
    if (error) {
      logger.error('Slack OAuth error:', { error });
      return redirect('/settings/integrations?error=' + encodeURIComponent(`Slack 연결 실패: ${error}`));
    }

    // 필수 파라미터 확인
    if (!code) {
      logger.error('Missing authorization code');
      return redirect('/settings/integrations?error=missing_code');
    }

    if (!state) {
      logger.error('Missing state parameter');
      return redirect('/settings/integrations?error=missing_state');
    }

    // state 파라미터 파싱
    let workspaceId: string;
    let userId: string;
    
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
      workspaceId = stateData.workspaceId;
      userId = stateData.userId;
      
      if (!workspaceId || !userId) {
        throw new Error('Invalid state data');
      }
    } catch (parseError) {
      logger.error('Failed to parse state parameter:', { parseError });
      return redirect('/settings/integrations?error=invalid_state');
    }

    // Slack OAuth 토큰 교환
    const { SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, SLACK_REDIRECT_URI } = await import("~/core/integrations/slack/client");
    
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: SLACK_CLIENT_ID,
        client_secret: SLACK_CLIENT_SECRET,
        code,
        redirect_uri: SLACK_REDIRECT_URI
      })
    });

    if (!tokenResponse.ok) {
      logger.error('Slack token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText
      });
      return redirect('/settings/integrations?error=token_exchange_failed');
    }

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.ok) {
      logger.error('Slack OAuth error:', tokenData.error);
      return redirect('/settings/integrations?error=' + encodeURIComponent(`Slack OAuth 실패: ${tokenData.error}`));
    }

    logger.info('Slack OAuth 성공:', {
      teamId: tokenData.team?.id,
      teamName: tokenData.team?.name,
      userId: tokenData.authed_user?.id,
      workspaceId
    });

    // 획득한 bot토큰, user토큰
    const botToken = tokenData.access_token;
    const userToken = tokenData.authed_user?.access_token;

    // 새로운 credentialRef 생성
    const credentialRef_new = generateCredentialRef('slack', userId.substring(0, 8));

    // Slack 연결 상태 확인 및 정보 수집
    let slackInfo = null;
    try {
      const { checkSlackConnection } = await import("./slack-integration");
      slackInfo = await checkSlackConnection(botToken);
      
      if (!slackInfo.connected) {
        logger.error('Slack connection verification failed:', { error: slackInfo.error });
        return redirect('/settings/integrations?error=' + 
          encodeURIComponent(`Slack 연결 확인 실패: ${slackInfo.error}`));
      }

      logger.info('Slack 연결 정보 확인 완료:', {
        teamId: slackInfo.team?.id,
        teamName: slackInfo.team?.name,
        channelsCount: slackInfo.channels?.length || 0,
        botUserId: slackInfo.bot?.user_id
      });
    } catch (error: any) {
      logger.error('Failed to verify Slack connection:', error);
      // 연결 확인 실패해도 진행 (기본 정보로 저장)
    }

    // 데이터베이스에 integration 저장
    const { createOrUpdateIntegration, createIntegration } = await import("../db/mutations");
    
    const integrationResult = await createOrUpdateIntegration(adminClient, {
      workspace_id: workspaceId,
      type: 'slack',
      credential_ref: credentialRef_new,
      connection_status: 'connected',
      metadata: {
        team_id: tokenData.team?.id,
        team_name: tokenData.team?.name,
        bot_user_id: tokenData.bot_user_id,
        authed_user_id: tokenData.authed_user?.id,
        scope: tokenData.scope,
        user_scope: tokenData.authed_user?.scope,
        app_id: tokenData.app_id,
        token_type: tokenData.token_type || 'bot',
        created_at: new Date().toISOString()
      },
      resourceCacheJson: {
        bot: slackInfo?.bot || {
          id: tokenData.bot_user_id,
          user_id: tokenData.bot_user_id,
          user_info: null
        },
        team: slackInfo?.team || {
          id: tokenData.team?.id,
          name: tokenData.team?.name,
          url: null
        },
        channels: slackInfo?.channels || []
      }
    });

    // Secrets Manager에 토큰 저장:
    const { secretsManager } = await import("~/core/lib/secrets-manager.server");
    const storeResult = await secretsManager.storeSecret(credentialRef_new, botToken);
    if (!storeResult.success) {
      return data({status: 'error', error: `Failed to store Slack token: ${storeResult.error}`
      }, { status: 500 });
    }

    if (userToken) {
      const credentialRef_new_user = integrationResult.integration.integration_id;
      await createIntegration(adminClient, {
        workspaceId: workspaceId,
        type: 'slack_user',
        name: `Slack User - ${tokenData.team?.name || 'Unknown'}`,
        credential_ref: credentialRef_new_user,
        config_json: {
          created_at: new Date().toISOString()
        }
      });
      const storeResult_user = await secretsManager.storeSecret(credentialRef_new_user, userToken);
      if (!storeResult_user.success) {
        return data({status: 'error', error: `Failed to store Slack user token: ${storeResult_user.error}`
        }, { status: 500 });
      }
    }

    logger.info('Slack integration 저장 완료:', {
      integrationId: integrationResult.integration.integration_id,
      workspaceId,
      teamName: tokenData.team?.name
    });

    return redirect('/settings/integrations?status=success&message=' + 
      encodeURIComponent(`Slack 연결 완료: ${tokenData.team?.name}`));

  } catch (error: any) {
    logger.error('Slack OAuth 콜백 처리 실패:', error);
    return redirect('/settings/integrations?error=' + 
      encodeURIComponent('Slack 연결 처리 중 오류가 발생했습니다.'));
  }
}
