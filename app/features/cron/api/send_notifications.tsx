import { createSlackClient } from "~/core/integrations/slack/client";
import { logger } from "~/core/lib/logger";
import { getSlackBotToken } from "~/core/lib/secrets-manager.server";
import adminClient from "~/core/lib/supa-admin-client.server";
import type { CreateContentsInput } from "~/core/lib/types";
import { getIntegrationsInfo, getTargetSources } from "~/features/settings/db/queries";
import { matchSourcesToIntegrations } from "./source-matching";

/** 호출 측에서 이미 보유한 경우 전달하여 중복 조회를 줄일 수 있습니다 */
export type SendSlackNotificationOptions = {
  integrationsInfo: Array<{
    type: string | null;
    connection_status?: string | null;
    credential_ref?: string | null;
    resource_cache_json?: unknown;
  }>;
  matchedChannels: string[];
};

/**
 * 뉴스레터 발송 완료 후 Slack 채널에 알림 메시지를 전송합니다.
 * options를 넘기면 integrationsInfo·matchedChannels를 재조회하지 않습니다.
 * chat:write 스코프가 있어야 전송되며, 실패 시 로그만 남기고 예외를 던지지 않습니다.
 */
export async function sendSlackNotification(
  input: CreateContentsInput,
  targetDisplayName: string,
  _contents: { finalContents: string; htmlContents: string },
  options?: SendSlackNotificationOptions
): Promise<void> {

  if (!input.enableCreateContents?.slack || options?.matchedChannels.length === 0) {
    return;
  }

  try {
    let integrationsInfo = options?.integrationsInfo;
    let matchedChannels = options?.matchedChannels;

    if (!integrationsInfo || !matchedChannels) {
      integrationsInfo = await getIntegrationsInfo(adminClient, {
        workspaceId: input.workspaceId,
      });
      const slackIntegration = integrationsInfo?.find(
        (integration: { type: string | null; connection_status?: string | null }) =>
          integration.type === "slack" && integration.connection_status === "connected"
      );
      if (!slackIntegration) {
        logger.info("Slack not connected for workspace, skipping Slack notification", {
          workspaceId: input.workspaceId,
        });
        return;
      }
      const sources = await getTargetSources(adminClient, {
        workspaceId: input.workspaceId,
        targetId: input.targetId,
      });
      const slackData = integrationsInfo?.find(
        (integration: { type: string | null }) => integration.type === "slack"
      )?.resource_cache_json as { channels?: Array<{ id: string; name: string }> } | undefined;
      const githubData = integrationsInfo?.find(
        (integration: { type: string | null }) => integration.type === "github"
      )?.resource_cache_json;
      const matched = matchSourcesToIntegrations(
        sources,
        integrationsInfo ?? [],
        githubData ?? null,
        slackData ?? null
      );
      matchedChannels = matched.matchedChannels;
    }

    if (matchedChannels.length === 0) {
      logger.info("No Slack channels matched for target, skipping Slack notification", {
        targetId: input.targetId,
      });
      return;
    }

    const slackIntegration = integrationsInfo?.find(
      (integration: { type: string | null; connection_status?: string | null }) =>
        integration.type === "slack" && integration.connection_status === "connected"
    );
    if (!slackIntegration) {
      logger.info("Slack not connected for workspace, skipping Slack notification", {
        workspaceId: input.workspaceId,
      });
      return;
    }

    const credentialRef = (slackIntegration as { credential_ref?: string | null })
      ?.credential_ref ?? undefined;
    const slackToken = await getSlackBotToken(credentialRef ?? undefined);
    if (!slackToken) {
      logger.warn("Slack bot token not found, skipping Slack notification", {
        workspaceId: input.workspaceId,
      });
      return;
    }

    const slackData = integrationsInfo?.find(
      (integration: { type: string | null }) => integration.type === "slack"
    )?.resource_cache_json as { channels?: Array<{ id: string; name: string }> } | undefined;
    const channelIdToName =
      slackData?.channels?.reduce(
        (acc: Record<string, string>, ch: { id: string; name: string }) => {
          acc[ch.id] = ch.name;
          return acc;
        },
        {}
      ) ?? {};

    const slack = createSlackClient(slackToken);
    const preview =
      _contents.finalContents.length > 200
        ? _contents.finalContents.slice(0, 200) + "..."
        : _contents.finalContents;
    const notificationMessage =
      `✅ *Newsletter sent*\n\n` +
      `• Target: ${targetDisplayName}\n` +
      `• Preview: ${preview}\n\n` +
      `🔗 Check the IEUM dashboard or email for details.`;

    for (const channelId of matchedChannels) {
      try {
        const postResult = await slack.chat.postMessage({
          channel: channelId,
          text: notificationMessage,
          unfurl_links: false,
          unfurl_media: false,
        });

        if (postResult.ok) {
          const channelName = channelIdToName[channelId] ?? channelId;
          logger.info(`Slack notification sent to #${channelName} (${channelId})`);
        } else {
          logger.warn(`Slack notification failed for channel ${channelId}: ${postResult.error}`);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Error sending Slack notification to channel ${channelId}`, {
          error: message,
        });
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("sendSlackNotification error", { error: message, workspaceId: input.workspaceId });
    // 알림 실패로 전체 플로우를 실패시키지 않음
  }
}
