
// UI에서 사용하는 연결 상태 타입
export type ConnectionStatus = 
    'connected' 
    | 'disconnected' 
    | 'connecting' 
    | 'disconnecting'
    | 'unauthorized';

// DB에서 사용하는 연결 상태 타입 (Supabase enum과 매칭)
export type DBConnectionStatus = 
    'connected'
    | 'disconnected'
    | 'expired'
    | 'revoked'
    | 'unauthorized'
    | 'error'
    | 'never';

// DB 상태를 UI 상태로 변환하는 함수
export function mapDBStatusToUI(dbStatus: DBConnectionStatus | null | undefined): ConnectionStatus {
    switch (dbStatus) {
        case 'connected':
            return 'connected';
        case 'expired':
        case 'revoked':
        case 'unauthorized':
        case 'error':
        case 'never':
        case null:
        case undefined:
        default:
            return 'disconnected';
    }
}

// 타겟 데이터의 타입 정의
export interface TargetData {
    targetId: string; // 새 target 생성 시에는 undefined 가능
    category: string;
    displayName: string;
    isActive: boolean;
    isMemberMail?: boolean;
    scheduleCron?: string;
    scheduleHour?: string;
    lastSentAt?: string | null;
    mailingListName?: string;
    mailingListId?: string;
    timezone: string;
    language: string;
  }

// 인테그레이션 소스 타입
export interface IntegrationSource {
    id: string;
    integrationId: string;
    integrationType: string; // integration type을 저장 ('github', 'slack' 등)
    sourceType: string; // 'github_repo' | 'slack_channel'
    sourceIdent: string; // repo name or channel name
    isMemberMail: boolean;
}

// 메일 리스트 데이터 타입
export interface MailListData {
    mailingListId: string;
    workspaceId: string;
    name: string;
    description?: string;
    createdAt: string;
    memberCount?: number; // 멤버 수 (계산된 값)
}

// 메일 리스트 멤버 데이터 타입
export interface MailListMemberData {
    mailingListId: string;
    email: string;
    displayName?: string;
    metaJson: Record<string, any>;
    createdAt: string;
}
  
/**
 * スケジュールタイプのオプションを取得する関数（i18n対応）
 * MVP: weekly のみサポート、今後 daily, monthly, custom 追加予定
 * @param t - 翻訳関数
 * @returns スケジュールタイプのオプション配列
 */
export const getScheduleTypes = (t: (key: string) => string) => [
  { value: 'weekly', label: t('schedule.weekly') },
  // 🚀 今後サポート予定
  // { value: 'manual', label: t('schedule.manual') },
  // { value: 'daily', label: t('schedule.daily') },
  // { value: 'monthly', label: t('schedule.monthly') },
  // { value: 'custom', label: t('schedule.custom') },
];

/**
 * 曜日オプションを取得する関数（i18n対応）
 * @param t - 翻訳関数
 * @returns 曜日オプション配列
 */
export const getWeekdays = (t: (key: string) => string) => [
  { value: '1', label: t('schedule.daysOfWeek.monday') },
  { value: '2', label: t('schedule.daysOfWeek.tuesday') },
  { value: '3', label: t('schedule.daysOfWeek.wednesday') },
  { value: '4', label: t('schedule.daysOfWeek.thursday') },
  { value: '5', label: t('schedule.daysOfWeek.friday') },
  { value: '6', label: t('schedule.daysOfWeek.saturday') },
  { value: '0', label: t('schedule.daysOfWeek.sunday') },
];

/**
 * 時間オプションを取得する関数（i18n対応）
 * @param t - 翻訳関数
 * @returns 時間オプション配列（24時間形式）
 */
export const getHours = (t: (key: string) => string) => 
  Array.from({ length: 24 }, (_, i) => ({
    value: i.toString(),
    label: `${i.toString().padStart(2, '0')}${t('hour')}`
  }));

/**
 * 分オプションを取得する関数（i18n対応）
 * @param t - 翻訳関数
 * @returns 分オプション配列（15分単位）
 */
export const getMinutes = (t: (key: string) => string) => 
  Array.from({ length: 4 }, (_, i) => ({
    value: (i * 15).toString(),
    label: `${(i * 15).toString().padStart(2, '0')}${t('minute')}`
  }));

/**
 * 月の日付オプションを取得する関数（i18n対応）
 * @param t - 翻訳関数
 * @returns 日付オプション配列
 */
export const getMonthDays = (t: (key: string) => string) => 
  Array.from({ length: 28 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `${i + 1}${t('day')}`
  }));

/**
 * 後方互換性のための定数（非推奨）
 * @deprecated getScheduleTypes関数を使用してください
 */
export const scheduleTypes = [
  { value: 'manual', label: 'Manual send' },
  { value: 'weekly', label: 'Weekly' },
];

/**
 * 後方互換性のための定数（非推奨）
 * @deprecated getWeekdays関数を使用してください
 */
export const weekdays = [
  { value: '1', label: 'Mon' },
  { value: '2', label: 'Tue' },
  { value: '3', label: 'Wed' },
  { value: '4', label: 'Thu' },
  { value: '5', label: 'Fri' },
  { value: '6', label: 'Sat' },
  { value: '0', label: 'Sun' },
];

/**
 * 後方互換性のための定数（非推奨）
 * @deprecated getHours関数を使用してください
 */
export const hours = Array.from({ length: 24 }, (_, i) => ({
  value: i.toString(),
  label: `${i.toString().padStart(2, '0')}h`
}));

/**
 * 後方互換性のための定数（非推奨）
 * @deprecated getMinutes関数を使用してください
 */
export const minutes = Array.from({ length: 4 }, (_, i) => ({
  value: (i * 15).toString(),
  label: `${(i * 15).toString().padStart(2, '0')}m`
}));

/**
 * 後方互換性のための定数（非推奨）
 * @deprecated getMonthDays関数を使用してください
 */
export const monthDays = Array.from({ length: 28 }, (_, i) => ({
  value: (i + 1).toString(),
  label: `${i + 1}th`
}));