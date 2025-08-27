
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
  