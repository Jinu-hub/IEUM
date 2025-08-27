
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
  