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
import { FirstMailConfirmation, OnboardingModeBanner, TargetsGuideTooltip, TargetsSubProgress } from '../components/onboarding-guide';
import { deleteTarget, switchTargetActive } from '../db/mutations';
import { getMailingList, getPlanLimits, getTargetLastSentAt, getTargets, getUserSubscriptionPlanType, getWorkspace, getWorkspaceOnboardingState } from '../db/queries';
import { useOnboarding } from '../hooks/useOnboarding';
import { checkTargetLimit } from '../lib/common';
import { formatLastSent, formatSchedule } from '../lib/scheduleUtils';
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
  let planType: PlanType = 'free';
  try {
    planType = await getUserSubscriptionPlanType(client, { userId: user.id });
  } catch (error) {
    // If subscription not found, default to 'free'
    console.log('Failed to get subscription plan type, defaulting to free:', error);
  }
  
  // Get plan limits for the user's plan type
  let planLimits = null;
  try {
    planLimits = await getPlanLimits(client, { planType });
  } catch (error) {
    // If plan limits not found, continue without them
    console.log('Failed to get plan limits:', error);
  }
  
  return { workspaceId, targetData: mergedTargetData, onboardingState, planType, planLimits };
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
  const { t } = useTranslation("common", { keyPrefix: "targets" });
  const { t: commonT } = useTranslation("common", { keyPrefix: "common" });
  const { t: timesT } = useTranslation("common", { keyPrefix: "times" });
  const { t: onboardingT } = useTranslation("common", { keyPrefix: "onboarding" });
  const { workspaceId, targetData, onboardingState, planType, planLimits } = loaderData;
  const [targets, setTargets] = useState<TargetData[]>(targetData);
  const navigate = useNavigate();
  const submit = useSubmit();
  const fetcher = useFetcher();
  
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
  const handleFirstMailConfirm = (sendNow: boolean) => {
    if (sendNow) {
      // YES: Just update the step to completed (implementation will be added later)
      updateStep('completed');
      toast.success(onboardingT('steps.completed.title'));
    } else {
      // NO: Show next schedule and complete onboarding
      updateStep('completed');
      toast.success(onboardingT('steps.completed.title'));
    }
    setShowFirstMailConfirmation(false);
  };
  
  // Get next scheduled send time for first mail confirmation
  const getNextScheduleInfo = () => {
    const activeTarget = targets.find(t => t.isActive && t.scheduleCron);
    if (!activeTarget) return undefined;
    // Simple date formatting - could be enhanced with proper cron parsing
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 1);
    nextDate.setHours(7, 0, 0, 0);
    return nextDate.toLocaleString('ja-JP', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#F1F2F4] dark:from-[#0D0E10] dark:to-[#1A1B1E] p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Onboarding Banner for setup_targets step */}
        {isOnboardingActive && currentStep === 'setup_targets' && (
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
        )}
        
        {/* First Mail Confirmation for first_mail_sending step */}
        {showFirstMailConfirmation && (
          <FirstMailConfirmation
            workspaceId={workspaceId}
            nextSchedule={getNextScheduleInfo()}
            onConfirm={handleFirstMailConfirm}
          />
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
                <NexCardContent className="p-6">
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          {/* 스케줄 */}
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="font-medium">{commonT("schedule")}:</span>
                              <div className="text-muted-foreground">
                                {formatSchedule(target.scheduleCron, timesT)}
                              </div>
                            </div>
                          </div>

                          {/* 메일링 리스트 */}
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="font-medium">{commonT("sendTarget")}:</span>
                              <div className="text-muted-foreground">
                                {target.mailingListName || commonT("notSet")} 
                              </div>
                              <div className="text-muted-foreground">
                                {target.isMemberMail ? `${t("memberMailIncluded")}` : ""}
                              </div>
                            </div>
                          </div>

                          {/* 마지막 발송 시각 */}
                          <div className="flex items-center space-x-2">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="font-medium">{commonT("lastSent")}:</span>
                              <div className="text-muted-foreground">
                                {formatLastSent(target.lastSentAt || undefined, target.timezone || "Asia/Tokyo", timesT)}
                              </div>
                            </div>
                          </div>
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
        title="새 타겟 추가"
      >
        <PlusIcon className="h-6 w-6" />
      </button>
    </div>
  );
}
