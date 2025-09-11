import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { useNavigate, useParams, useSubmit, useActionData, useNavigation, type LoaderFunctionArgs } from 'react-router';
import { 
  LinearCard, 
  LinearCardContent,
  LinearButton,
  LinearBadge,
  LinearInput,
  LinearToggle,
} from '~/core/components/linear';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/core/components/ui/select";
import { ArrowLeft, Plus, X, Clock, Target as TargetIcon, Settings } from 'lucide-react';
import { sampleTargets, sampleMailingLists, scheduleTypes, weekdays, hours, minutes, monthDays } from '../lib/mockdata';
import type { TargetData } from '../lib/types';
import {
  getSourceTypeLabel,
  getNonMemberSlackChannels,  
} from '../lib/common';
import { useIntegrationSources } from '../hooks/useIntegrationSources';
import { 
  parseCronExpression,
  generateCronExpression
} from '../lib/scheduleUtils';
import { getIntegrationsInfo, getMailingList, getTarget, getWorkspace } from '../db/queries';
import { createTargetWithSources } from '../db/mutations';
import makeServerClient from '~/core/lib/supa-client.server';
import { redirect } from 'react-router';
import type { Route } from "./+types/target-detail";

export const meta = ({ params }: { params: { targetId: string } }) => {
  const isNew = params.targetId === 'new';
  return [{ title: `${isNew ? '새 타겟 추가' : '타겟 편집'} | ${import.meta.env.VITE_APP_NAME}` }];
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

  const targetId = params.targetId;
  if (targetId && targetId !== 'new') {
    const target = await getTarget(client, { targetId: targetId || '' });
    return { workspaceId, target, mailingLists, integrations };
  } else {
    return { workspaceId, target: null, mailingLists, integrations };
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
      // Form 데이터 파싱
      const targetData = {
        targetId: formData.get('targetId') as string,
        displayName: formData.get('displayName') as string,
        isActive: formData.get('isActive') === 'true',
        scheduleCron: formData.get('scheduleCron') as string || '',
        mailingListId: formData.get('mailingListId') as string || '',
        timezone: formData.get('timezone') as string || 'Asia/Seoul',
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

      // 성공 메시지 구성
      let message: string[] = [`타겟 "${targetData.displayName}"이(가) 성공적으로 저장되었습니다.`];
      if (result.totalSources > 0) {
        message.push(`${result.successfulSources}/${result.totalSources} 소스 연결 성공`);
      }
      if (result.failedSources > 0) {
        message.push(`일부 소스 연결에 실패했습니다.`);
      }

      return {
        status: 'success',
        message: message, // 배열 그대로 전달
        showToast: true,
        redirectTo: '/settings/targets',
        redirectDelay: 500
      };
    }

    return {
      status: 'error',
      message: 'Invalid action type'
    };

  } catch (error) {
    console.error('Target save error:', error);
    
    // 에러 메시지 상세화
    let errorMessage = '저장 중 오류가 발생했습니다.';
    if (error instanceof Error) {
      if (error.message.includes('uuid')) {
        errorMessage = '잘못된 데이터 형식입니다. 다시 시도해주세요.';
      } else if (error.message.includes('duplicate')) {
        errorMessage = '이미 존재하는 데이터입니다.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      status: 'error',
      message: errorMessage,
      error: true
    };
  }
};

export default function TargetDetailScreen( { loaderData }: Route.ComponentProps ) {
  const { workspaceId, target, mailingLists, integrations } = loaderData;
  const navigate = useNavigate();
  const submit = useSubmit();
  const actionData = useActionData();
  const navigation = useNavigation();
  const { targetId } = useParams();
  const isNew = targetId === 'new';

  // 저장 상태
  const [isSaving, setIsSaving] = useState(false);
  // 에러 처리 상태 (중복 alert 방지)
  const [processedActionData, setProcessedActionData] = useState(null);

  // 폼 상태
  const [formData, setFormData] = useState<Partial<TargetData>>({
    displayName: '',
    isActive: true,
    scheduleCron: '',
    mailingListName: '',
    timezone: 'Asia/Seoul',
  });

  // 타겟 편집 시 기존 데이터로 폼 초기화
  useEffect(() => {
    if (target && !isNew) {
      setFormData({
        targetId: target.target_id,
        displayName: target.display_name,
        isActive: target.is_active,
        scheduleCron: target.schedule_cron ?? '',
        lastSentAt: target.last_sent_at ?? '',
        //mailingListName: target.mailing_list_name ?? '',
        mailingListId: target.mailing_list_id ?? '',
        timezone: target.timezone,
      });

      // 스케줄 정보가 있으면 UI 상태도 초기화
      if (target.schedule_cron) {
        const parsedSchedule = parseCronExpression(target.schedule_cron);
        setScheduleType(parsedSchedule.scheduleType);
        setSelectedHour(parsedSchedule.hour);
        setSelectedMinute(parsedSchedule.minute);
        setSelectedWeekday(parsedSchedule.weekday || '1');
        setSelectedMonthDay(parsedSchedule.monthDay || '1');
        setCustomCron(parsedSchedule.customCron || '');
      }
    }
  }, [target, isNew]);

  // 스케줄 관련 상태
  const [scheduleType, setScheduleType] = useState('manual');
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
  
  // 커스텀 훅으로 integration 소스 관리
  const {
    integrationSources,
    availableSources,
    setAvailableSources,
    updateAvailableSources,
    handleAddSource,
    handleRemoveSource,
  } = useIntegrationSources(integrations);
  
  // 비멤버 Slack 채널 목록
  const [nonMemberChannels, setNonMemberChannels] = useState<any[]>([]);
  
  // 비멤버 채널 목록 확장 상태
  const [expandedNonMemberChannels, setExpandedNonMemberChannels] = useState(false);

  // 데이터 로드
  useEffect(() => {
    if (!isNew && targetId) {
      const target = sampleTargets.find(t => t.targetId === targetId);
      if (target) {
        setFormData(target);
        // scheduleCron 값을 파싱해서 UI 상태 설정
        if (!target.scheduleCron) {
          setScheduleType('manual');
        } else {
          const parsed = parseCronExpression(target.scheduleCron);
          
          setScheduleType(parsed.scheduleType);
          setSelectedHour(parsed.hour);
          setSelectedMinute(parsed.minute);
          
          if (parsed.weekday) {
            setSelectedWeekday(parsed.weekday);
          }
          if (parsed.monthDay) {
            setSelectedMonthDay(parsed.monthDay);
          }
          if (parsed.customCron) {
            setCustomCron(parsed.customCron);
          }
        }
      }
    }
  }, [targetId, isNew]);

  // Action 결과 및 Navigation 상태 모니터링
  useEffect(() => {
    // Navigation 상태로 저장 상태 관리
    const isSubmitting = navigation.state === 'submitting';
    setIsSaving(isSubmitting);

    // Action 결과 처리 (중복 방지)
    if (actionData && !isSubmitting && actionData !== processedActionData) {
      if (actionData.error || actionData.status === 'error') {
        // 에러 처리
        toast.error(actionData.message || '저장 중 오류가 발생했습니다.');
        setIsSaving(false);
        setProcessedActionData(actionData); // 처리 완료 표시
      } else if (actionData.status === 'success') {
        // 성공 처리
        if (actionData.showToast && actionData.message) {
          // Toast 표시 (배열을 직접 처리)
          const messageLines = Array.isArray(actionData.message) 
            ? actionData.message 
            : [actionData.message];

          toast.success(
            <div className="text-left whitespace-pre-wrap">
              {messageLines.join('\n')}
            </div>
          );
          
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
      minute: selectedMinute,
      weekday: selectedWeekday,
      monthDay: selectedMonthDay,
      customCron
    });
    handleInputChange('scheduleCron', cronString);
  };

  // 시간/분/요일/일자 변경 핸들러
  const handleScheduleDetailChange = () => {
    if (scheduleType !== 'custom' && scheduleType !== 'manual') {
      const cronString = generateCronExpression({
        scheduleType: scheduleType as 'daily' | 'weekly' | 'monthly' | 'custom',
        hour: selectedHour,
        minute: selectedMinute,
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
  }, [selectedHour, selectedMinute, selectedWeekday, selectedMonthDay, scheduleType]);

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

  // 인테그레이션 소스 추가 핸들러
  const handleAddIntegrationSource = () => {
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
      alert('타겟 이름을 입력해주세요.');
      return;
    }

    // FormData 객체 생성
    const submitFormData = new FormData();
    submitFormData.append('actionType', 'save');
    submitFormData.append('targetId', formData.targetId || '');
    submitFormData.append('displayName', formData.displayName);
    submitFormData.append('isActive', formData.isActive ? 'true' : 'false');
    submitFormData.append('scheduleCron', formData.scheduleCron || '');
    submitFormData.append('mailingListId', formData.mailingListId || '');
    submitFormData.append('timezone', formData.timezone || 'Asia/Seoul');
    
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
        {/* 헤더 섹션 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <LinearButton
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft />}
              onClick={handleGoBack}
            >
              뒤로
            </LinearButton>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-[#0D0E10] dark:text-[#FFFFFF]">
                {isNew ? '새 타겟 추가' : '타겟 편집'}
              </h1>
              <p className="text-lg text-[#8B92B5] dark:text-[#6C6F7E]">
                뉴스레터 발송 타겟의 설정을 구성하세요.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <LinearBadge variant={formData.isActive ? "success" : "secondary"} size="md">
              {formData.isActive ? "활성" : "비활성"}
            </LinearBadge>
            <LinearButton
              variant="primary"
              onClick={handleSave}
              loading={isSaving}
              disabled={isSaving}
            >
              {isSaving ? '저장 중...' : '저장'}
            </LinearButton>
          </div>
        </div>

        {/* 메인 폼 */}
        <div className="grid gap-6">
          {/* 기본 정보 섹션 */}
          <LinearCard variant="outlined">
            <LinearCardContent className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TargetIcon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">기본 정보</h2>
              </div>

              <div className="grid gap-6">
                {/* 표시명 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">표시명</label>
                  <LinearInput
                    placeholder="타겟 이름을 입력하세요"
                    value={formData.displayName || ''}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    disabled={isSaving}
                  />
                </div>

                {/* 활성 상태 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">활성 상태</label>
                  <LinearToggle
                    checked={formData.isActive || false}
                    onChange={(checked) => handleInputChange('isActive', checked)}
                    label={formData.isActive ? '활성' : '비활성'}
                    variant="success"
                    size="md"
                    disabled={isSaving}
                  />
                </div>

                {/* 메일링 리스트 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">송신 대상</label>
                  <Select
                    value={formData.mailingListName || ''}
                    onValueChange={(value) => handleInputChange('mailingListName', value)}
                    disabled={isSaving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="메일링 리스트를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {sampleMailingLists.map((list) => (
                        <SelectItem key={list.id} value={list.name}>
                          {list.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </LinearCardContent>
          </LinearCard>

          {/* 스케줄 섹션 */}
          <LinearCard variant="outlined">
            <LinearCardContent className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">발송 스케줄</h2>
              </div>

              <div className="space-y-6">
                {/* 스케줄 타입 선택 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">스케줄 타입</label>
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

                {/* 시간 설정 (수동 발송이 아닌 경우) */}
                {scheduleType !== 'manual' && scheduleType !== 'custom' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-foreground">발송 시각</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">시</label>
                        <Select 
                          value={selectedHour} 
                          onValueChange={setSelectedHour}
                          disabled={isSaving}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {hours.map((hour) => (
                              <SelectItem key={hour.value} value={hour.value}>
                                {hour.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">분</label>
                        <Select 
                          value={selectedMinute} 
                          onValueChange={setSelectedMinute}
                          disabled={isSaving}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {minutes.map((minute) => (
                              <SelectItem key={minute.value} value={minute.value}>
                                {minute.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* 요일 설정 (주간 스케줄인 경우) */}
                {scheduleType === 'weekly' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">요일</label>
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
                )}

                {/* 일자 설정 (월간 스케줄인 경우) */}
                {scheduleType === 'monthly' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">날짜</label>
                    <Select 
                      value={selectedMonthDay} 
                      onValueChange={setSelectedMonthDay}
                      disabled={isSaving}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {monthDays.map((day) => (
                          <SelectItem key={day.value} value={day.value}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      * 월말 (29일, 30일, 31일)이 없는 달에는 해당 월의 마지막 날에 발송됩니다.
                    </p>
                  </div>
                )}

                {/* 커스텀 Cron 입력 */}
                {scheduleType === 'custom' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Cron 표현식</label>
                    <LinearInput
                      placeholder="예: 0 9 * * 1 (매주 월요일 9시)"
                      value={customCron}
                      onChange={(e) => handleCustomCronChange(e.target.value)}
                      disabled={isSaving}
                    />
                    <p className="text-xs text-muted-foreground">
                      Cron 형식: 분 시간 일 월 요일 (예: 0 9 * * 1)
                    </p>
                  </div>
                )}

                {/* 스케줄 미리보기 */}
                {scheduleType !== 'manual' && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-foreground mb-2">스케줄 미리보기</h4>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {scheduleType === 'daily' && `매일 ${selectedHour.padStart(2, '0')}:${selectedMinute.padStart(2, '0')}`}
                        {scheduleType === 'weekly' && `매주 ${weekdays.find(d => d.value === selectedWeekday)?.label} ${selectedHour.padStart(2, '0')}:${selectedMinute.padStart(2, '0')}`}
                        {scheduleType === 'monthly' && `매월 ${selectedMonthDay}일 ${selectedHour.padStart(2, '0')}:${selectedMinute.padStart(2, '0')}`}
                        {scheduleType === 'custom' && (customCron || '유효한 Cron 표현식을 입력하세요')}
                      </span>
                    </div>
                    {formData.scheduleCron && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Cron: <code className="bg-background px-1 py-0.5 rounded">{formData.scheduleCron}</code>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </LinearCardContent>
          </LinearCard>

          {/* 인테그레이션 소스 섹션 */}
          <LinearCard variant="outlined">
            <LinearCardContent className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">데이터 소스</h2>
              </div>

              {/* 기존 인테그레이션 소스 목록 */}
              {integrationSources.length > 0 && (
                <div className="space-y-3 mb-6">
                  {integrationSources.map((source) => {
                    const integration = integrations.find((i: any) => i.type === source.integrationType);
                    return (
                      <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <LinearBadge variant="secondary" size="sm">
                            {integration?.name}
                          </LinearBadge>
                          <span className="text-sm text-foreground">{source.sourceIdent}</span>
                          {integration?.type === 'github' && (
                            <span className="text-xs text-muted-foreground">레포지토리</span>
                          )}
                          {integration?.type === 'slack' && (
                            <span className="text-xs text-muted-foreground">채널</span>
                          )}
                        </div>
                        <LinearButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSource(source.id)}
                          disabled={isSaving}
                        >
                          <X className="h-4 w-4" />
                        </LinearButton>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 새 인테그레이션 소스 추가 */}
              <div className="space-y-4 p-4 border-2 border-dashed border-muted rounded-lg">
                <h3 className="text-sm font-medium text-foreground">새 데이터 소스 추가</h3>
                
                <div className="space-y-6">
                  {/* 연결된 서비스 선택 */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">연결된 서비스</label>
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
                        <SelectValue placeholder="연결된 서비스를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {integrations.length > 0 ? (
                          integrations.map((integration: any) => (
                            <SelectItem key={integration.type} value={integration.type}>
                              <div className="flex items-center space-x-2">
                                <span>{integration.name}</span>
                                {integration.connection_status === 'connected' && (
                                  <LinearBadge variant="success" size="sm">연결됨</LinearBadge>
                                )}
                                {integration.connection_status === 'disconnected' && (
                                  <LinearBadge variant="secondary" size="sm">연결안됨</LinearBadge>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-integrations" disabled>
                            연결된 서비스가 없습니다
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
                          ? getSourceTypeLabel(selectedIntegration.type)
                          : '소스';
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
                                  ? "먼저 서비스를 선택하세요"
                                  : "소스를 선택하세요"
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
                                사용 가능한 소스가 없습니다
                              </SelectItem>
                            ) : null}
                          </SelectContent>
                        </Select>
                        
                        {/* 연결 상태 경고 메시지 */}
                        {(() => {
                          const selectedIntegration = integrations.find((i: any) => i.type === newIntegration.integrationType);
                          return selectedIntegration && selectedIntegration.connection_status !== 'connected' ? (
                            <div className="text-xs text-amber-600">
                              선택한 서비스가 연결 해제되었습니다. 먼저 연결을 완료하세요.
                            </div>
                          ) : null;
                        })()}
                      </div>

                      {/* 추가 버튼 또는 설정 버튼 */}
                      {(() => {
                        const selectedIntegration = integrations.find((i: any) => i.type === newIntegration.integrationType);
                        
                        if (selectedIntegration && selectedIntegration.connection_status !== 'connected') {
                          // 연결 해제된 경우 설정 화면으로 이동하는 버튼
                          return (
                            <LinearButton
                              variant="primary"
                              size="sm"
                              leftIcon={<Settings />}
                              onClick={() => navigate('/settings/integrations')}
                              className="w-full sm:w-auto sm:min-w-[120px] cursor-pointer"
                              disabled={isSaving}
                            >
                              연결 설정으로 이동
                            </LinearButton>
                          );
                        }
                        
                        // 연결된 경우 추가 버튼
                        return (
                          <LinearButton
                            variant="secondary"
                            size="sm"
                            leftIcon={<Plus />}
                            onClick={handleAddIntegrationSource}
                            disabled={!newIntegration.integrationType || !newIntegration.sourceIdent || isSaving}
                            className="w-full sm:w-auto sm:min-w-[120px] cursor-pointer"
                          >
                            추가
                          </LinearButton>
                        );
                      })()}
                    </div>
                    
                    {/* Slack 선택 시 안내 메시지 */}
                    {(() => {
                      const selectedIntegration = integrations.find((i: any) => i.type === newIntegration.integrationType);
                      return selectedIntegration?.type === 'slack' && selectedIntegration.connection_status === 'connected' && (
                        <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                          <p>💡 봇이 초대된 채널만 데이터 수집이 가능합니다.</p>
                          {availableSources.length === 0 && (
                            <p className="mt-1 text-amber-600">아래 후보 채널에서 봇을 초대해주세요.</p>
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
                          사용 가능한 채널 후보
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          아래 채널들에 봇을 초대하면 데이터 소스로 사용할 수 있습니다.
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
                              <LinearBadge variant="warning" size="sm">
                                초대 필요
                              </LinearBadge>
                            </div>
                          ))}
                        {nonMemberChannels.length > 8 && (
                          <button
                            onClick={() => setExpandedNonMemberChannels(!expandedNonMemberChannels)}
                            className="text-xs text-[#5E6AD2] hover:text-[#7C89F9] dark:text-[#7C89F9] dark:hover:text-[#5E6AD2] underline cursor-pointer px-3 py-2"
                          >
                            {expandedNonMemberChannels ? '축소하기' : `+${nonMemberChannels.length - 8}개 더 보기`}
                          </button>
                        )}
                      </div>
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          <strong>봇 초대 방법:</strong> Slack에서 원하는 채널로 이동 → 
                          <code className="mx-1 px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs">
                            /invite @봇이름
                          </code>
                          입력 → 봇이 채널에 추가되면 자동으로 위 목록에서 사라집니다.
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </LinearCardContent>
          </LinearCard>
        </div>
      </div>
    </div>
  );
}

