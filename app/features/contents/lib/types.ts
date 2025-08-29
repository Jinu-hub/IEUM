// 메일 상태 타입 정의 (MVP용 단순화)
export type EmailStatus = 'sent' | 'delivered' | 'failed';

// 메일 데이터 타입 (MVP용 단순화)
export interface SentEmailData {
  id: string;
  targetTitle: string; // Target의 타이틀 (예: "개발팀 주간 뉴스레터")
  targetId?: string; // Target ID (선택사항)
  subject: string;
  status: EmailStatus;
  sentAt: string;
  providerMessageId?: string;
  failureReason?: string; // 실패 시 이유
  archiveUrl?: string; // 아카이브 링크 (옵션)
}

// 메일 통계 타입 (MVP용 단순화)
export interface EmailStats {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  deliveryRate: number; // 배송 성공률
}

// 필터 옵션 타입
export interface StatusFilter {
  value: string;
  label: string;
  count: number;
}
