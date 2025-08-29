import type { SentEmailData } from './types';

// 샘플 보낸 메일 데이터 (MVP용 단순화 - Target 기반)
export const sampleSentEmails: SentEmailData[] = [
  {
    id: '1',
    targetTitle: '개발팀 주간 뉴스레터',
    targetId: 'target_001',
    subject: '2024년 1월 3주차 개발팀 업데이트',
    status: 'delivered',
    sentAt: '2024-01-20T14:30:00Z',
    providerMessageId: 'msg_123456',
  },
  {
    id: '2',
    targetTitle: '마케팅팀 월간 리포트',
    targetId: 'target_002',
    subject: '1월 마케팅 성과 및 2월 계획',
    status: 'delivered',
    sentAt: '2024-01-20T03:00:00Z',
    providerMessageId: 'msg_123457',
  },
  {
    id: '3',
    targetTitle: '신규 사용자 온보딩',
    targetId: 'target_003',
    subject: 'LinkVerse에 오신 것을 환영합니다!',
    status: 'sent',
    sentAt: '2024-01-18T10:00:00Z',
    providerMessageId: 'msg_123458',
  },
  {
    id: '4',
    targetTitle: '보안 알림 리스트',
    targetId: 'target_004',
    subject: '중요: 보안 업데이트 알림',
    status: 'delivered',
    sentAt: '2024-01-17T16:00:00Z',
    providerMessageId: 'msg_123459',
  },
  {
    id: '5',
    targetTitle: '제품 업데이트 구독자',
    targetId: 'target_005',
    subject: '새로운 기능이 출시되었습니다!',
    status: 'delivered',
    sentAt: '2024-01-16T12:00:00Z',
    providerMessageId: 'msg_123460',
  },
  {
    id: '6',
    targetTitle: '고객 지원팀 공지사항',
    targetId: 'target_006',
    subject: '고객 지원 시간 변경 안내',
    status: 'sent',
    sentAt: '2024-01-14T20:00:00Z',
    providerMessageId: 'msg_123461',
  },
  {
    id: '7',
    targetTitle: '이벤트 참가자 명단',
    targetId: 'target_007',
    subject: '2024 개발자 컨퍼런스 안내',
    status: 'failed',
    sentAt: '2024-01-10T08:00:00Z',
    providerMessageId: 'msg_123462',
    failureReason: '메일 서버 연결 실패',
  },
];

// 상태별 필터 옵션 생성 함수 (MVP용 단순화)
export const createStatusFilters = (emails: SentEmailData[]) => [
  { value: 'all', label: '모든 상태', count: emails.length },
  { value: 'sent', label: '발송됨', count: emails.filter(e => e.status === 'sent').length },
  { value: 'delivered', label: '송신 완료', count: emails.filter(e => e.status === 'delivered').length },
  { value: 'failed', label: '송신 실패', count: emails.filter(e => e.status === 'failed').length },
];
