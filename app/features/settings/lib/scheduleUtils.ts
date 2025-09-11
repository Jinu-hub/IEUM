/**
 * 스케줄 관련 유틸리티 함수들
 */

// 파싱된 스케줄 데이터 타입
export interface ParsedSchedule {
  scheduleType: 'daily' | 'weekly' | 'monthly' | 'custom';
  hour: string;
  minute: string;
  weekday?: string;
  monthDay?: string;
  customCron?: string;
}

/**
 * Cron 표현식을 파싱하여 스케줄 정보로 변환하는 함수
 * 
 * @param cronString - 파싱할 cron 표현식 (예: "0 9 * * 1")
 * @returns 파싱된 스케줄 정보
 * 
 * @example
 * ```typescript
 * const result = parseCronExpression("0 9 * * 1");
 * // { scheduleType: 'weekly', hour: '9', minute: '0', weekday: '1' }
 * 
 * const result2 = parseCronExpression("30 14 15 * *");
 * // { scheduleType: 'monthly', hour: '14', minute: '30', monthDay: '15' }
 * ```
 */
export function parseCronExpression(cronString: string): ParsedSchedule {
  // 기본값 설정
  const defaultResult: ParsedSchedule = {
    scheduleType: 'custom',
    hour: '9',
    minute: '0',
    customCron: cronString
  };

  // 빈 문자열이나 null/undefined 처리
  if (!cronString || typeof cronString !== 'string') {
    return defaultResult;
  }

  // Cron 표현식을 공백으로 분할
  const cronParts = cronString.trim().split(' ');
  
  // 표준 cron 형식 (5개 필드) 확인
  if (cronParts.length === 5) {
    const [minute, hour, dayOfMonth, month, dayOfWeek] = cronParts;
    
    // 기본 시간 정보
    const baseResult = { hour, minute };
    
    // 주간 스케줄: 특정 요일, 매월 (dayOfWeek !== '*' && dayOfMonth === '*')
    if (dayOfWeek !== '*' && dayOfMonth === '*') {
      return {
        ...baseResult,
        scheduleType: 'weekly',
        weekday: dayOfWeek
      };
    }
    
    // 월간 스케줄: 특정 일자, 매주 (dayOfMonth !== '*' && dayOfWeek === '*')
    else if (dayOfMonth !== '*' && dayOfWeek === '*') {
      return {
        ...baseResult,
        scheduleType: 'monthly',
        monthDay: dayOfMonth
      };
    }
    
    // 일간 스케줄: 매일 (dayOfMonth === '*' && dayOfWeek === '*')
    else if (dayOfMonth === '*' && dayOfWeek === '*') {
      return {
        ...baseResult,
        scheduleType: 'daily'
      };
    }
  }
  
  // 위 조건에 해당하지 않으면 커스텀으로 처리
  return defaultResult;
}

/**
 * 스케줄 정보를 기반으로 Cron 표현식을 생성하는 함수
 * 
 * @param schedule - 스케줄 정보
 * @returns 생성된 cron 표현식
 * 
 * @example
 * ```typescript
 * const cron = generateCronExpression({
 *   scheduleType: 'weekly',
 *   hour: '9',
 *   minute: '0',
 *   weekday: '1'
 * });
 * // "0 9 * * 1"
 * ```
 */
export function generateCronExpression(schedule: Partial<ParsedSchedule>): string {
  const { scheduleType, hour = '9', minute = '0', weekday, monthDay, customCron } = schedule;
  
  switch (scheduleType) {
    case 'daily':
      return `${minute} ${hour} * * *`;
      
    case 'weekly':
      return `${minute} ${hour} * * ${weekday || '1'}`;
      
    case 'monthly':
      return `${minute} ${hour} ${monthDay || '1'} * *`;
      
    case 'custom':
      return customCron || `${minute} ${hour} * * *`;
      
    default:
      return `${minute} ${hour} * * *`;
  }
}

/**
 * Cron 표현식의 유효성을 검사하는 함수
 * 
 * @param cronString - 검사할 cron 표현식
 * @returns 유효성 검사 결과
 */
export function validateCronExpression(cronString: string): { isValid: boolean; error?: string } {
  if (!cronString || typeof cronString !== 'string') {
    return { isValid: false, error: 'Cron 표현식이 비어있습니다.' };
  }

  const cronParts = cronString.trim().split(' ');
  
  if (cronParts.length !== 5) {
    return { isValid: false, error: 'Cron 표현식은 5개의 필드를 가져야 합니다.' };
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = cronParts;
  
  // 기본적인 범위 검사
  const minuteNum = parseInt(minute);
  const hourNum = parseInt(hour);
  const dayOfMonthNum = parseInt(dayOfMonth);
  const monthNum = parseInt(month);
  const dayOfWeekNum = parseInt(dayOfWeek);
  
  if (minute !== '*' && (isNaN(minuteNum) || minuteNum < 0 || minuteNum > 59)) {
    return { isValid: false, error: '분은 0-59 범위여야 합니다.' };
  }
  
  if (hour !== '*' && (isNaN(hourNum) || hourNum < 0 || hourNum > 23)) {
    return { isValid: false, error: '시간은 0-23 범위여야 합니다.' };
  }
  
  if (dayOfMonth !== '*' && (isNaN(dayOfMonthNum) || dayOfMonthNum < 1 || dayOfMonthNum > 31)) {
    return { isValid: false, error: '일은 1-31 범위여야 합니다.' };
  }
  
  if (month !== '*' && (isNaN(monthNum) || monthNum < 1 || monthNum > 12)) {
    return { isValid: false, error: '월은 1-12 범위여야 합니다.' };
  }
  
  if (dayOfWeek !== '*' && (isNaN(dayOfWeekNum) || dayOfWeekNum < 0 || dayOfWeekNum > 7)) {
    return { isValid: false, error: '요일은 0-7 범위여야 합니다.' };
  }
  
  return { isValid: true };
}

// 마지막 발송 시각 포맷 함수
export function formatLastSent(lastSentAt?: string): string {
  if (!lastSentAt) return "미발송";
  
  const date = new Date(lastSentAt);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  } else if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  } else if (diffInDays < 7) {
    return `${diffInDays}일 전`;
  } else {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
};

// 스케줄 표시용 포맷 함수
export function formatSchedule(cron?: string): string {
  if (!cron) return "수동 발송";
  
  // 간단한 cron 문자열 해석
  const parts = cron.split(' ');
  if (parts.length !== 5) return cron;
  
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  
  if (dayOfWeek !== '*' && dayOfMonth === '*') {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const dayIndex = parseInt(dayOfWeek);
    return `매주 ${days[dayIndex]}요일 ${hour}:${minute.padStart(2, '0')}`;
  }
  
  if (dayOfMonth !== '*' && dayOfWeek === '*') {
    return `매월 ${dayOfMonth}일 ${hour}:${minute.padStart(2, '0')}`;
  }
  
  return `매일 ${hour}:${minute.padStart(2, '0')}`;
};