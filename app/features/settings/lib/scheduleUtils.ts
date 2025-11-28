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

// 타임존에서 locale 추출 헬퍼 함수
export function getLocaleFromTimezone(timezone: string): string {
  const timezoneToLocale: Record<string, string> = {
    'Asia/Tokyo': 'ja-JP',
    'Asia/Seoul': 'ko-KR',
    'America/New_York': 'en-US',
    'America/Los_Angeles': 'en-US',
    'Europe/London': 'en-GB',
    'Europe/Paris': 'fr-FR',
    'Europe/Berlin': 'de-DE',
    'Australia/Sydney': 'en-AU',
  };
  
  // 매핑된 locale이 있으면 사용, 없으면 timezone 기반 추론
  if (timezoneToLocale[timezone]) {
    return timezoneToLocale[timezone];
  }
  
  // Asia/Seoul → ko-KR, America/New_York → en-US 형식으로 추론
  const region = timezone.split('/')[0];
  if (region === 'Asia') return 'ko-KR';
  if (region === 'America') return 'en-US';
  if (region === 'Europe') return 'en-GB';
  
  return 'ko-KR'; // 기본값
}

// 마지막 발송 시각 포맷 함수 (hydration-safe)
export function formatLastSent(
  lastSentAt?: string, 
  timezone: string = 'Asia/Tokyo',
  t?: (key: string, options?: any) => string
): string {
  if (!lastSentAt) return t ? t("time.notSent") : "Not sent";
  
  const date = new Date(lastSentAt);
  const locale = getLocaleFromTimezone(timezone);

  // 클라이언트에서만 상대적 시간 계산 (hydration mismatch 방지)
  if (typeof window !== 'undefined') {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 60) {
      return t ? t("time.minutesAgo", { count: diffInMinutes }) : `${diffInMinutes} min ago`;
    } else if (diffInHours < 24) {
      return t ? t("time.hoursAgo", { count: diffInHours }) : `${diffInHours} hours ago`;
    } else if (diffInDays < 7) {
      return t ? t("time.daysAgo", { count: diffInDays }) : `${diffInDays} days ago`;
    }
  }
  
  // 서버에서는 지정된 타임존으로 절대 날짜 표시
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: timezone
  });
};

// 스케줄 표시용 포맷 함수 (MVP: weekly만 지원)
export function formatSchedule(cron?: string, t?: (key: string, options?: any) => string): string {
  if (!cron) return t ? t("schedule.manual") : "Manual send";
  
  // 간단한 cron 문자열 해석
  const parts = cron.split(' ');
  if (parts.length !== 5) return cron;
  
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  const hourNum = parseInt(hour);
  const nextHour = (hourNum + 1) % 24;
  
  const timeRange = t 
    ? t("schedule.timeRange", { start: hourNum, end: nextHour })
    : `${hourNum}~${nextHour}`;
  
  // MVP: weekly 스케줄
  if (dayOfWeek !== '*' && dayOfMonth === '*') {
    const dayIndex = parseInt(dayOfWeek);
    if (t) {
      const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = t(`schedule.daysOfWeek.${dayKeys[dayIndex]}`);
      return t("schedule.weeklyFormat", { day: dayName, time: timeRange });
    } else {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `Every ${days[dayIndex]} ${timeRange}`;
    }
  }
  
  // 🚀 향후 지원 예정
  // daily 스케줄
  if (dayOfMonth === '*' && dayOfWeek === '*') {
    const comingSoon = t ? t("schedule.comingSoon") : "(Coming soon)";
    if (t) {
      return `${t("schedule.dailyFormat", { time: timeRange })} ${comingSoon}`;
    } else {
      return `Daily ${timeRange} ${comingSoon}`;
    }
  }
  
  // monthly 스케줄
  if (dayOfMonth !== '*' && dayOfWeek === '*') {
    const comingSoon = t ? t("schedule.comingSoon") : "(Coming soon)";
    if (t) {
      return `${t("schedule.monthlyFormat", { day: dayOfMonth, time: timeRange })} ${comingSoon}`;
    } else {
      return `Monthly ${dayOfMonth}th ${timeRange} ${comingSoon}`;
    }
  }
  
  // custom이나 알 수 없는 형식
  const comingSoon = t ? t("schedule.comingSoon") : "(Coming soon)";
  return `${cron} ${comingSoon}`;
};


// 다음 발송 예정 시각 계산 함수
export const getNextScheduledTime = (cronExpression?: string): Date | null => {
  if (!cronExpression) return null;
  
  const now = new Date();
  const parts = cronExpression.split(' ');
  if (parts.length !== 5) return null;
  
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts.map(p => p === '*' ? -1 : parseInt(p));
  
  // 다음 스케줄 계산 (간단한 구현)
  const nextDate = new Date(now);
  
  if (dayOfWeek !== -1 && dayOfMonth === -1) {
    // 주간 스케줄
    const currentDay = nextDate.getDay();
    const targetDay = dayOfWeek === 0 ? 7 : dayOfWeek; // 일요일을 7로 변환
    const currentDayAdjusted = currentDay === 0 ? 7 : currentDay;
    
    let daysUntilTarget = targetDay - currentDayAdjusted;
    if (daysUntilTarget <= 0 || (daysUntilTarget === 0 && (nextDate.getHours() > hour || (nextDate.getHours() === hour && nextDate.getMinutes() >= minute)))) {
      daysUntilTarget += 7;
    }
    
    nextDate.setDate(nextDate.getDate() + daysUntilTarget);
    nextDate.setHours(hour, minute, 0, 0);
  } else if (dayOfMonth !== -1 && dayOfWeek === -1) {
    // 월간 스케줄
    nextDate.setDate(dayOfMonth);
    nextDate.setHours(hour, minute, 0, 0);
    
    if (nextDate <= now) {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
  } else {
    // 일간 스케줄
    nextDate.setHours(hour, minute, 0, 0);
    
    if (nextDate <= now) {
      nextDate.setDate(nextDate.getDate() + 1);
    }
  }

  return nextDate;
};

 // 시간 차이를 지역 언어로 포맷
export const formatTimeUntil = (targetDate: Date, t: (key: string) => string, tCommon: (key: string) => string): string => {
  const now = new Date();
  const diffInMs = targetDate.getTime() - now.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInDays > 0) {
    return `${diffInDays} ${t("day")} ${tCommon("later")}`;
  } else if (diffInHours > 0) {
    return `${diffInHours} ${t("hour")} ${tCommon("later")}`;
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes} ${t("minute")} ${tCommon("later")}`;
  } else {
    return `${tCommon("soonSend")}`;
  }
};
