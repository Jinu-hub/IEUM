import { ArrowLeft, Clock, Plus, Settings, Target as TargetIcon, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { redirect, useActionData, useNavigate, useNavigation, useParams, useSubmit, type LoaderFunctionArgs } from 'react-router';
import { toast } from "sonner";
import {
  NexBadge,
  NexButton,
  NexCard,
  NexCardContent,
  NexInput,
  NexToggle,
} from '~/core/components/nex';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/core/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/core/components/ui/tooltip";
import { CATEGORY_TYPE, LANGUAGE, type PlanType } from '~/core/lib/constants';
import makeServerClient from '~/core/lib/supa-client.server';
import { OnboardingModeBanner, TargetsSectionGuide, TargetsSubProgress } from '../components/onboarding-guide';
import { createTargetWithSources } from '../db/mutations';
import { getIntegrationsInfo, getMailingList, getTarget, getTargetSourcePolicy, getTargetSources, getUserSubscriptionPlanType, getWorkspace, getWorkspaceOnboardingState } from '../db/queries';
import { useIntegrationSources } from '../hooks/useIntegrationSources';
import { useOnboarding } from '../hooks/useOnboarding';
import {
  checkSourceLimit,
  getNonMemberSlackChannels,
  getSourceTypeLabel,
} from '../lib/common';
import { getCategoryLabel } from '../lib/constants';
import {
  generateCronExpression,
  parseCronExpression
} from '../lib/scheduleUtils';
import type { TargetData } from '../lib/types';
import { getHours, getScheduleTypes, getWeekdays } from '../lib/types';
import type { Route } from "./+types/target-detail";

export const meta = ({ params }: { params: { targetId: string } }) => {
  const isNew = params.targetId === 'new';
  return [{ title: `${isNew ? 'Add Target' : 'Edit Target'} | ${import.meta.env.VITE_APP_NAME}` }];
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const [client] = makeServerClient(request);
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return redirect('/login');
  }
  const workspace = await getWorkspace(client, { userId: user.id });
  const workspaceId = workspace[0].workspace_id;
  const mailingLists = await getMailingList(client, { workspaceId: workspaceId });
  const integrations = await getIntegrationsInfo(client, { workspaceId: workspaceId });

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

  // Get target source policy for the user's plan type
  let targetSourcePolicy = null;
  try {
    targetSourcePolicy = await getTargetSourcePolicy(client, { planType });
  } catch (error) {
    // If target source policy not found, continue without it
    console.log('Failed to get target source policy:', error);
  }

  const targetId = params.targetId;
  if (targetId && targetId !== 'new') {
    const target = await getTarget(client, { targetId: targetId || '' });
    const targetSources = await getTargetSources(client, { workspaceId: workspaceId, targetId: targetId });
    return { workspaceId, target, mailingLists, integrations, targetSources, onboardingState, planType, targetSourcePolicy };
  } else {
    return { workspaceId, target: null, mailingLists, integrations, targetSources: [], onboardingState, planType, targetSourcePolicy };
  }
};

export const action = async ({ request, params }: Route.ActionArgs) => {
  const [client] = makeServerClient(request);
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return redirect('/login');
  }
  
  const workspace = await getWorkspace(client, { userId: user.id });
  const workspaceId = workspace[0].workspace_id;
  
  if (!workspaceId) {
    return {
      status: 'error',
      message: 'Workspace not found'
    };
  }

  try {
    const formData = await request.formData();
    const actionType = formData.get('actionType') as string;

    if (actionType === 'save') {
      const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      // Form 데이터 파싱
      const targetData = {
        targetId: formData.get('targetId') as string,
        category: formData.get('category') as string,
        displayName: formData.get('displayName') as string,
        isActive: formData.get('isActive') === 'true',
        scheduleCron: formData.get('scheduleCron') as string || '',
        scheduleHour: formData.get('scheduleHour') as string || '0',
        mailingListId: formData.get('mailingListId') as string || '',
        timezone: formData.get('timezone') as string || systemTimezone,
        language: formData.get('language') as string,
      };

      // Integration Sources 파싱
      const sourcesJson = formData.get('integrationSources') as string;
      const integrationSources = sourcesJson ? JSON.parse(sourcesJson) : [];

      console.log('Saving target:', targetData);
      console.log('Saving sources:', integrationSources);

      // Target과 Sources 저장
      const result = await createTargetWithSources(client, {
        workspaceId,
        targets: targetData,
        sources: integrationSources
      });

      // 성공 메시지 데이터 구성 (i18n은 클라이언트에서 처리)
      return {
        status: 'success',
        messageKey: 'targetSaved',
        messageData: {
          displayName: targetData.displayName,
          totalSources: result.totalSources,
          successfulSources: result.successfulSources,
          failedSources: result.failedSources
        },
        showToast: true,
        redirectTo: '/settings/targets',
        redirectDelay: 500
      };
    }

    return {
      status: 'error',
      messageKey: 'invalidActionType'
    };

  } catch (error) {
    console.error('Target save error:', error);
    
    // 에러 메시지 키 결정
    let errorMessageKey = 'saveError';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorDetails = error.message;
      if (error.message.includes('uuid')) {
        errorMessageKey = 'invalidDataFormat';
      } else if (error.message.includes('duplicate')) {
        errorMessageKey = 'duplicateData';
      }
    }
    
    return {
      status: 'error',
      messageKey: errorMessageKey,
      messageData: { details: errorDetails },
      error: true
    };
  }
};

export default function TargetDetailScreen( { loaderData }: Route.ComponentProps ) {
  const { t, i18n } = useTranslation("common", { keyPrefix: "targets" });
  const { t: commonT } = useTranslation("common", { keyPrefix: "common" });
  const { t: timesT } = useTranslation("common", { keyPrefix: "times" });
  const { t: errorsT } = useTranslation("common", { keyPrefix: "errors" });
  const { t: onboardingT } = useTranslation("common", { keyPrefix: "onboarding" });
  const { workspaceId, target, mailingLists, integrations, targetSources, onboardingState, planType, targetSourcePolicy } = loaderData;
  const navigate = useNavigate();
  const submit = useSubmit();
  const actionData = useActionData();
  const navigation = useNavigation();
  const { targetId } = useParams();
  const isNew = targetId === 'new';
  
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

  // i18n対応のオプション配列
  const scheduleTypes = getScheduleTypes(timesT);
  const weekdays = getWeekdays(timesT);
  const hours = getHours(timesT);

  // 저장 상태
  const [isSaving, setIsSaving] = useState(false);
  // 에러 처리 상태 (중복 alert 방지)
  const [processedActionData, setProcessedActionData] = useState(null);

  const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // 폼 상태
  const [formData, setFormData] = useState<Partial<TargetData>>({
    category: 'development',
    displayName: '',
    isActive: true,
    scheduleCron: '',
    mailingListName: '',
    timezone: systemTimezone,
    language: i18n.language, // i18n에서 현재 언어 가져오기
  });

  // 타겟 편집 시 기존 데이터로 폼 초기화
  useEffect(() => {
    if (target && !isNew) {
      setFormData((prev) => ({
        ...prev,
        targetId: target.target_id,
        category: target.category ?? '',
        displayName: target.display_name,
        isActive: target.is_active,
        scheduleCron: target.schedule_cron ?? '',
        lastSentAt: target.last_sent_at ?? '',
        //mailingListName: target.mailing_list_name ?? '',
        mailingListId: target.mailing_list_id ?? '',
        timezone: target.timezone,
        language: target.language || i18n.language,
      }));

      // 스케줄 정보가 있으면 UI 상태도 초기화
      if (target.schedule_cron) {
        const parsedSchedule = parseCronExpression(target.schedule_cron);
        
        // MVP: weekly 외의 타입은 weekly로 변환
        if (parsedSchedule.scheduleType === 'weekly') {
          setScheduleType('weekly');
          setSelectedHour(parsedSchedule.hour);
          setSelectedMinute(parsedSchedule.minute);
          setSelectedWeekday(parsedSchedule.weekday || '1');
        } else if (parsedSchedule.scheduleType === 'daily' || parsedSchedule.scheduleType === 'monthly' || parsedSchedule.scheduleType === 'custom') {
          // 향후 지원 예정인 타입들은 weekly로 폴백
          console.warn(`MVP 버전에서는 ${parsedSchedule.scheduleType} 타입이 지원되지 않습니다. weekly로 변환합니다.`);
          setScheduleType('weekly');
          setSelectedHour(parsedSchedule.hour);
          setSelectedMinute(parsedSchedule.minute);
          setSelectedWeekday('1'); // 월요일로 기본 설정
        } else {
          // manual이거나 알 수 없는 타입
          setScheduleType('manual');
        }
      }

      // 타겟 소스 정보로 UI 상태 초기화 (빈 배열이어도 초기화)
      if (targetSources) {
        // integrationType을 integrationId로부터 찾아서 추가
        const sourcesWithType = targetSources.map(source => {
          const integration = integrations.find(integ => integ.integration_id === source.integrationId);
          return {
            ...source,
            integrationType: integration?.type || ''
          };
        });
        setIntegrationSources(sourcesWithType);

        // targetSources 기반 isMemberMail 결정
        try {
          const hasSources = Array.isArray(targetSources) && targetSources.length > 0;
          let derivedIsMemberMail = true; // 기본값
          if (hasSources) {
            const anyTrue = targetSources.some((s: any) => s?.isMemberMail === true);
            const allFalse = targetSources.every((s: any) => s?.isMemberMail === false);
            derivedIsMemberMail = anyTrue ? true : (allFalse ? false : true);
          }
          setIsMemberMail(derivedIsMemberMail);
        } catch {
          // 문제가 생겨도 UX상 기본 true 유지
          setIsMemberMail(true);
        }
      }
    }
  }, [target, targetSources, integrations, isNew]);

  // 스케줄 관련 상태
  const [scheduleType, setScheduleType] = useState('weekly');
  const [selectedHour, setSelectedHour] = useState('9');
  const [selectedMinute, setSelectedMinute] = useState('0');
  const [selectedWeekday, setSelectedWeekday] = useState('1'); // 월요일
  const [selectedMonthDay, setSelectedMonthDay] = useState('1');
  const [customCron, setCustomCron] = useState('');

  // 새 인테그레이션 소스 상태
  const [newIntegration, setNewIntegration] = useState({
    integrationType: '',
    sourceType: '',
    sourceIdent: '',
  });
  // 멤버 메일 발송 여부 (TargetData와 분리)
  const [isMemberMail, setIsMemberMail] = useState(true);
  
  // 커스텀 훅으로 integration 소스 관리
  const {
    integrationSources,
    availableSources,
    setIntegrationSources,
    setAvailableSources,
    updateAvailableSources,
    handleAddSource,
    handleRemoveSource,
  } = useIntegrationSources(integrations);
  
  // 비멤버 Slack 채널 목록
  const [nonMemberChannels, setNonMemberChannels] = useState<any[]>([]);
  
  // 비멤버 채널 목록 확장 상태
  const [expandedNonMemberChannels, setExpandedNonMemberChannels] = useState(false);

  // Action 결과 및 Navigation 상태 모니터링
  useEffect(() => {
    // Navigation 상태로 저장 상태 관리
    const isSubmitting = navigation.state === 'submitting';
    setIsSaving(isSubmitting);

    // Action 結果 処理 (中複 防止)
    if (actionData && !isSubmitting && actionData !== processedActionData) {
      if (actionData.error || actionData.status === 'error') {
        // エラー処理 - messageKeyで翻訳
        const errorMessage = actionData.messageKey 
          ? t(`detail.errors.${actionData.messageKey}`, actionData.messageData || {})
          : actionData.message || errorsT("saveError");
        toast.error(errorMessage);
        setIsSaving(false);
        setProcessedActionData(actionData); // 処理完了表示
      } else if (actionData.status === 'success') {
        // 成功処理 - messageKeyで翻訳してメッセージ構成
        if (actionData.showToast && actionData.messageKey) {
          const data = actionData.messageData || {};
          const messages: string[] = [];
          
          // メインメッセージ
          messages.push(t(`detail.messages.${actionData.messageKey}`, { displayName: data.displayName }));
          
          // ソース連結成功メッセージ
          if (data.totalSources > 0) {
            messages.push(t('detail.messages.sourcesConnected', { 
              successful: data.successfulSources, 
              total: data.totalSources 
            }));
          }
          
          // ソース連結失敗メッセージ
          if (data.failedSources > 0) {
            messages.push(t('detail.messages.someSourcesFailed'));
          }

          toast.success(
            <div className="text-left whitespace-pre-wrap">
              {messages.join('\n')}
            </div>
          );
          
          // Onboarding: Update sub-step to 'end' after target save
          // The step transition to 'first_mail_sending' will be handled in targets.tsx
          if (isOnboardingActive && currentStep === 'setup_targets') {
            updateTargetsSubStep('end');
          }
          
          // 딜레이된 리다이렉트
          if (actionData.redirectTo) {
            setTimeout(() => {
              navigate(actionData.redirectTo);
            }, actionData.redirectDelay || 500);
          }
        }
        setProcessedActionData(actionData); // 처리 완료 표시
      }
    }

    // 새로운 제출이 시작되면 처리 상태 초기화
    if (isSubmitting) {
      setProcessedActionData(null);
    }
  }, [actionData, navigation.state, processedActionData]);

  // 뒤로 가기
  const handleGoBack = () => {
    navigate('/settings/targets');
  };

  // 폼 입력 핸들러
  const handleInputChange = (field: keyof TargetData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 스케줄 타입 변경 핸들러
  const handleScheduleTypeChange = (value: string) => {
    setScheduleType(value);
    const cronString = generateCronExpression({
      scheduleType: value as 'daily' | 'weekly' | 'monthly' | 'custom',
      hour: selectedHour,
      minute: '0', // MVP: 분은 항상 0으로 고정
      weekday: selectedWeekday,
      monthDay: selectedMonthDay,
      customCron
    });
    handleInputChange('scheduleCron', cronString);
  };

  // 시간/요일/일자 변경 핸들러
  const handleScheduleDetailChange = () => {
    if (scheduleType !== 'custom' && scheduleType !== 'manual') {
      const cronString = generateCronExpression({
        scheduleType: scheduleType as 'daily' | 'weekly' | 'monthly' | 'custom',
        hour: selectedHour,
        minute: '0', 
        weekday: selectedWeekday,
        monthDay: selectedMonthDay,
        customCron
      });
      handleInputChange('scheduleCron', cronString);
    }
  };

  // 커스텀 cron 변경 핸들러
  const handleCustomCronChange = (value: string) => {
    setCustomCron(value);
    if (scheduleType === 'custom') {
      handleInputChange('scheduleCron', value);
    }
  };

  // Effect to update cron when schedule details change
  useEffect(() => {
    handleScheduleDetailChange();
  }, [selectedHour, selectedWeekday, selectedMonthDay, scheduleType]); 

  // 인테그레이션 선택 시 소스 로드
  useEffect(() => {
    if (newIntegration.integrationType) {
      updateAvailableSources(newIntegration.integrationType);
      
      // Slack인 경우 비멤버 채널도 가져오기
      const integration = integrations.find((i: any) => i.type === newIntegration.integrationType);
      const rc: any = integration?.resource_cache_json as any;
      if (integration?.type === 'slack' && Array.isArray(rc?.channels)) {
        const nonMembers = getNonMemberSlackChannels(rc.channels as any);
        setNonMemberChannels(nonMembers);
        setExpandedNonMemberChannels(false); // 새로운 인테그레이션 선택 시 확장 상태 초기화
      } else {
        setNonMemberChannels([]);
        setExpandedNonMemberChannels(false);
      }
    } else {
      setAvailableSources([]);
      setNonMemberChannels([]);
      setExpandedNonMemberChannels(false);
    }
  }, [newIntegration.integrationType, integrations, updateAvailableSources, setAvailableSources]);

  
  // 소스 제한 에러 메시지 상태
  const [sourceLimitError, setSourceLimitError] = useState<string | null>(null);

  // 인테그레이션 소스 추가 핸들러
  const handleAddIntegrationSource = () => {
    // 제한 체크
    const integration = integrations.find((i: any) => i.type === newIntegration.integrationType);
    const sourceType = integration?.type === 'github' ? 'github_repo' : 'slack_channel';
    
    const limitCheck = checkSourceLimit(
      integrationSources,
      {
        integrationType: newIntegration.integrationType,
        sourceType: sourceType
      },
      planType,
      targetSourcePolicy || null,
      t
    );
    
    if (!limitCheck.isValid) {
      setSourceLimitError(limitCheck.errorMessage || 'Source limit reached.');
      toast.error(limitCheck.errorMessage || 'Source limit reached.');
      return;
    }
    
    // 제한 체크 통과 시 에러 메시지 초기화
    setSourceLimitError(null);
    
    const success = handleAddSource(newIntegration);
    if (success) {
      setNewIntegration({ integrationType: '', sourceType: '', sourceIdent: '' });
      setAvailableSources([]); // 소스 목록 초기화
    }
  };

  // 저장 핸들러
  const handleSave = () => {
    // 유효성 검사
    if (!formData.displayName?.trim()) {
      alert(errorsT("targetNameRequired"));
      return;
    }

    // FormData 객체 생성
    const submitFormData = new FormData();
    submitFormData.append('actionType', 'save');
    submitFormData.append('targetId', formData.targetId || '');
    submitFormData.append('displayName', formData.displayName);
    submitFormData.append('isActive', formData.isActive ? 'true' : 'false');
    submitFormData.append('scheduleHour', selectedHour || '0');
    submitFormData.append('scheduleCron', formData.scheduleCron || '');
    submitFormData.append('mailingListId', formData.mailingListId || '');
    submitFormData.append('timezone', formData.timezone || systemTimezone);
    submitFormData.append('language', formData.language || i18n.language);
    submitFormData.append('isMemberMail', isMemberMail ? 'true' : 'false');
    
    // Integration Sources를 JSON 문자열로 변환
    submitFormData.append('integrationSources', JSON.stringify(integrationSources));

    console.log('저장할 데이터:', formData);
    console.log('인테그레이션 소스:', integrationSources);

    // 서버로 제출 (상태 관리는 useEffect에서 처리)
    submit(submitFormData, { method: 'POST' });
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
        
        {/* 헤더 섹션 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <NexButton
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft />}
              onClick={handleGoBack}
              disabled={isSaving}
              className="cursor-pointer"
            >
              {commonT("back")}
            </NexButton>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-[#0D0E10] dark:text-[#FFFFFF]">
                {isNew ? t("detail.addTarget") : t("detail.editTarget")}
              </h1>
              <p className="text-lg text-[#8B92B5] dark:text-[#6C6F7E]">
                {t("detail.description")}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <NexBadge variant={formData.isActive ? "success" : "secondary"} size="md">
              {formData.isActive ? commonT("active") : commonT("inactive")}
            </NexBadge>
            <NexButton
              variant="primary"
              onClick={handleSave}
              loading={isSaving}
              disabled={isSaving}
              className="cursor-pointer"
            >
              {isSaving ? commonT("saving") : commonT("save")}
            </NexButton>
          </div>
        </div>

        {/* 메인 폼 */}
        <div className="grid gap-6">
          {/* 기본 정보 섹션 */}
          <NexCard variant="outlined">
            <NexCardContent className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TargetIcon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">{commonT("basicInfo")}</h2>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{commonT("category")}</label>
                <Tooltip>
                  <Select
                    value={formData.category || undefined}
                    onValueChange={(value) => handleInputChange('category', value)}
                    disabled={true}
                  >
                    <TooltipTrigger asChild>
                      <SelectTrigger>
                        <SelectValue placeholder={commonT("selectCategory")} />
                      </SelectTrigger>
                    </TooltipTrigger>
                    <SelectContent >
                      {CATEGORY_TYPE.map((category) => (
                        <SelectItem key={category} value={category}>
                          {getCategoryLabel(category, commonT)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <TooltipContent 
                    side="top"
                    className="bg-primary text-primary-foreground border-primary shadow-lg max-w-xs"
                  >
                    <p className="font-medium">{t("detail.soonSupportOtherCategory")}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="grid gap-6 mt-6">
                {/* 타겟 이름 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{commonT("targetName")}</label>
                  <NexInput
                    placeholder={t("detail.enterTargetName")}
                    value={formData.displayName || ''}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    disabled={isSaving}
                  />
                </div>

                {/* 활성 상태 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{commonT("activeStatus")}</label>
                  <NexToggle
                    checked={formData.isActive || false}
                    onChange={(checked) => handleInputChange('isActive', checked)}
                    label={formData.isActive ? commonT("active") : commonT("inactive")}
                    variant="success"
                    size="md"
                    disabled={isSaving}
                  />
                </div>

                {/* 메일링 리스트 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{commonT("sendTarget")}</label>
                  <Select
                    value={formData.mailingListId || ''}
                    onValueChange={(value) => handleInputChange('mailingListId', value)}
                    disabled={isSaving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("detail.selectMailingList")} />
                    </SelectTrigger>
                    <SelectContent>
                      {mailingLists.map((list) => (
                        <SelectItem key={list.mailingListId} value={list.mailingListId}>
                          {list.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 멤버 메일 발송 여부 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t("detail.memberMailStatus")}</label>
                  <NexToggle
                    checked={isMemberMail}
                    onChange={(checked) => {
                      setIsMemberMail(checked);
                      // 토글 상태를 integrationSources의 isMemberMail에 반영
                      setIntegrationSources(prev =>
                        prev.map(src => ({
                          ...src,
                          isMemberMail: checked
                            ? (src.integrationType === 'slack')
                            : false
                        }))
                      );
                    }}
                    label={isMemberMail ? commonT("active") : commonT("inactive")}
                  />
                  {isMemberMail && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("detail.memberMailStatusDescription")}
                    </p>
                  )}
                </div>

                {/* 언어 선택 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{commonT("newsletterLanguage")}</label>
                  <Select
                    value={formData.language || i18n.language}
                    onValueChange={(value) => handleInputChange('language', value)}
                    disabled={isSaving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={commonT("selectLanguage")} />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang === 'en' ? 'English' : lang === 'ja' ? '日本語' : '한국어'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Onboarding: Basic Info Guide */}
              <TargetsSectionGuide
                currentSubStep={currentTargetsSubStep}
                targetSubStep="regist_basic"
                onComplete={() => {
                  if (isOnboardingActive && currentStep === 'setup_targets') {
                    updateTargetsSubStep('regist_schedule');
                    // Scroll to schedule section
                    setTimeout(() => {
                      document.getElementById('schedule-section')?.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                      });
                    }, 100);
                  }
                }}
              />
            </NexCardContent>
          </NexCard>

          {/* 스케줄 섹션 */}
          <NexCard variant="outlined" id="schedule-section">
            <NexCardContent className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-foreground">{commonT("schedule")}</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("detail.scheduleTypeDescription")}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* 스케줄 타입 선택 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{timesT("schedule.type")}</label>
                  <Select value={scheduleType} onValueChange={handleScheduleTypeChange} disabled={isSaving}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {scheduleTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Weekly 스케줄 설정 */}
                {scheduleType === 'weekly' && (
                  <div className="space-y-6 p-4 bg-muted/30 rounded-lg border border-muted">
                    {/* 요일 설정 */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">{timesT("schedule.sendDay")}</label>
                      <Select 
                        value={selectedWeekday} 
                        onValueChange={setSelectedWeekday}
                        disabled={isSaving}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {weekdays.map((day) => (
                            <SelectItem key={day.value} value={day.value}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 시간 설정 */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">{timesT("schedule.sendTime")}</label>
                      <Select 
                        value={selectedHour} 
                        onValueChange={setSelectedHour}
                        disabled={isSaving}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {hours.map((hour) => {
                            const currentHour = parseInt(hour.value);
                            const nextHour = (currentHour + 2) % 24;
                            return (
                              <SelectItem key={hour.value} value={hour.value}>
                                {timesT("schedule.timeRange", { start: currentHour, end: nextHour })}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 스케줄 미리보기 */}
                    <div className="bg-background rounded-lg p-4 border border-muted">
                      <h4 className="text-sm font-medium text-foreground mb-2">{timesT("schedule.preview")}</h4>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">
                          {timesT("schedule.weeklyFormat", { day: weekdays.find(d => d.value === selectedWeekday)?.label, time: timesT("schedule.timeRange", { start: parseInt(selectedHour), end: (parseInt(selectedHour) + 2) % 24 }) })}
                        </span>
                      </div>
                      {formData.scheduleCron && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Cron: <code className="bg-muted px-1 py-0.5 rounded">{formData.scheduleCron}</code>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 수동 발송 안내 */}
                {scheduleType === 'manual' && (
                  <div className="p-4 bg-muted/30 rounded-lg border border-muted">
                    <p className="text-sm text-muted-foreground">
                      {t("detail.manualDescription")}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Onboarding: Schedule Guide */}
              <TargetsSectionGuide
                currentSubStep={currentTargetsSubStep}
                targetSubStep="regist_schedule"
                onComplete={() => {
                  if (isOnboardingActive && currentStep === 'setup_targets') {
                    updateTargetsSubStep('regist_sourses');
                    // Scroll to data sources section
                    setTimeout(() => {
                      document.getElementById('data-sources-section')?.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                      });
                    }, 100);
                  }
                }}
              />
            </NexCardContent>
          </NexCard>

          {/* 인테그레이션 소스 섹션 */}
          <NexCard variant="outlined" id="data-sources-section">
            <NexCardContent className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">{commonT("dataSources")}</h2>
              </div>

              {/* 기존 인테그레이션 소스 목록 */}
              {integrationSources.length > 0 && (
                <div className="space-y-3 mb-6">
                  {integrationSources.map((source) => {
                    const integration = integrations.find((i: any) => i.type === source.integrationType);
                    return (
                      <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <NexBadge variant="secondary" size="sm">
                            {integration?.name}
                          </NexBadge>
                          <span className="text-sm text-foreground">{source.sourceIdent}</span>
                          {integration?.type === 'github' && (
                            <span className="text-xs text-muted-foreground">{commonT("repository")}</span>
                          )}
                          {integration?.type === 'slack' && (
                            <span className="text-xs text-muted-foreground">{commonT("channel")}</span>
                          )}
                          <span
                            className="text-xs text-muted-foreground"
                          >
                            <Tooltip>
                              <TooltipTrigger>
                                <span>- {commonT("memberMail")}: {integration?.type === 'github' ? 'OFF' : (isMemberMail ? 'ON' : 'OFF')}</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{integration?.type === 'github' ? (commonT("notSupport")) : isMemberMail ? t("detail.memberMailIncluded") : t("detail.memberMailNotIncluded")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </span>
                        </div>
                        <NexButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSource(source.id)}
                          disabled={isSaving}
                        >
                          <X className="h-4 w-4" />
                        </NexButton>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 새 인테그레이션 소스 추가 */}
              <div className="space-y-4 p-4 border-2 border-dashed border-muted rounded-lg">
                <h3 className="text-sm font-medium text-foreground">{t("detail.addDataSource")}</h3>
                
                <div className="space-y-6">
                  {/* 연결된 서비스 선택 */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">{t("detail.connectedService")}</label>
                    <Select
                      value={newIntegration.integrationType}
                      onValueChange={(value) => setNewIntegration(prev => ({ 
                        ...prev, 
                        integrationType: value,
                        sourceIdent: '' // 서비스가 바뀌면 소스도 초기화
                      }))}
                      disabled={isSaving}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("detail.selectConnectedService")} />
                      </SelectTrigger>
                      <SelectContent>
                        {integrations.length > 0 ? (
                          integrations.map((integration: any) => (
                            <SelectItem key={integration.type} value={integration.type}>
                              <div className="flex items-center space-x-2">
                                <span>{integration.name}</span>
                                {integration.connection_status === 'connected' && (
                                  <NexBadge variant="success" size="sm">{commonT("connected")}</NexBadge>
                                )}
                                {integration.connection_status === 'disconnected' && (
                                  <NexBadge variant="secondary" size="sm">{commonT("disconnected")}</NexBadge>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-integrations" disabled>
                            {t("detail.noConnectedService")}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 소스 선택과 추가 버튼 */}
                  <div className="space-y-4">
                    {/* 소스 선택 라벨 */}
                    <label className="text-xs font-medium text-muted-foreground block">
                      {(() => {
                        const selectedIntegration = integrations.find((i: any) => i.type === newIntegration.integrationType);
                        return selectedIntegration && (selectedIntegration.type === 'github' || selectedIntegration.type === 'slack')
                          ? getSourceTypeLabel(selectedIntegration.type, commonT)
                          : commonT("source");
                      })()}
                    </label>
                    
                    {/* 소스 선택과 추가 버튼을 반응형으로 배치 */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-start">
                      <div className="flex-1 space-y-2">
                        <Select
                          value={newIntegration.sourceIdent}
                          onValueChange={(value) => setNewIntegration(prev => ({ ...prev, sourceIdent: value }))}
                          disabled={!newIntegration.integrationType || isSaving}
                        >
                          <SelectTrigger>
                            <SelectValue 
                              placeholder={
                                !newIntegration.integrationType 
                                  ? t("detail.selectService")
                                  : t("detail.selectSource")
                              } 
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSources.length > 0 ? (
                              availableSources.map((source) => (
                                <SelectItem key={source.id} value={source.name}>
                                  <div className="flex flex-col">
                                    <span>{source.name}</span>
                                    {source.description && (
                                      <span className="text-xs text-muted-foreground">{source.description}</span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))
                            ) : newIntegration.integrationType ? (
                              <SelectItem value="no-sources-available" disabled>
                                {t("detail.noAvailableSource")}
                              </SelectItem>
                            ) : null}
                          </SelectContent>
                        </Select>
                        
                        {/* 연결 상태 경고 메시지 */}
                        {(() => {
                          const selectedIntegration = integrations.find((i: any) => i.type === newIntegration.integrationType);
                          return selectedIntegration && selectedIntegration.connection_status !== 'connected' ? (
                            <div className="text-xs text-amber-600">
                              {t("detail.disconnectedService")}
                            </div>
                          ) : null;
                        })()}
                        
                        {/* 소스 제한 에러 메시지 */}
                        {sourceLimitError && (
                          <div className="text-xs text-red-600 dark:text-red-400">
                            {sourceLimitError}
                          </div>
                        )}
                      </div>

                      {/* 추가 버튼 또는 설정 버튼 */}
                      {(() => {
                        const selectedIntegration = integrations.find((i: any) => i.type === newIntegration.integrationType);
                        
                        if (selectedIntegration && selectedIntegration.connection_status !== 'connected') {
                          // 연결 해제된 경우 설정 화면으로 이동하는 버튼
                          return (
                            <NexButton
                              variant="primary"
                              size="sm"
                              leftIcon={<Settings />}
                              onClick={() => navigate('/settings/integrations')}
                              className="w-full sm:w-auto sm:min-w-[120px] cursor-pointer"
                              disabled={isSaving}
                            >
                              {t("detail.goToSettings")}
                            </NexButton>
                          );
                        }
                        
                        // 연결된 경우 추가 버튼
                        return (
                          <NexButton
                            variant="primary"
                            size="md"
                            leftIcon={<Plus />}
                            onClick={handleAddIntegrationSource}
                            disabled={!newIntegration.integrationType || !newIntegration.sourceIdent || isSaving}
                            className="w-full sm:w-auto sm:min-w-[140px] cursor-pointer font-semibold shadow-md hover:shadow-lg transition-all"
                          >
                            {commonT("add")}
                          </NexButton>
                        );
                      })()}
                    </div>
                    
                    {/* Slack 선택 시 안내 메시지 */}
                    {(() => {
                      const selectedIntegration = integrations.find((i: any) => i.type === newIntegration.integrationType);
                      return selectedIntegration?.type === 'slack' && selectedIntegration.connection_status === 'connected' && (
                        <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                          <p>{t("detail.botInvitationRequired")}</p>
                          {availableSources.length === 0 && (
                            <p className="mt-1 text-amber-600">{t("detail.inviteBotToChannel")}</p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                
                {/* Slack 비멤버 채널 후보 목록 */}
                {(() => {
                  const selectedIntegration = integrations.find((i: any) => i.type === newIntegration.integrationType);
                  return selectedIntegration?.type === 'slack' && nonMemberChannels.length > 0 && selectedIntegration?.connection_status === 'connected' && (
                    <div className="mt-6 pt-4 border-t border-muted">
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-foreground mb-1">
                          {t("detail.availableChannelCandidate")}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {t("detail.availableChannelCandidateDescription")}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {nonMemberChannels
                          .slice(0, expandedNonMemberChannels ? nonMemberChannels.length : 8)
                          .map((channel, index) => (
                            <div
                              key={channel.id || index}
                              className="flex items-center space-x-2 px-3 py-2 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30"
                            >
                              <span className="text-sm text-muted-foreground">
                                #{channel.name}
                              </span>
                              <NexBadge variant="warning" size="sm">
                                {t("detail.invitationRequired")}
                              </NexBadge>
                            </div>
                          ))}
                        {nonMemberChannels.length > 8 && (
                          <button
                            onClick={() => setExpandedNonMemberChannels(!expandedNonMemberChannels)}
                            className="text-xs text-[#5E6AD2] hover:text-[#7C89F9] dark:text-[#7C89F9] dark:hover:text-[#5E6AD2] underline cursor-pointer px-3 py-2"
                          >
                            {expandedNonMemberChannels ? commonT("collapse") : `${commonT("more")} ${nonMemberChannels.length - 8} ${commonT("numberOfChannel")}`}
                          </button>
                        )}
                      </div>
                      
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <p className="text-xs text-blue-700 dark:text-blue-300 space-y-2">
                          <strong>{t("detail.botInvitationMethod")}1:</strong> {t("detail.botInvitationMethodDescription1")}
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          <strong>{t("detail.botInvitationMethod")}2:</strong> {t("detail.botInvitationMethodDescription2")} → 
                          <code className="mx-1 px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs">
                            /invite @{t("detail.botName")}
                          </code>
                          {t("detail.botInvitationMethodDescription3")}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              {/* Onboarding: Data Sources Guide */}
              <TargetsSectionGuide
                currentSubStep={currentTargetsSubStep}
                targetSubStep="regist_sourses"
              />
            </NexCardContent>
          </NexCard>

          {/* 保存ボタン */}
          <div className="flex justify-center pt-4">
            <NexButton
              variant="primary"
              size="lg"
              onClick={handleSave}
              loading={isSaving}
              disabled={isSaving}
              className="cursor-pointer min-w-[180px]"
            >
              {isSaving ? commonT("saving") : commonT("save")}
            </NexButton>
          </div>
        </div>
      </div>
    </div>
  );
}

