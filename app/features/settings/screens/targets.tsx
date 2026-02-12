import { Clock, Copy, Edit, Mail, MoreVertical, Power, PowerOff, Target, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { redirect, useFetcher, useNavigate, useSubmit } from 'react-router';
import { toast } from 'sonner';
import {
  NexBadge,
  NexButton,
  NexCard,
  NexCardContent,
  NexCardDescription,
  NexCardTitle,
  PlusIcon,
} from '~/core/components/nex';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/core/components/ui/dropdown-menu";
import { type PlanType } from '~/core/lib/constants';
import makeServerClient from '~/core/lib/supa-client.server';
import { cn } from '~/core/lib/utils';
import { FirstMailConfirmation, OnboardingCompleteCard, OnboardingModeBanner, TargetsGuideTooltip, TargetsSubProgress } from '../components/onboarding-guide';
import { ProcessingStatusBar } from '../components/processing-status-bar';
import { deleteTarget, switchTargetActive } from '../db/mutations';
import { getCurrentMonthlyUsageCounter, getMailingList, getPlanLimits, getTargetLastSentAt, getTargets, getUserSubscriptionPlanType, getWorkspace, getWorkspaceOnboardingState } from '../db/queries';
import { useOnboarding } from '../hooks/useOnboarding';
import { checkTargetLimit } from '../lib/common';
import { formatLastSent, formatSchedule, formatTimeUntil, getNextScheduledTime } from '../lib/scheduleUtils';
import type { TargetData } from '../lib/types';
import type { Route } from "./+types/targets";

export const meta: Route.MetaFunction = () => {
  return [{ title: `Targets | ${import.meta.env.VITE_APP_NAME}` }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {

  const [client] = makeServerClient(request);
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return redirect('/login');
  }

  const workspace = await getWorkspace(client, { userId: user.id });
  const workspaceId = workspace[0].workspace_id;
  const targetData = await getTargets(client, { workspaceId: workspaceId });
  const mailingListData = await getMailingList(client, { workspaceId: workspaceId });
  
  const mergedTargetData = await Promise.all(
    targetData.map(async (target) => {
      const mailingList = mailingListData.find(ml => ml.mailingListId === target.mailingListId);
      const targetLastSentAt = await getTargetLastSentAt(client, { workspaceId: workspaceId, targetId: target.targetId });
      return {
        ...target,
        mailingListName: mailingList?.name || undefined,
        lastSentAt: targetLastSentAt || undefined,
      };
    })
  );
  
  // Get onboarding state
  let onboardingState = null;
  try {
    onboardingState = await getWorkspaceOnboardingState(client, { workspaceId });
  } catch (error) {
    // Onboarding state not found, continue without it
  }
  
  // Get user's subscription plan type
  let planType: PlanType;
  try {
    planType = await getUserSubscriptionPlanType(client, { userId: user.id }) as PlanType;
    if (!planType) {
      planType = 'free';
    }
  } catch (error) {
    // If subscription not found, default to 'free'
    console.log('Failed to get subscription plan type, defaulting to free:', error);
    planType = 'free';
  }
  
  // Get plan limits for the user's plan type
  let planLimits = null;
  try {
    planLimits = await getPlanLimits(client, { planType });
  } catch (error) {
    // If plan limits not found, continue without them
    console.log('Failed to get plan limits:', error);
  }
  
  // Get current monthly usage counter
  let usageCounter = null;
  try {
    usageCounter = await getCurrentMonthlyUsageCounter(client, { userId: user.id });
  } catch (error) {
    // If usage counter not found, continue without it
    console.log('Failed to get usage counter:', error);
  }
  
  return { workspaceId, targetData: mergedTargetData, onboardingState, planType, planLimits, usageCounter };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const [client] = makeServerClient(request);
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return redirect('/login');
  }

  const formData = await request.formData();
  const targetId = formData.get('targetId') as string;
  const workspaceId = formData.get('workspaceId') as string;
  const actionType = formData.get('actionType') as string;
  if (!actionType) {
    return {
      status: 'error',
      message: 'Action type not found'
    };
  }
  if (actionType === 'switchTargetActive') {
    if (!targetId) {
      return {
        status: 'error',
        message: 'Target not found'
      };
    }
    try {
      await switchTargetActive(client, { targetId: targetId});
      return { status: 'success', message: 'Target active switched' };
    } catch (error) {
      return {
        status: 'error',
        message: 'Target active switch failed'
      };
    }
  } else if (actionType === 'deleteTarget') {
    if (!targetId || !workspaceId) {
      return {
        status: 'error',
        message: 'Target not found or workspace not found'
      };
    }
    try {
      const result = await deleteTarget(client, { targetId });
      return {
        status: 'success',
        actionType: actionType,
        result: result,
        message: 'Target deleted successfully'
      };
    } catch (error) {
      return {
        status: 'error',
        actionType: actionType,
        result: null,
        message: 'Target deletion failed'
      };
    }
  } else {
    return {
      status: 'error',
      message: 'Invalid action type'
    };
  }
};


export default function TargetsScreen( { loaderData }: Route.ComponentProps ) {
  const { t, i18n } = useTranslation("common", { keyPrefix: "targets" });
  const { t: commonT } = useTranslation("common", { keyPrefix: "common" });
  const { t: timesT } = useTranslation("common", { keyPrefix: "times" });
  const { t: onboardingT } = useTranslation("common", { keyPrefix: "onboarding" });
  const { workspaceId, targetData, onboardingState, planType, planLimits, usageCounter } = loaderData;
  const [targets, setTargets] = useState<TargetData[]>(targetData);
  const navigate = useNavigate();
  const submit = useSubmit();
  const fetcher = useFetcher();
  const isReviewMode = onboardingState?.onboarding_mode === "slack_review" ? true : false;
  
  // Onboarding hook
  const { 
    isOnboardingActive, 
    currentStep, 
    currentTargetsSubStep,
    updateStep,
    updateTargetsSubStep 
  } = useOnboarding({ 
    workspaceId, 
    onboardingState 
  });
  
  // First mail confirmation state
  const [showFirstMailConfirmation, setShowFirstMailConfirmation] = useState(
    isOnboardingActive && currentStep === 'first_mail_sending'
  );
  
  // Onboarding complete card state
  const [showCompleteCard, setShowCompleteCard] = useState(false);
  
  // Processing status state
  const [processingRunStepId, setProcessingRunStepId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Update showFirstMailConfirmation when currentStep changes
  useEffect(() => {
    if (isOnboardingActive && currentStep === 'first_mail_sending') {
      setShowFirstMailConfirmation(true);
    } else if (currentStep !== 'first_mail_sending') {
      setShowFirstMailConfirmation(false);
    }
  }, [isOnboardingActive, currentStep]);

  // Handle end sub-step: advance to first_mail_sending
  useEffect(() => {
    if (isOnboardingActive && currentStep === 'setup_targets' && currentTargetsSubStep === 'end') {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        updateStep('first_mail_sending');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOnboardingActive, currentStep, currentTargetsSubStep, updateStep]);

  // 후처리: fetcher 상태 변화 감지
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      if (fetcher.data.actionType === 'deleteTarget') {
        if (fetcher.data.status === 'success') {
          toast.success(fetcher.data.message || t("targetDeletedSuccess") || "타겟이 삭제되었습니다");
          setTargets(prev => prev.filter(target => target.targetId !== fetcher.data.result.target_id));
        } else if (fetcher.data.status === 'error') {
          toast.error(fetcher.data.message || t("targetDeletedFailed") || "타겟 삭제에 실패했습니다");
        }
      }
    }
  }, [fetcher.state, fetcher.data, t]);

  // 활성 상태 토글
  const toggleTargetActive = (targetId: string) => {
    setTargets(prev => 
      prev.map(target => 
        target.targetId === targetId 
          ? { ...target, isActive: !target.isActive }
          : target
      )
    );

    const submitFormData = new FormData();
    submitFormData.append('actionType', 'switchTargetActive');
    submitFormData.append('targetId', targetId);
    submit(submitFormData, { method: 'POST' });
    
    setTimeout(() => {
      toast.success('Target active switched');
    }, 500);
  };

  // 타겟 추가 핸들러
  const handleAddTarget = () => {
    if (isReviewMode) {
      toast.error('You are in review mode, so you cannot add target');
      return;
    }
    // 제한 체크（DB에서 가져온 planLimits 사용）
    const limitCheck = checkTargetLimit(targets.length, planType, planLimits, t);
    
    if (!limitCheck.isValid) {
      toast.error(limitCheck.errorMessage || 'Target limit reached.');
      return;
    }
    
    // Advance to regist_basic sub-step if in onboarding
    if (isOnboardingActive && currentStep === 'setup_targets' && currentTargetsSubStep === 'start') {
      updateTargetsSubStep('regist_basic');
    }
    navigate('/settings/target/new');
  };

  // 타겟 편집 핸들러
  const handleEditTarget = (targetId: string) => {
    navigate(`/settings/target/${targetId}`);
  };

  // 타겟 삭제 핸들러
  const handleDeleteTarget = (targetId: string) => {
    if (confirm(t("confirmDeleteTarget") || "정말로 이 타겟을 삭제하시겠습니까?")) {
      const submitFormData = new FormData();
      submitFormData.append('actionType', 'deleteTarget');
      submitFormData.append('targetId', targetId);
      submitFormData.append('workspaceId', workspaceId);
      fetcher.submit(submitFormData, { method: 'POST' });
    }
  };

  // 타겟 복사 핸들러
  const handleCopyTarget = (targetId: string) => {
    // TODO: 타겟 복사 기능 구현
    console.log("타겟 복사:", targetId);
  };

  // Handle first mail confirmation
  const handleFirstMailConfirm = async (sendNow: boolean) => {
    if (sendNow) {
      // 중복 실행 방지
      if (isProcessing) {
        toast.error('processing is already in progress. please try again later.');
        return;
      }

      // 활성 타겟 찾기
      const activeTarget = targets.find(t => t.isActive);
      if (!activeTarget) {
        toast.error('active target not found');
        setShowFirstMailConfirmation(false);
        return;
      }

      setIsProcessing(true);
      try {
        // Phase1: run 생성만 → runStepId 즉시 수신 → 스테이터스바 표시 및 폴링 시작
        const res1 = await fetch('/api/cron/send-now', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetId: activeTarget.targetId,
            workspaceId: workspaceId,
          }),
        });
        const result1 = await res1.json();
        if (result1.status !== 'success') {
          toast.error(result1.message || 'execution failed');
          setIsProcessing(false);
          return;
        }
        const { runId, runStepId } = result1;
        setShowFirstMailConfirmation(false);
        setProcessingRunStepId(runStepId);

        // Phase2: processTarget 실행 (현재는 Vercel API 호출. Railway 전환 시 이 블록 제거)
        // - 현재: 클라이언트가 /api/cron/send-now/run 호출 → Vercel 에서 동기 실행
        // - Railway 전환 시: Phase1(send-now) 에서 job_queue 에만 enqueue 하고 여기서는 Phase2 호출하지 않음.
        //   Railway worker 가 job_queue 폴링 후 processTarget 실행. 스테이터스바 폴링은 그대로 run-status 로 동작.
        const res2 = await fetch('/api/cron/send-now/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            runId,
            runStepId,
            targetId: activeTarget.targetId,
            workspaceId: workspaceId,
          }),
        });
        const result2 = await res2.json();
        if (result2.status !== 'success') {
          toast.error(result2.error || result2.message || 'processing failed');
          setIsProcessing(false);
        }
      } catch (error: any) {
        toast.error(error.message || 'execution failed');
        setIsProcessing(false);
      }
    } else {
      // NO: Wait for schedule and complete onboarding
      setShowCompleteCard(true);
      updateStep('completed');
      setShowFirstMailConfirmation(false);
    }
  };
  
  // 카드가 표시된 후 5초 후에 사라지도록
  useEffect(() => {
    if (showCompleteCard) {
      const timer = setTimeout(() => {
        setShowCompleteCard(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showCompleteCard]);
  
  // Get next scheduled send time for first mail confirmation
  const getNextScheduleInfo = () => {
    const activeTarget = targets.find(t => t.isActive && t.scheduleCron);
    if (!activeTarget) return undefined;
    // Simple date formatting - could be enhanced with proper cron parsing
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 1);
    nextDate.setHours(7, 0, 0, 0);
    return nextDate.toLocaleString(i18n.language, {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#F1F2F4] dark:from-[#0D0E10] dark:to-[#1A1B1E] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Onboarding Banner - sticky */}
        {isOnboardingActive && currentStep === 'setup_targets' && (
          <div className="sticky top-0 z-10 -mx-6 px-6 pt-0 pb-4 bg-gradient-to-br from-[#F8F9FA] to-[#F1F2F4] dark:from-[#0D0E10] dark:to-[#1A1B1E]">
            <OnboardingModeBanner
              currentStep={currentStep}
              workspaceId={workspaceId}
              subProgress={
                <TargetsSubProgress 
                  currentSubStep={currentTargetsSubStep} 
                />
              }
              subProgressLabel={onboardingT('targetsSubSteps.progressLabel', '타겟 설정 진행 상황')}
              subProgressColor="purple"
            />
          </div>
        )}

        <div className="space-y-8">
        {/* First Mail Confirmation for first_mail_sending step */}
        {showFirstMailConfirmation && (
          <FirstMailConfirmation
            workspaceId={workspaceId}
            nextSchedule={getNextScheduleInfo()}
            onConfirm={handleFirstMailConfirm}
            isProcessing={isProcessing}
          />
        )}
        
        {/* Processing Status Bar */}
        {processingRunStepId && (
          <ProcessingStatusBar 
            runStepId={processingRunStepId}
            isOnboarding={isOnboardingActive && currentStep === 'first_mail_sending'}
            nextSchedule={getNextScheduleInfo()}
            onComplete={() => {
              setProcessingRunStepId(null);
              setIsProcessing(false);
              if (isOnboardingActive && currentStep === 'first_mail_sending') {
                updateStep('completed');
              }
            }}
            onError={(error) => {
              setIsProcessing(false);
              toast.error(error);
            }}
          />
        )}
        
        {/* Onboarding Complete Card (NO 선택 시에만 표시) */}
        {showCompleteCard && (
          <OnboardingCompleteCard />
        )}
        
        {/* 헤더 섹션 */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-[#0D0E10] dark:text-[#FFFFFF]">
              {t("title")}
            </h1>
            <p className="text-lg text-[#8B92B5] dark:text-[#6C6F7E]">
              {t("description")}
            </p>
          </div>
          
          <NexBadge variant="info" size="md">
            {targets.length} {t("numberOfTargets")}
          </NexBadge>
        </div>

        {/* 타겟 리스트 */}
        <div className="grid gap-4">
          {targets.length === 0 ? (
            /* 빈 상태 */
            <NexCard variant="outlined" className="text-center py-12">
              <NexCardContent>
                <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <NexCardTitle className="mb-2">{t("noTargets")}</NexCardTitle>
                <NexCardDescription className="mb-6">
                  {t("addFirstTarget")}
                </NexCardDescription>
                <TargetsGuideTooltip
                  currentSubStep={currentTargetsSubStep}
                  targetSubStep="start"
                  position="left"
                >
                  <NexButton 
                    variant="primary" 
                    leftIcon={<PlusIcon />}
                    onClick={handleAddTarget}
                    className="cursor-pointer"
                  >
                    {t("addTarget")}
                  </NexButton>
                </TargetsGuideTooltip>
              </NexCardContent>
            </NexCard>
          ) : (
            /* 타겟 카드 리스트 */
            targets.map((target) => (
              <NexCard 
                key={target.targetId} 
                variant="elevated" 
                hoverable
                className="transition-all duration-200 cursor-pointer"
                onClick={() => handleEditTarget(target.targetId)}
              >
                <NexCardContent className="p-4">
                  <div className="flex items-center justify-between">
                    {/* 좌측: 타겟 정보 */}
                    <div className="flex items-start space-x-4 flex-1">
                      {/* 활성 상태 인디케이터 */}
                      <div className="flex flex-col items-center space-y-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTargetActive(target.targetId);
                          }}
                          className={cn(
                            "p-2 rounded-full transition-all duration-200 cursor-pointer",
                            "hover:scale-105 hover:shadow-md active:scale-95",
                            "focus:outline-none focus:ring-2 focus:ring-offset-2",
                            target.isActive 
                              ? "bg-green-100 text-green-600 hover:bg-green-200 hover:shadow-green-200/50 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-800/40 dark:focus:ring-green-400" 
                              : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:shadow-gray-200/50 dark:bg-gray-800 dark:text-gray-500 dark:hover:bg-gray-700 dark:focus:ring-gray-400"
                          )}
                          title={target.isActive ? `${commonT("active")} - ${commonT("clickToDeactivate")}` : `${commonT("inactive")} - ${commonT("clickToActivate")}`}
                        >
                          {target.isActive ? (
                            <Power className="h-5 w-5" />
                          ) : (
                            <PowerOff className="h-5 w-5" />
                          )}
                        </button>
                        <span className="text-xs font-medium">
                          {target.isActive ? "ON" : "OFF"}
                        </span>
                      </div>

                      {/* 타겟 상세 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-semibold text-foreground truncate">
                            {target.displayName}
                          </h3>
                          <NexBadge 
                            variant={target.isActive ? "success" : "secondary"}
                            size="sm"
                          >
                            {target.isActive ? commonT("active") : commonT("inactive")}
                          </NexBadge>
                        </div>

                        {/* 타겟 정보 그리드 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {/* 스케줄 */}
                          <div className="flex items-start space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <span className="font-medium block">{commonT("schedule")}:</span>
                              <div className="text-muted-foreground">
                                {formatSchedule(target.scheduleCron, timesT)}
                              </div>
                            </div>
                          </div>

                          {/* 메일링 리스트 */}
                          <div className="flex items-start space-x-2">
                            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <span className="font-medium block">{commonT("sendTarget")}:</span>
                              <div className="text-muted-foreground">
                                {target.mailingListName || commonT("notSet")} 
                              </div>
                              <div className="text-muted-foreground">
                                {target.isMemberMail ? `${t("memberMailIncluded")}` : ""}
                              </div>
                            </div>
                          </div>

                          {/* 마지막 발송 시각 */}
                          <div className="flex items-start space-x-2">
                            <Target className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <span className="font-medium block">{commonT("lastSent")}:</span>
                              <div className="text-muted-foreground">
                                {formatLastSent(target.lastSentAt || undefined, target.timezone || "Asia/Tokyo", timesT)}
                              </div>
                            </div>
                          </div>

                          {/* 다음 발송 예정 */}
                          {target.scheduleCron && target.isActive ? (
                            <div className="flex items-start space-x-2">
                              <Target className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <span className="font-medium block">{commonT("nextSend")}:</span>
                                <div className="text-muted-foreground">
                                  {(() => {
                                    // 上限チェック: email_sent_count >= max_weekly_emails_per_month の場合、period_end以降のスケジュールを計算
                                    let minDate: Date | undefined = undefined;
                                    let isLimitReached = false;
                                    let periodEndDate: Date | undefined = undefined;
                                    
                                    if (usageCounter && planLimits && planLimits.max_weekly_emails_per_month !== null) {
                                      if (usageCounter.email_sent_count >= planLimits.max_weekly_emails_per_month) {
                                        // 上限に達している場合、period_end以降のスケジュールを計算
                                        isLimitReached = true;
                                        periodEndDate = new Date(usageCounter.period_end);
                                        minDate = periodEndDate;
                                      }
                                    }
                                    
                                    const nextTime = getNextScheduledTime(target.scheduleCron, minDate);
                                    if (nextTime) {
                                      const timeUntil = formatTimeUntil(nextTime, timesT, commonT);
                                      const scheduleStart = new Date(nextTime);
                                      const scheduleEnd = new Date(nextTime);
                                      scheduleEnd.setHours(scheduleEnd.getHours() + 2);
                                      
                                      return (
                                        <>
                                          {timeUntil}{' ('}
                                          {scheduleStart.toLocaleString(i18n.language, {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            timeZone: target.timezone || 'Asia/Tokyo'
                                          })}~ 
                                          {scheduleEnd.toLocaleString(i18n.language, {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            timeZone: target.timezone || 'Asia/Tokyo'
                                          })}
                                          {')'}
                                        </>
                                      );
                                    }
                                    return timesT("time.notSent") || "Not scheduled";
                                  })()}
                                </div>
                                {(() => {
                                  // 上限に達している場合、メッセージを表示
                                  if (usageCounter && planLimits && planLimits.max_weekly_emails_per_month !== null) {
                                    if (usageCounter.email_sent_count >= planLimits.max_weekly_emails_per_month) {
                                      const periodEndDate = new Date(usageCounter.period_end);
                                      // yyyy/mm/dd形式でフォーマット
                                      const year = periodEndDate.getFullYear();
                                      const month = String(periodEndDate.getMonth() + 1).padStart(2, '0');
                                      const day = String(periodEndDate.getDate()).padStart(2, '0');
                                      const formattedDate = `${year}/${month}/${day}`;
                                      return (
                                        <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                          {t("emailLimitReached", {
                                            count: planLimits.max_weekly_emails_per_month
                                          })}{' '}
                                          <span className="font-medium">{formattedDate}</span>{' '}
                                          {t("emailLimitReachedAfter")}
                                        </div>
                                      );
                                    }
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* 우측: 액션 버튼 */}
                    <div className="flex items-center space-x-2 ml-4" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <NexButton
                              variant="ghost"
                              size="sm"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </NexButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem 
                              onClick={() => handleEditTarget(target.targetId)}
                              className="flex items-center space-x-2"
                            >
                              <Edit className="h-4 w-4" />
                              <span>{commonT("edit")}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleCopyTarget(target.targetId)}
                              className="flex items-center space-x-2"
                              disabled={true}
                            >
                              <Copy className="h-4 w-4" />
                              <span>{commonT("copy")}</span>
                              <span className="rounded-full bg-muted-foreground/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                                SOON
                              </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteTarget(target.targetId)}
                              className="flex items-center space-x-2 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>{commonT("delete")}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  </div>
                </NexCardContent>
              </NexCard>
            ))
          )}
        </div>
        </div>
      </div>

      {/* 플로팅 추가 버튼 */}
      <button
        onClick={handleAddTarget}
        className={cn(
          "fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all duration-200",
          "bg-sky-600 text-white hover:bg-sky-700",
          "hover:scale-105 active:scale-95",
          "focus:outline-none focus:ring-2 focus:ring-sky-600 focus:ring-offset-2",
          "dark:focus:ring-offset-background cursor-pointer"
        )}
        title="Add new target"
      >
        <PlusIcon className="h-6 w-6" />
      </button>
    </div>
  );
}
