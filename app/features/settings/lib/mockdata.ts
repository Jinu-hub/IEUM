import type { TargetData } from "../lib/types";

// 샘플 데이터
export const sampleTargets: TargetData[] = [
    {
      targetId: "1",
      displayName: "주간 기술 뉴스",
      isActive: true,
      scheduleCron: "0 9 * * 1", // 매주 월요일 9시
      lastSentAt: "2025-01-13T09:00:00Z",
      mailingListName: "Tech Newsletter",
      timezone: "Asia/Seoul"
    },
    {
      targetId: "2",
      displayName: "월간 제품 업데이트",
      isActive: true,
      scheduleCron: "0 10 1 * *", // 매월 1일 10시
      lastSentAt: "2025-01-01T10:00:00Z",
      mailingListName: "Product Updates",
      timezone: "Asia/Seoul"
    },
    {
      targetId: "3",
      displayName: "긴급 공지사항",
      isActive: false,
      scheduleCron: undefined,
      lastSentAt: "2024-12-15T14:30:00Z",
      mailingListName: "Emergency Alerts",
      timezone: "Asia/Seoul"
    }
  ];

  // 메일링 리스트 샘플 데이터
export const sampleMailingLists = [
    { id: '1', name: 'Tech Newsletter' },
    { id: '2', name: 'Product Updates' },
    { id: '3', name: 'Emergency Alerts' },
    { id: '4', name: 'Weekly Digest' },
  ];
  
  // 인테그레이션 샘플 데이터
  export const sampleIntegrations = [
    { id: '1', name: 'GitHub', type: 'github' },
    { id: '2', name: 'Slack', type: 'slack' },
  ];
  
  // GitHub 레포지토리 샘플 데이터
  export const sampleGitHubRepos = [
    { id: '1', name: 'facebook/react' },
    { id: '2', name: 'microsoft/vscode' },
    { id: '3', name: 'vercel/next.js' },
  ];
  
  // Slack 채널 샘플 데이터
  export const sampleSlackChannels = [
    { id: '1', name: '#general' },
    { id: '2', name: '#development' },
    { id: '3', name: '#announcements' },
  ];
  
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