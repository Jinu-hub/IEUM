import { type PlanType } from "~/core/lib/constants";
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

/**
 * 플랜별 설정가능 타깃 소스 제한
 * @param planType - プランタイプ
 * @returns 각 소스 타입별 제한 수
 */
export function getAvailableTargetSources(planType: PlanType = 'free'): {
  gitrepo: number;
  slackChannel: number;
} {
  switch (planType) {
    case 'trial':
    case 'free':
    case 'starter':
      return {
        gitrepo: 1,
        slackChannel: 3
      };
    case 'pro':
      return {
        gitrepo: 2,
        slackChannel: 5
      };
    case 'enterprise':
      // Enterpriseプランは制限なし（または大きな数値）
      return {
        gitrepo: 999,
        slackChannel: 999
      };
  }
}

/**
 * 소스 추가 시 제한 체크
 * @param integrationSources - 현재 추가된 소스 목록
 * @param newSource - 추가하려는 새 소스
 * @param planType - プランタイプ
 * @param targetSourcePolicy - DB에서 가져온 타겟 소스 정책 배열（オプション）
 * @param t - 翻訳関数（オプション）
 * @returns 제한 초과 여부와 에러 메시지
 */
export function checkSourceLimit(
  integrationSources: Array<{ integrationType: string; sourceType: string }>,
  newSource: { integrationType: string; sourceType: string },
  planType: PlanType = 'free',
  targetSourcePolicy?: Array<{ source_type: string; max_count: number | null }> | null,
  t?: (key: string, options?: { count?: number }) => string
): { isValid: boolean; errorMessage?: string } {
  // DB에서 가져온 정책이 있으면 사용, 없으면 기본값 사용
  let gitrepoLimit: number;
  let slackChannelLimit: number;
  
  if (targetSourcePolicy && targetSourcePolicy.length > 0) {
    // DB에서 정책을 찾아서 사용
    const githubRepoPolicy = targetSourcePolicy.find(p => p.source_type === 'github_repo');
    const slackChannelPolicy = targetSourcePolicy.find(p => p.source_type === 'slack_channel');
    
    gitrepoLimit = githubRepoPolicy?.max_count !== null && githubRepoPolicy?.max_count !== undefined
      ? githubRepoPolicy.max_count
      : githubRepoPolicy?.max_count === null
      ? 999 // null = unlimited
      : getAvailableTargetSources(planType).gitrepo;
    
    slackChannelLimit = slackChannelPolicy?.max_count !== null && slackChannelPolicy?.max_count !== undefined
      ? slackChannelPolicy.max_count
      : slackChannelPolicy?.max_count === null
      ? 999 // null = unlimited
      : getAvailableTargetSources(planType).slackChannel;
  } else {
    // DB에 정책이 설정되지 않은 경우、기본값 사용
    const limits = getAvailableTargetSources(planType);
    gitrepoLimit = limits.gitrepo;
    slackChannelLimit = limits.slackChannel;
  }
  
  // 현재 소스 개수 계산
  const currentGithubRepos = integrationSources.filter(
    s => s.integrationType === 'github' && s.sourceType === 'github_repo'
  ).length;
  const currentSlackChannels = integrationSources.filter(
    s => s.integrationType === 'slack' && s.sourceType === 'slack_channel'
  ).length;
  
  // 새 소스 타입 확인
  if (newSource.integrationType === 'github' && newSource.sourceType === 'github_repo') {
    if (currentGithubRepos >= gitrepoLimit) {
      const errorMessage = t 
        ? t('detail.githubRepoLimitReached', { count: gitrepoLimit })
        : `GitHub repository limit reached. Maximum ${gitrepoLimit} per target.`;
      return {
        isValid: false,
        errorMessage
      };
    }
  } else if (newSource.integrationType === 'slack' && newSource.sourceType === 'slack_channel') {
    if (currentSlackChannels >= slackChannelLimit) {
      const errorMessage = t
        ? t('detail.slackChannelLimitReached', { count: slackChannelLimit })
        : `Slack channel limit reached. Maximum ${slackChannelLimit} per target.`;
      return {
        isValid: false,
        errorMessage
      };
    }
  }
  
  return { isValid: true };
}

/**
 * 플랜별 설정가능 타겟 수 제한
 * @param planType - プランタイプ
 * @returns 타겟 수 제한
 */
export function getAvailableTargetLimit(planType: PlanType = 'free'): number {
  switch (planType) {
    case 'trial':
      return 1;
    case 'free':
      return 1;
    case 'starter':
      return 3;
    case 'pro':
      return 10;
    case 'enterprise':
      // Enterpriseプランは制限なし（または大きな数値）
      return 999;
  }
}

/**
 * 타겟 추가 시 제한 체크
 * @param currentTargetCount - 현재 타겟 개수
 * @param planType - プランタイプ
 * @param planLimits - DB에서 가져온 플랜 제한 정보（オプション）
 * @param t - 翻訳関数（オプション）
 * @returns 제한 초과 여부와 에러 메시지
 */
export function checkTargetLimit(
  currentTargetCount: number,
  planType: PlanType = 'free',
  planLimits?: { max_targets: number | null } | null,
  t?: (key: string, options?: { count?: number }) => string
): { isValid: boolean; errorMessage?: string } {
  // DB에서 가져온 제한 값이 있으면 사용, 없으면 기본값 사용
  let limit: number;
  if (planLimits?.max_targets !== null && planLimits?.max_targets !== undefined) {
    // DB에 제한 값이 설정된 경우
    limit = planLimits.max_targets;
  } else if (planLimits?.max_targets === null) {
    // null = unlimited の場合は大きな数値を設定
    limit = 999;
  } else {
    // DB에 제한이 설정되지 않은 경우、기본값 사용
    limit = getAvailableTargetLimit(planType);
  }
  
  if (currentTargetCount >= limit) {
    // トライアル期間の場合は特別なメッセージを表示
    if (planType === 'trial') {
      const errorMessage = t 
        ? t('targetLimitReachedTrial', { count: limit })
        : `You are currently in the trial period, so you can only set up ${limit} target.`;
      return {
        isValid: false,
        errorMessage
      };
    }
    
    const errorMessage = t 
      ? t('targetLimitReached', { count: limit })
      : `Target limit reached. Maximum ${limit} targets allowed.`;
    return {
      isValid: false,
      errorMessage
    };
  }
  
  return { isValid: true };
}