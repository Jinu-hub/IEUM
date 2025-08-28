/**
 * Settings 페이지에서 공통으로 사용하는 유틸리티 함수들
 */

// 연결된 인테그레이션 타입
export interface ConnectedIntegration {
  id: string;
  name: string;
  type: 'github' | 'slack';
  status: 'connected' | 'disconnected';
  data?: any;
}

// GitHub 레포지토리 타입
export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description?: string;
  html_url: string;
  language?: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  relationship: 'owner' | 'collaborator';
}

// Slack 채널 타입
export interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  is_member: boolean;
  topic?: {
    value: string;
  };
  purpose?: {
    value: string;
  };
}

// 소스 아이템 타입 (UI 표시용)
export interface SourceItem {
  id: string;
  name: string;
  description?: string;
  url?: string;
  icon?: React.ReactNode;
  variant?: 'success' | 'warning' | 'secondary';
}

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
 * GitHub fetcher 응답을 처리하는 헬퍼 함수
 */
export function handleGitHubFetcherResponse(
  fetcherData: any,
  setStatus: (status: 'connected' | 'disconnected') => void,
  setData: (data: any) => void
) {
  if (fetcherData) {
    const { status, data, error, message } = fetcherData;
    
    if (status === 'success') {
      if (data) {
        setStatus(data.connected ? 'connected' : 'disconnected');
        setData(data);
      } else {
        setStatus('disconnected');
        setData(null);
      }
      if (message) {
        console.log(message);
      }
    } else {
      setStatus('disconnected');
      console.error('GitHub 요청 실패:', error);
    }
  }
}

/**
 * Slack fetcher 응답을 처리하는 헬퍼 함수
 */
export function handleSlackFetcherResponse(
  fetcherData: any,
  setStatus: (status: 'connected' | 'disconnected') => void,
  setData: (data: any) => void
) {
  if (fetcherData) {
    const { status, data, error, message } = fetcherData;
    
    if (status === 'success') {
      if (data) {
        setStatus(data.connected ? 'connected' : 'disconnected');
        setData(data);
      } else {
        setStatus('disconnected');
        setData(null);
      }
      if (message) {
        console.log(message);
      }
    } else {
      setStatus('disconnected');
      console.error('Slack 요청 실패:', error);
    }
  }
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
export function getSourceTypeLabel(integrationType: 'github' | 'slack'): string {
  switch (integrationType) {
    case 'github':
      return '레포지토리';
    case 'slack':
      return '채널';
    default:
      return '소스';
  }
}

// 날짜 포맷 함수
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays < 7) {
    return `${diffInDays}일 전`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks}주 전`;
  } else {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
};

// 날짜 포맷 함수
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays < 1) {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    return diffInHours < 1 ? '방금 전' : `${diffInHours}시간 전`;
  } else if (diffInDays < 7) {
    return `${diffInDays}일 전`;
  } else {
    return date.toLocaleDateString('ko-KR', {
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

// 소스 라벨 함수
export function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    'signup_form': '가입 폼',
    'import': '가져오기',
    'api': 'API',
    'manual': '수동 추가'
  };
  return labels[source] || source;
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