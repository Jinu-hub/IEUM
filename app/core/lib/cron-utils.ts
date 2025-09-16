import { getNextScheduledTime } from "~/features/settings/lib/scheduleUtils";

/**
 * cron 표현식이 유효한지 확인합니다 (간단한 검증)
 * @param cronExpression cron 표현식
 * @returns boolean
 */
export function isValidCronExpression(cronExpression: string): boolean {
  if (!cronExpression || typeof cronExpression !== 'string') return false;
  
  const parts = cronExpression.split(' ');
  if (parts.length !== 5) return false;
  
  // 기본적인 형식 검증
  return parts.every(part => {
    if (part === '*') return true;
    if (/^\d+$/.test(part)) return true; // 숫자
    if (/^\d+,\d+/.test(part)) return true; // 쉼표로 구분된 숫자들
    if (/^\d+-\d+$/.test(part)) return true; // 범위
    if (/^\*\/\d+$/.test(part)) return true; // 스텝
    return false;
  });
}

/**
 * cron 표현식의 다음 실행 시간을 반환합니다 (기존 함수 활용 + 보완)
 * @param cronExpression cron 표현식
 * @returns Date | null
 */
export function getNextCronRun(cronExpression: string): Date | null {
  // 먼저 기존 함수를 시도
  const result = getNextScheduledTime(cronExpression);
  
  // 기존 함수가 유효한 결과를 반환하면 사용
  if (result && result instanceof Date && !isNaN(result.getTime())) {
    return result;
  }
  
  // 기존 함수가 처리하지 못하는 경우 간단한 fallback 구현
  return getNextCronRunFallback(cronExpression);
}

/**
 * 기존 함수가 처리하지 못하는 cron 표현식을 위한 fallback 구현
 */
function getNextCronRunFallback(cronExpression: string): Date | null {
  try {
    const parts = cronExpression.split(' ');
    if (parts.length !== 5) return null;

    const [minute, hour, day, month, dayOfWeek] = parts;
    const now = new Date();
    
    // 현재 시간부터 24시간 내에서 다음 실행 시간을 찾습니다
    for (let i = 0; i < 24 * 60; i++) {
      const testTime = new Date(now.getTime() + i * 60 * 1000);
      
      if (matchesCronExpression(testTime, minute, hour, day, month, dayOfWeek)) {
        return testTime;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error in fallback cron calculation:', error);
    return null;
  }
}

/**
 * 주어진 시간이 cron 표현식과 일치하는지 확인합니다
 */
function matchesCronExpression(
  date: Date, 
  minute: string, 
  hour: string, 
  day: string, 
  month: string, 
  dayOfWeek: string
): boolean {
  const cronMinute = date.getMinutes();
  const cronHour = date.getHours();
  const cronDay = date.getDate();
  const cronMonth = date.getMonth() + 1; // 0-based to 1-based
  const cronDayOfWeek = date.getDay(); // 0 = Sunday

  return (
    matchesField(cronMinute, minute) &&
    matchesField(cronHour, hour) &&
    matchesField(cronDay, day) &&
    matchesField(cronMonth, month) &&
    matchesField(cronDayOfWeek, dayOfWeek)
  );
}

/**
 * 필드 값이 cron 표현식과 일치하는지 확인합니다
 */
function matchesField(value: number, field: string): boolean {
  if (field === '*') return true;
  if (field.includes(',')) {
    return field.split(',').some(v => parseInt(v.trim()) === value);
  }
  if (field.includes('/')) {
    const [range, step] = field.split('/');
    const stepNum = parseInt(step);
    if (range === '*') {
      return value % stepNum === 0;
    }
    // 범위와 스텝 처리 (간단한 구현)
    return value % stepNum === 0;
  }
  if (field.includes('-')) {
    const [start, end] = field.split('-').map(v => parseInt(v));
    return value >= start && value <= end;
  }
  
  return parseInt(field) === value;
}

/**
 * cron 표현식이 현재 시간부터 지정된 시간 내에 실행될지 확인합니다
 * @param cronExpression cron 표현식 (예: "0 0 * * *")
 * @param withinMinutes 몇 분 내에 실행될지 확인할지 (기본값: 60분)
 * @returns boolean
 */
export function isCronScheduledWithinMinutes(
  cronExpression: string, 
  withinMinutes: number = 60
): boolean {
  try {
    const now = new Date();
    const futureTime = new Date(now.getTime() + withinMinutes * 60 * 1000);
    
    const nextRun = getNextCronRun(cronExpression);
    if (!nextRun) return false;
    
    // 다음 실행 시간이 현재 시간과 지정된 시간 사이에 있는지 확인
    return nextRun >= now && nextRun <= futureTime;
  } catch (error) {
    console.error('Invalid cron expression:', cronExpression, error);
    return false;
  }
}

/**
 * 현재 시간부터 1시간 이내에 실행될 cron 스케줄인지 확인합니다
 * @param cronExpression cron 표현식
 * @returns boolean
 */
export function isScheduledWithinHour(cronExpression: string): boolean {
  return isCronScheduledWithinMinutes(cronExpression, 60);
}

/**
 * 테스트용: 현재 시간과 다음 실행 시간을 출력합니다
 * @param cronExpression cron 표현식
 */
export function debugCronSchedule(cronExpression: string): void {
  const now = new Date();
  const nextRun = getNextCronRun(cronExpression);
  const isWithinHour = isScheduledWithinHour(cronExpression);
  
  console.log(`Cron: ${cronExpression}`);
  console.log(`현재 시간: ${now.toISOString()}`);
  
  if (nextRun && nextRun instanceof Date && !isNaN(nextRun.getTime())) {
    console.log(`다음 실행: ${nextRun.toISOString()}`);
  } else {
    console.log(`다음 실행: Invalid (기존 함수에서 처리 불가)`);
  }
  
  console.log(`1시간 이내 실행: ${isWithinHour}`);
  console.log('---');
}
