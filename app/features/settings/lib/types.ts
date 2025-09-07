
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
    targetId: string;
    displayName: string;
    isActive: boolean;
    scheduleCron?: string;
    lastSentAt?: string;
    mailingListName?: string;
    timezone: string;
  }

// 인테그레이션 소스 타입
export interface IntegrationSource {
    id: string;
    integrationId: string;
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
  