import type { EmailStatus } from './types';

// 시간 포맷팅 함수
export const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    return `${diffInMinutes}분 전`;
  } else if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}일 전`;
  }
};

// 상세한 시간 포맷팅 (년-월-일 시:분)
export const formatDetailedTime = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

// 이메일 상태별 설정 가져오기 (MVP용 단순화)
export const getStatusConfig = (status: EmailStatus) => {
  switch (status) {
    case 'sent':
      return {
        icon: 'Clock',
        label: '발송됨',
        variant: 'info' as const,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-950',
      };
    case 'delivered':
      return {
        icon: 'CheckCircle',
        label: '송신 완료',
        variant: 'success' as const,
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-950',
      };
    case 'failed':
      return {
        icon: 'XCircle',
        label: '송신 실패',
        variant: 'error' as const,
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-950',
      };
  }
};

// 송신률 계산 (MVP용)
export const calculateDeliveryRate = (delivered: number, sent: number): number => {
  if (sent === 0) return 0;
  return Math.round((delivered / sent) * 100);
};
