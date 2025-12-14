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
    disableConnect?: boolean;
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
/**
 * カテゴリラベルを取得する関数
 * @param t - 翻訳関数
 * @returns カテゴリタイプをキーとしたラベルのマップ
 */
export const getCategoryLabels = (t: (key: string) => string): Record<CategoryType, string> => ({
  development: t('categories.development'),
  infrastructure: t('categories.infrastructure'),
  qa: t('categories.qa'),
  data_ai: t('categories.data_ai'),
  product: t('categories.product'),
  design: t('categories.design'),
  operations: t('categories.operations'),
  communication: t('categories.communication'),
  community: t('categories.community'),
  learning: t('categories.learning'),
  business: t('categories.business'),
  finance: t('categories.finance'),
  hr: t('categories.hr'),
  okr: t('categories.okr'),
  personal: t('categories.personal'),
  fun: t('categories.fun'),
});

/**
 * 後方互換性のための定数 (非推奨)
 * @deprecated getCategoryLabels関数を使用してください
 */
export const CATEGORY_LABELS: Record<CategoryType, string> = {
  development: 'Development',
  infrastructure: 'Infrastructure/DevOps',
  qa: 'QA/Testing',
  data_ai: 'Data/AI',
  product: 'Product/PM',
  design: 'UX/UI',
  operations: 'Operations',
  communication: 'Communication/Announcement',
  community: 'Community/Culture',
  learning: 'Learning/Education',
  business: 'Sales/Marketing',
  finance: 'Finance',
  hr: 'HR',
  okr: 'Strategy/OKR',
  personal: 'Personal Summary',
  fun: 'Fun Corner',
} as const;

/**
 * カテゴリタイプから画面表示ラベルを取得します（i18n対応）
 * @param category - カテゴリタイプ
 * @param t - 翻訳関数
 * @returns 画面表示ラベル
 */
export function getCategoryLabel(
  category: CategoryType | string | undefined | null,
  t?: (key: string) => string
): string {
  if (!category) return '';
  
  if (t) {
    const labels = getCategoryLabels(t);
    return labels[category as CategoryType] || category;
  }
  
  // 翻訳関数が提供されない場合は、後方互換性のためにデフォルト値を使用
  return CATEGORY_LABELS[category as CategoryType] || category;
}

/**
 * Mail List User Schema
 */
export const mailListUserSchema = (errorsT: (key: string) => string) => z.object({ 
  workspaceId: z.string(),
  actionType: z.enum(['mailListMemberSave']),
  mailingListId: z.string(),
  email: z.string()
  .min(1, errorsT("emailRequired"))
  .refine(
    (email) => email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    { message: errorsT("invalidEmail") }
  ),
  displayName: z.string().optional(),
  metaJson: z.string().optional(),
});
