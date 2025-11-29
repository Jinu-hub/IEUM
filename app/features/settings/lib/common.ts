import type { ConnectedIntegration, GitHubRepository, SlackChannel, SourceItem } from "./constants";

/**
 * Settings 페이지에서 공통으로 사용하는 유틸리티 함수들
 */

/**
 * API에서 가져온 GitHub 데이터를 SourceItem 배열로 변환
 */
export function transformGitHubReposToSources(repositories: GitHubRepository[]): SourceItem[] {
  return repositories.map(repo => ({
    id: repo.id.toString(),
    name: repo.full_name,
    description: repo.description || `${repo.language || 'Repository'} • ⭐ ${repo.stargazers_count}`,
    url: repo.html_url,
    variant: repo.private ? 'warning' : 'success' as const,
  }));
}

/**
 * API에서 가져온 Slack 데이터를 SourceItem 배열로 변환 (멤버인 채널만)
 */
export function transformSlackChannelsToSources(channels: SlackChannel[]): SourceItem[] {
  return channels
    .filter(channel => channel.is_member) // 멤버인 채널만 필터링
    .map(channel => ({
      id: channel.id,
      name: `#${channel.name}`,
      description: channel.topic?.value || channel.purpose?.value || (channel.is_private ? '비공개 채널' : '공개 채널'),
      variant: 'success' as const,
    }));
}

/**
 * 봇이 초대되지 않은 Slack 채널 목록을 반환
 */
export function getNonMemberSlackChannels(channels: SlackChannel[]): SlackChannel[] {
  return channels.filter(channel => !channel.is_member);
}

/**
 * useFetcher를 사용하여 인테그레이션 데이터를 로드하는 헬퍼 함수
 */
export function loadIntegrationData(
  githubFetcher: any,
  slackFetcher: any,
  onGithubDataUpdate: (data: any) => void,
  onSlackDataUpdate: (data: any) => void
) {
  // GitHub 데이터 로드
  githubFetcher.load('/api/settings/github-integration');
  // Slack 데이터 로드
  slackFetcher.load('/api/settings/slack-integration');
}

/**
 * 연결된 인테그레이션 목록을 생성하는 헬퍼 함수
 */
export function getConnectedIntegrations(
  githubStatus: 'connected' | 'disconnected',
  githubData: any,
  slackStatus: 'connected' | 'disconnected',
  slackData: any
): ConnectedIntegration[] {
  const integrations: ConnectedIntegration[] = [];

  if (githubStatus === 'connected' && githubData) {
    integrations.push({
      id: 'github',
      name: 'GitHub',
      type: 'github',
      status: 'connected',
      data: githubData,
    });
  }

  if (slackStatus === 'connected' && slackData) {
    integrations.push({
      id: 'slack',
      name: 'Slack',
      type: 'slack',
      status: 'connected',
      data: slackData,
    });
  }

  return integrations;
}

/**
 * 선택된 인테그레이션의 소스 목록을 가져오는 함수
 */
export function getSourcesForIntegration(
  integrationId: string,
  connectedIntegrations: ConnectedIntegration[]
): SourceItem[] {
  const integration = connectedIntegrations.find(i => i.id === integrationId);
  
  if (!integration || !integration.data) {
    return [];
  }

  if (integration.type === 'github' && integration.data.repositories) {
    return transformGitHubReposToSources(integration.data.repositories);
  }

  if (integration.type === 'slack' && integration.data.channels) {
    return transformSlackChannelsToSources(integration.data.channels);
  }

  return [];
}

/**
 * 인테그레이션 타입에 따른 소스 타입 라벨을 반환
 */
export function getSourceTypeLabel(integrationType: 'github' | 'slack', t: (key: string) => string): string {
  switch (integrationType) {
    case 'github':
      return t('repository');
    case 'slack':
      return t('channel');
    default:
      return t('source');
  }
}

/**
 * 日付フォーマット関数（i18n対応）
 * @param dateString - 日付文字列
 * @param t - 翻訳関数
 * @param locale - ロケール（デフォルト: 'en-US'）
 * @returns フォーマット済み日付文字列
 */
export function formatDate(
  dateString: string,
  t?: (key: string, options?: any) => string,
  locale: string = 'en-US'
): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays < 7) {
    return t ? t('time.daysAgo', { count: diffInDays }) : `${diffInDays} days ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return t ? t('time.weeksAgo', { count: weeks }) : `${weeks} weeks ago`;
  } else {
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
};

/**
 * 日付フォーマット関数（短縮版、i18n対応）
 * @param dateString - 日付文字列
 * @param t - 翻訳関数
 * @param locale - ロケール（デフォルト: 'en-US'）
 * @returns フォーマット済み日付文字列
 */
export function formatDateShort(
  dateString: string,
  t?: (key: string, options?: any) => string,
  locale: string = 'en-US'
): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays < 1) {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    if (diffInHours < 1) {
      return t ? t('time.justNow') : 'Just now';
    }
    return t ? t('time.hoursAgo', { count: diffInHours }) : `${diffInHours} hours ago`;
  } else if (diffInDays < 7) {
    return t ? t('time.daysAgo', { count: diffInDays }) : `${diffInDays} days ago`;
  } else {
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
};

// 멤버 수 포맷 함수
export function formatMemberCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};

/**
 * ソースラベルを取得する関数（i18n対応）
 * @param source - ソースタイプ
 * @param t - 翻訳関数
 * @returns ソースラベル
 */
export function getSourceLabel(source: string, t?: (key: string) => string): string {
  const sourceMap: Record<string, string> = {
    'signup_form': 'sources.signup_form',
    'import': 'sources.import',
    'api': 'sources.api',
    'manual': 'sources.manual'
  };
  
  if (t && sourceMap[source]) {
    return t(sourceMap[source]);
  }
  
  // 翻訳関数がない場合やマップにない場合は、デフォルト値を返す
  const defaults: Record<string, string> = {
    'signup_form': 'Signup Form',
    'import': 'Import',
    'api': 'API',
    'manual': 'Manual Add'
  };
  
  return defaults[source] || source;
};

// 소스 색상 함수
export function getSourceVariant(source: string): "success" | "info" | "warning" | "secondary" {
  const variants: Record<string, "success" | "info" | "warning" | "secondary"> = {
    'signup_form': 'success',
    'import': 'info', 
    'api': 'warning',
    'manual': 'secondary'
  };
  return variants[source] || 'secondary';
};