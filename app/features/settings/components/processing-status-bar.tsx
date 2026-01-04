/**
 * Processing Status Bar Component
 * 
 * 뉴스레터 생성 진행 상태를 실시간으로 표시하는 컴포넌트
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NexBadge, NexCard, NexCardContent } from '~/core/components/nex';
import { cn } from '~/core/lib/utils';

type StepStatus = 'collect_data' | 'summarize_data' | 'assemble_data' | 'finalize_data' | 'send_email' | 'error' | 'completed';
type ProcessingStatus = 'running' | 'success' | 'error' | 'completed';

interface ProcessingStatusBarProps {
  runStepId: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
  isOnboarding?: boolean; // 온보딩 중인지 여부
}

const stepOrder: StepStatus[] = ['collect_data', 'summarize_data', 'assemble_data', 'finalize_data', 'send_email'];

// 각 단계별 아이콘
const stepIcons: Record<string, string> = {
  collect_data: '📊',
  summarize_data: '🤖',
  assemble_data: '🔧',
  finalize_data: '✨',
  send_email: '📬',
};

export function ProcessingStatusBar({ runStepId, onComplete, onError, isOnboarding = false }: ProcessingStatusBarProps) {
  const { t } = useTranslation("common", { keyPrefix: "processingStatus" });
  const [currentStep, setCurrentStep] = useState<StepStatus>('collect_data');
  const [status, setStatus] = useState<ProcessingStatus>('running');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!runStepId) return;

    let isMounted = true;
    let pollTimeout: NodeJS.Timeout;
    let errorCount = 0;
    const MAX_ERRORS = 5; // 최대 연속 에러 허용 횟수
    const POLL_INTERVAL = 2000; // 폴링 간격을 2초로 증가 (rate limit 방지)

    const pollStatus = async () => {
      if (!isMounted) return;

      try {
        const response = await fetch(`/api/cron/run-status?runStepId=${runStepId}`);
        const result = await response.json();

        if (!isMounted) return;

        if (result.status === 'success' && result.data) {
          // 성공 시 에러 카운트 리셋
          errorCount = 0;
          setErrorMessage(null);
          const { step, status: stepStatus, errorSummary, finishedAt } = result.data;
          
          setCurrentStep(step as StepStatus);
          
          if (errorSummary) {
            setStatus('error');
            setErrorMessage(errorSummary);
            onError?.(errorSummary);
            return;
          }

          // 완료 체크: send_email 스텝이 성공했거나 finished_at이 있으면 완료
          if ((stepStatus === 'success' && step === 'send_email') || finishedAt) {
            setStatus('completed');
            setTimeout(() => {
              if (isMounted) {
                onComplete?.();
              }
            }, 15000); // 15초 후에 사라지도록 변경
            return;
          }

          // 계속 폴링 (running 또는 success 상태)
          if (stepStatus === 'running' || stepStatus === 'success') {
            pollTimeout = setTimeout(pollStatus, POLL_INTERVAL);
          }
        } else {
          // 에러 발생 시 카운트 증가
          errorCount++;
          
          // rate limit 오류인 경우 더 긴 대기 시간
          const isRateLimit = result.error?.includes('rate') || result.error?.includes('429');
          const retryDelay = isRateLimit ? POLL_INTERVAL * 3 : POLL_INTERVAL;
          
          if (errorCount >= MAX_ERRORS) {
            // 너무 많은 에러 발생 시 중단
            setStatus('error');
            setErrorMessage(result.error || t('retryMessage', { current: errorCount, max: MAX_ERRORS }));
            onError?.(result.error || 'Status check failed');
            return;
          }
          
          // 에러 메시지는 표시하지만 계속 폴링 시도
          setErrorMessage(t('retryMessage', { current: errorCount, max: MAX_ERRORS }));
          pollTimeout = setTimeout(pollStatus, retryDelay);
        }
      } catch (error: any) {
        if (!isMounted) return;
        
        errorCount++;
        const isRateLimit = error.message?.includes('rate') || error.message?.includes('429');
        const retryDelay = isRateLimit ? POLL_INTERVAL * 3 : POLL_INTERVAL;
        
        if (errorCount >= MAX_ERRORS) {
          setStatus('error');
          const errorMsg = error.message || 'Status check failed';
          setErrorMessage(errorMsg);
          onError?.(errorMsg);
          return;
        }
        
        // 에러 발생해도 계속 재시도
        setErrorMessage(t('retryMessage', { current: errorCount, max: MAX_ERRORS }));
        pollTimeout = setTimeout(pollStatus, retryDelay);
      }
    };

    pollStatus();

    return () => {
      isMounted = false;
      if (pollTimeout) {
        clearTimeout(pollTimeout);
      }
    };
  }, [runStepId, onComplete, onError, t]);

  const currentIndex = stepOrder.indexOf(currentStep);
  const progressPercentage = status === 'completed' 
    ? 100 
    : currentIndex >= 0 
      ? Math.max(0, (currentIndex / (stepOrder.length - 1)) * 100)
    : 0;

  // 완료 상태가 아니면 일반 진행 표시
  if (status !== 'completed') {
    return (
      <NexCard 
        variant="outlined" 
        className={cn(
          "mb-4 overflow-hidden border-2",
          status === 'error' 
            ? "border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20" 
            : "border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20"
        )}
      >
        <NexCardContent className="p-5">
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-xl",
                  status === 'error' 
                    ? "bg-red-100 dark:bg-red-900/50" 
                    : "bg-blue-100 dark:bg-blue-900/50"
                )}>
                  {status === 'error' ? '⚠️' : (
                    <span className="animate-pulse">{stepIcons[currentStep] || '🔄'}</span>
                  )}
                </div>
                <div>
                  <h3 className={cn(
                    "font-bold text-lg",
                    status === 'error' 
                      ? "text-red-900 dark:text-red-100" 
                      : "text-gray-900 dark:text-gray-100"
                  )}>
                    {t('title')}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t(`steps.${currentStep}.description`)}
                  </p>
                </div>
              </div>
              {status === 'error' && (
                <NexBadge variant="error" size="sm">{t('errorBadge')}</NexBadge>
              )}
            </div>
          
            {/* Progress Bar with Steps */}
            <div className="pt-2">
              {/* Progress line container */}
              <div className="relative">
                {/* Background progress line */}
                <div className="absolute top-5 left-5 right-5 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
                
                {/* Active progress line */}
                <div 
                  className={cn(
                    "absolute top-5 left-5 h-1 rounded-full transition-all duration-700 ease-out",
                    status === 'error' 
                      ? "bg-gradient-to-r from-red-400 to-red-500" 
                      : "bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500"
                  )}
                  style={{ width: `calc(${progressPercentage}% - 40px)` }}
                />
                
                {/* Steps */}
                <div className="relative flex items-start justify-between">
                  {stepOrder.map((step, index) => {
                    const isCompleted = index < currentIndex;
                    const isCurrent = index === currentIndex && status === 'running';
                    const isPending = index > currentIndex;
                    const isError = status === 'error' && index === currentIndex;
                    
                    return (
                      <div 
                        key={step} 
                        className="flex flex-col items-center"
                        style={{ width: '20%' }}
                      >
                        {/* Step circle */}
                        <div
                          className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold transition-all duration-500 shadow-sm',
                            isCompleted && 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-blue-200 dark:shadow-blue-900',
                            isCurrent && !isError && 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white ring-4 ring-blue-200 dark:ring-blue-800 shadow-lg shadow-blue-200 dark:shadow-blue-900',
                            isError && 'bg-gradient-to-br from-red-500 to-red-600 text-white ring-4 ring-red-200 dark:ring-red-800',
                            isPending && 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                          )}
                        >
                          {isCompleted ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : isCurrent && !isError ? (
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : isError ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          ) : (
                            <span className="text-lg">{stepIcons[step]}</span>
                          )}
                        </div>
                        
                        {/* Step label */}
                        <span
                          className={cn(
                            'mt-2 text-xs font-medium text-center leading-tight',
                            isCompleted && 'text-blue-600 dark:text-blue-400',
                            isCurrent && !isError && 'text-blue-700 dark:text-blue-300 font-semibold',
                            isError && 'text-red-600 dark:text-red-400 font-semibold',
                            isPending && 'text-gray-400 dark:text-gray-500'
                          )}
                        >
                          {t(`steps.${step}.label`)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className={cn(
                "text-sm p-3 rounded-lg flex items-center gap-2",
                status === 'error'
                  ? "text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30"
                  : "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30"
              )}>
                <span>{status === 'error' ? '❌' : '⏳'}</span>
                {errorMessage}
              </div>
            )}
          </div>
        </NexCardContent>
      </NexCard>
    );
  }

  // 완료 상태: 온보딩 완료 메시지와 함께 표시
  return (
    <NexCard 
      variant="outlined" 
      className="mb-4 overflow-hidden border-2 border-green-200 dark:border-green-900 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20"
    >
      <NexCardContent className="p-5">
        <div className="space-y-5">
          {isOnboarding ? (
            // 온보딩 완료 메시지
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-200 dark:shadow-green-900/50">
                <span className="text-2xl">🎉</span>
              </div>
              <div className="flex-1 pt-1">
                <h3 className="font-bold text-xl text-green-900 dark:text-green-100 mb-1">
                  {t('onboardingComplete.title')}
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {t('onboardingComplete.description')}
                </p>
              </div>
            </div>
          ) : (
            // 일반 완료 메시지
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md shadow-green-200 dark:shadow-green-900/50">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg text-green-900 dark:text-green-100">
                  {t('titleCompleted')}
                </h3>
              </div>
              <NexBadge variant="success" size="sm">{t('completedBadge')}</NexBadge>
            </div>
          )}
          
          {/* Progress Indicator - 모든 스텝 완료 표시 */}
          <div className="pt-2">
            {/* Progress line container */}
            <div className="relative">
              {/* Background progress line */}
              <div className="absolute top-5 left-5 right-5 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
              
              {/* Active progress line - 100% */}
              <div 
                className="absolute top-5 left-5 h-1 rounded-full bg-gradient-to-r from-green-400 via-green-500 to-emerald-500 transition-all duration-700"
                style={{ width: 'calc(100% - 40px)' }}
              />
              
              {/* Steps - 모두 완료 상태 */}
              <div className="relative flex items-start justify-between">
                {stepOrder.map((step, index) => (
                  <div 
                    key={step} 
                    className="flex flex-col items-center"
                    style={{ width: '20%' }}
                  >
                    {/* Step circle */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-md shadow-green-200 dark:shadow-green-900/50"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    
                    {/* Step label */}
                    <span className="mt-2 text-xs font-medium text-center text-green-600 dark:text-green-400">
                      {t(`steps.${step}.label`)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </NexCardContent>
    </NexCard>
  );
}
