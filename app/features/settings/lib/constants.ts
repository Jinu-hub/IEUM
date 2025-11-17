import { z } from "zod";
import type { CategoryType } from "~/core/lib/constants";
import type { ConnectionStatus, DBConnectionStatus } from "./types";


// 통합 서비스 정보 타입
export interface IntegrationService {
    type: string;
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
  
/**
 * 카테고리 타입별 화면 표시 라벨
 */
export const CATEGORY_LABELS: Record<CategoryType, string> = {
  development: '개발',
  infrastructure: '인프라/DevOps',
  qa: 'QA/테스트',
  data_ai: '데이터/AI',
  product: '기획/PM',
  design: 'UX/UI',
  operations: '운영',
  communication: '커뮤니케이션/공지',
  community: '친목/문화',
  learning: '학습/교육',
  business: '영업/마케팅',
  finance: '재무',
  hr: '인사',
  okr: '전략/성과',
  personal: '개인 요약',
  fun: 'Fun Corner',
} as const;

/**
 * 카테고리 타입으로부터 화면 표시 라벨을 가져옵니다.
 * @param category - 카테고리 타입
 * @returns 화면 표시 라벨
 */
export function getCategoryLabel(category: CategoryType | string | undefined | null): string {
  if (!category) return '';
  return CATEGORY_LABELS[category as CategoryType] || category;
}

/**
 * Mail List User Schema
 */
export const mailListUserSchema = z.object({
  workspaceId: z.string(),
  actionType: z.enum(['mailListMemberSave']),
  mailingListId: z.string(),
  email: z.string()
  .min(1, "이메일을 입력해주세요")
  .refine(
    (email) => email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    { message: "올바른 이메일 형식이 아닙니다" }
  ),
  displayName: z.string().optional(),
  metaJson: z.string().optional(),
});
