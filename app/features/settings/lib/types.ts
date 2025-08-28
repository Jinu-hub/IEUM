
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
  