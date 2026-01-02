import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { MAIL_STATUS } from '~/core/lib/constants';
import type { SentEmailData } from './types';

// 시간 포맷팅 함수
export const formatTime = (dateString: string, tCommon: (key: string) => string, tTimes: (key: string) => string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    return `${diffInMinutes} ${tTimes("minute")} ${tCommon("ago")}`;
  } else if (diffInHours < 24) {
    return `${diffInHours} ${tTimes("hour")} ${tCommon("ago")}`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} ${tTimes("day")} ${tCommon("ago")}`;
  }
};

// 상세한 시간 포맷팅 (년-월-일 시:분)
export const formatDetailedTime = (dateString: string, locale: string = 'ko-KR') => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

// 이메일 상태별 설정 가져오기 (MVP용 단순화)
export const getStatusConfig = (status: typeof MAIL_STATUS[number], t: (key: string) => string) => {
  switch (status) {
    case 'sending':
      return {
        icon: Clock,
        label: t("mail.status.sending"),
        variant: 'info' as const,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-950',
      };
    case 'delivered':
      return {
        icon: CheckCircle,
        label: t("mail.status.delivered"),
        variant: 'success' as const,
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-950',
      };
    case 'failed':
      return {
        icon: XCircle,
        label: t("mail.status.failed"),
        variant: 'error' as const,
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-950',
      };
    case 'partial':
      return {
        icon: AlertCircle,
        label: t("mail.status.partial"),
        variant: 'warning' as const,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950',
      };
    default:
      // Fallback for unexpected status
      return {
        icon: Clock,
        label: t("mail.status.unknown") || 'Unknown',
        variant: 'default' as const,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50 dark:bg-gray-950',
      };
  }
};

// 상태별 필터 옵션 생성 함수 (MVP용 단순화)
export const createStatusFilters = (emails: SentEmailData[], t: (key: string) => string) => [
  { value: 'all', label: t('allStatus'), count: emails.length },
  { value: 'partial', label: t('mail.status.partial'), count: emails.filter(e => e.status === 'partial').length },
  { value: 'delivered', label: t('mail.status.delivered'), count: emails.filter(e => e.status === 'delivered').length },
  { value: 'failed', label: t('mail.status.failed'), count: emails.filter(e => e.status === 'failed').length },
];

// 송신률 계산 (MVP용)
export const calculateDeliveryRate = (delivered: number, sent: number): number => {
  if (sent === 0) return 0;
  return Math.round((delivered / sent) * 100);
};
