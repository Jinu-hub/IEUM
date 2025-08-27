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