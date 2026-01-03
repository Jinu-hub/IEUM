/**
 * Processing Status Bar Component
 * 
 * 뉴스레터 생성 진행 상태를 실시간으로 표시하는 컴포넌트
 */

import { useEffect, useState } from 'react';
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

const stepLabels: Record<string, string> = {
  collect_data: '데이터 수집',
  summarize_data: '정규화/분석/요약',
  assemble_data: '섹션생성/병합',
  finalize_data: '최종 콘텐츠 생성',
  send_email: '메일발송',
};

const stepOrder: StepStatus[] = ['collect_data', 'summarize_data', 'assemble_data', 'finalize_data', 'send_email'];

export function ProcessingStatusBar({ runStepId, onComplete, onError, isOnboarding = false }: ProcessingStatusBarProps) {
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
            setErrorMessage(result.error || '상태 조회 실패');
            onError?.(result.error || '상태 조회 실패');
            return;
          }
          
          // 에러 메시지는 표시하지만 계속 폴링 시도
          setErrorMessage(`상태 조회 실패 (재시도 중... ${errorCount}/${MAX_ERRORS})`);
          pollTimeout = setTimeout(pollStatus, retryDelay);
        }
      } catch (error: any) {
        if (!isMounted) return;
        
        errorCount++;
        const isRateLimit = error.message?.includes('rate') || error.message?.includes('429');
        const retryDelay = isRateLimit ? POLL_INTERVAL * 3 : POLL_INTERVAL;
        
        if (errorCount >= MAX_ERRORS) {
          setStatus('error');
          const errorMsg = error.message || '상태 조회 중 오류 발생';
          setErrorMessage(errorMsg);
          onError?.(errorMsg);
          return;
        }
        
        // 에러 발생해도 계속 재시도
        setErrorMessage(`상태 조회 중 오류 발생 (재시도 중... ${errorCount}/${MAX_ERRORS})`);
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
  }, [runStepId, onComplete, onError]);

  const currentIndex = stepOrder.indexOf(currentStep);
  const progressPercentage = status === 'completed' 
    ? 100 
    : currentIndex >= 0 
      ? Math.max(0, (currentIndex / (stepOrder.length - 1)) * 100)
    : 0;

  // 완료 상태가 아니면 일반 진행 표시
  if (status !== 'completed') {
    return (
      <NexCard variant="outlined" className="mb-4">
        <NexCardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">뉴스레터 생성 진행 중...</h3>
              {status === 'error' && (
                <NexBadge variant="error" size="sm">오류</NexBadge>
              )}
            </div>
          
          {/* Progress Indicator - onboarding-guide.tsx 스타일 적용 */}
          <div className={cn('w-full')}>
            <div className="flex items-center justify-between relative">
              {/* Progress line */}
              <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700" />
              <div 
                className={cn(
                  "absolute top-3 left-0 h-0.5 transition-all duration-500",
                  status === 'error' ? "bg-red-500" : "bg-blue-500"
                )}
                style={{ width: `${progressPercentage}%` }}
              />
              
              {/* Steps */}
              {stepOrder.map((step, index) => {
                const isCompleted = index < currentIndex;
                const isCurrent = index === currentIndex && status === 'running';
                const isPending = index > currentIndex;
                const isError = status === 'error' && index === currentIndex;
                
                return (
                  <div key={step} className="relative flex flex-col items-center z-10">
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium transition-all duration-300',
                        isCompleted && 'bg-blue-500 text-white',
                        isCurrent && !isError && 'bg-blue-500 text-white ring-2 ring-blue-200 dark:ring-blue-800 animate-pulse',
                        isError && 'bg-red-500 text-white ring-2 ring-red-200 dark:ring-red-800',
                        isPending && 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      )}
                    >
                      {isCompleted ? '✓' : (
                        isCurrent && !isError ? (
                          <span className="animate-spin">⟳</span>
                        ) : (
                          index + 1
                        )
                      )}
                    </div>
                    <span
                      className={cn(
                        'mt-1 text-[10px] font-medium whitespace-nowrap',
                        isCurrent && !isError && 'text-blue-600 dark:text-blue-400',
                        isError && 'text-red-600 dark:text-red-400',
                        !isCurrent && !isError && 'text-gray-500 dark:text-gray-400'
                      )}
                    >
                      {stepLabels[step] || step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {errorMessage && (
            <div className="text-sm text-red-600 dark:text-red-400 mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
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
      className="mb-4"
    >
      <NexCardContent className="p-4">
        <div className="space-y-4">
          {isOnboarding ? (
            // 온보딩 완료 메시지
            <div className="flex items-start gap-4">
              <span className="text-4xl flex-shrink-0">✅</span>
              <div className="flex-1">
                <h3 className="font-bold text-xl text-green-900 dark:text-green-100 mb-2">
                  Setup Complete!
                </h3>
                <p className="text-base text-green-800 dark:text-green-200 mb-4">
                  Congratulations! Your NexLetter setup is complete. Your first newsletter has been sent successfully.
                </p>
              </div>
            </div>
          ) : (
            // 일반 완료 메시지
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">뉴스레터 생성 완료</h3>
              <NexBadge variant="success" size="sm">완료</NexBadge>
            </div>
          )}
          
          {/* Progress Indicator - 모든 스텝 완료 표시 */}
          <div className={cn('w-full')}>
            <div className="flex items-center justify-between relative">
              {/* Progress line - 100% */}
              <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700" />
              <div 
                className="absolute top-3 left-0 h-0.5 bg-green-500 transition-all duration-500"
                style={{ width: '100%' }}
              />
              
              {/* Steps - 모두 완료 상태 */}
              {stepOrder.map((step, index) => {
                return (
                  <div key={step} className="relative flex flex-col items-center z-10">
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium transition-all duration-300',
                        'bg-green-500 text-white'
                      )}
                    >
                      ✓
                    </div>
                    <span
                      className={cn(
                        'mt-1 text-[10px] font-medium whitespace-nowrap',
                        'text-green-600 dark:text-green-400'
                      )}
                    >
                      {stepLabels[step] || step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </NexCardContent>
    </NexCard>
  );
}

