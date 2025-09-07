import type { ConnectionStatus, DBConnectionStatus } from "./types";


// 통합 서비스 정보 타입
export interface IntegrationService {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    status: ConnectionStatus;
    features: string[];
    onConnect: () => void;
    onDisconnect: () => void;
    onConfigure?: () => void;
    // DB에서 가져온 추가 정보 (선택적)
    credentialRef?: string;
    connectionStatus?: DBConnectionStatus;
    lastCheckedAt?: string;
    lastOkAt?: string;
    resourceCache?: any;
    connectedAt?: string;
    accessibleRepos?: any;
    accessibleChannels?: any;
  }

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
  
