
// UI에서 사용하는 연결 상태 타입
export type ConnectionStatus = 
    'connected' 
    | 'disconnected' 
    | 'connecting' 
    | 'disconnecting';

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
    displayName: string;
    isActive: boolean;
    scheduleCron?: string;
    lastSentAt?: string;
    mailingListName?: string;
    mailingListId?: string;
    timezone: string;
  }

// 인테그레이션 소스 타입
export interface IntegrationSource {
    id: string;
    integrationId: string;
    integrationType: string; // integration type을 저장 ('github', 'slack' 등)
    sourceType: string; // 'github_repo' | 'slack_channel'
    sourceIdent: string; // repo name or channel name
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
  
// 스케줄 타입
export const scheduleTypes = [
    { value: 'manual', label: '수동 발송' },
    { value: 'daily', label: '매일' },
    { value: 'weekly', label: '매주' },
    { value: 'monthly', label: '매월' },
    { value: 'custom', label: '직접 입력 (Cron)' },
  ];
  
  // 요일 옵션
  export const weekdays = [
    { value: '1', label: '월요일' },
    { value: '2', label: '화요일' },
    { value: '3', label: '수요일' },
    { value: '4', label: '목요일' },
    { value: '5', label: '금요일' },
    { value: '6', label: '토요일' },
    { value: '0', label: '일요일' },
  ];
  
  // 시간 옵션 (24시간 형식)
  export const hours = Array.from({ length: 24 }, (_, i) => ({
    value: i.toString(),
    label: `${i.toString().padStart(2, '0')}시`
  }));
  
  // 분 옵션 (15분 단위)
  export const minutes = Array.from({ length: 4 }, (_, i) => ({
    value: (i * 15).toString(),
    label: `${(i * 15).toString().padStart(2, '0')}분`
  }));
  
  // 월 일자 옵션
  export const monthDays = Array.from({ length: 28 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `${i + 1}일`
  }));