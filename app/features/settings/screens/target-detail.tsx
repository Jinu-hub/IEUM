import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
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
import { sampleTargets, sampleIntegrations, sampleGitHubRepos, 
    sampleSlackChannels, sampleMailingLists, scheduleTypes, weekdays, hours, minutes, monthDays } from '../lib/mockdata';
import type { TargetData, IntegrationSource } from '../lib/types';


export const meta = ({ params }: { params: { targetId: string } }) => {
  const isNew = params.targetId === 'new';
  return [{ title: `${isNew ? '새 타겟 추가' : '타겟 편집'} | ${import.meta.env.VITE_APP_NAME}` }];
};

export default function TargetDetailScreen() {
  const navigate = useNavigate();
  const { targetId } = useParams();
  const isNew = targetId === 'new';

  // 폼 상태
  const [formData, setFormData] = useState<Partial<TargetData>>({
    displayName: '',
    isActive: true,
    scheduleCron: '',
    mailingListName: '',
    timezone: 'Asia/Seoul',
  });

  // 스케줄 관련 상태
  const [scheduleType, setScheduleType] = useState('manual');
  const [selectedHour, setSelectedHour] = useState('9');
  const [selectedMinute, setSelectedMinute] = useState('0');
  const [selectedWeekday, setSelectedWeekday] = useState('1'); // 월요일
  const [selectedMonthDay, setSelectedMonthDay] = useState('1');
  const [customCron, setCustomCron] = useState('');

  // 인테그레이션 소스 상태
  const [integrationSources, setIntegrationSources] = useState<IntegrationSource[]>([]);

  // 새 인테그레이션 소스 상태
  const [newIntegration, setNewIntegration] = useState({
    integrationId: '',
    sourceType: '',
    sourceIdent: '',
  });

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
          const cronParts = target.scheduleCron.split(' ');
          if (cronParts.length === 5) {
            const [minute, hour, dayOfMonth, month, dayOfWeek] = cronParts;
            
            setSelectedHour(hour);
            setSelectedMinute(minute);
            
            if (dayOfWeek !== '*' && dayOfMonth === '*') {
              // 주간 스케줄
              setScheduleType('weekly');
              setSelectedWeekday(dayOfWeek);
            } else if (dayOfMonth !== '*' && dayOfWeek === '*') {
              // 월간 스케줄
              setScheduleType('monthly');
              setSelectedMonthDay(dayOfMonth);
            } else if (dayOfMonth === '*' && dayOfWeek === '*') {
              // 일간 스케줄
              setScheduleType('daily');
            } else {
              // 커스텀
              setScheduleType('custom');
              setCustomCron(target.scheduleCron);
            }
          } else {
            setScheduleType('custom');
            setCustomCron(target.scheduleCron);
          }
        }

        // 샘플 인테그레이션 소스 (실제로는 API에서 가져와야 함)
        setIntegrationSources([
          { id: '1', integrationId: '1', sourceType: 'github_repo', sourceIdent: 'facebook/react' },
        ]);
      }
    }
  }, [targetId, isNew]);

  // 뒤로 가기
  const handleGoBack = () => {
    navigate('/settings/targets');
  };

  // 폼 입력 핸들러
  const handleInputChange = (field: keyof TargetData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Cron 문자열 생성 함수
  const generateCronString = () => {
    const minute = selectedMinute;
    const hour = selectedHour;
    
    switch (scheduleType) {
      case 'manual':
        return '';
      case 'daily':
        return `${minute} ${hour} * * *`;
      case 'weekly':
        return `${minute} ${hour} * * ${selectedWeekday}`;
      case 'monthly':
        return `${minute} ${hour} ${selectedMonthDay} * *`;
      case 'custom':
        return customCron;
      default:
        return '';
    }
  };

  // 스케줄 타입 변경 핸들러
  const handleScheduleTypeChange = (value: string) => {
    setScheduleType(value);
    const cronString = generateCronString();
    handleInputChange('scheduleCron', cronString);
  };

  // 시간/분/요일/일자 변경 핸들러
  const handleScheduleDetailChange = () => {
    if (scheduleType !== 'custom' && scheduleType !== 'manual') {
      const cronString = generateCronString();
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

  // 인테그레이션 소스 추가
  const handleAddIntegrationSource = () => {
    if (newIntegration.integrationId && newIntegration.sourceIdent) {
      const integration = sampleIntegrations.find(i => i.id === newIntegration.integrationId);
      const sourceType = integration?.type === 'github' ? 'github_repo' : 'slack_channel';
      
      const newSource: IntegrationSource = {
        id: Date.now().toString(),
        integrationId: newIntegration.integrationId,
        sourceType,
        sourceIdent: newIntegration.sourceIdent,
      };

      setIntegrationSources(prev => [...prev, newSource]);
      setNewIntegration({ integrationId: '', sourceType: '', sourceIdent: '' });
    }
  };

  // 인테그레이션 소스 제거
  const handleRemoveIntegrationSource = (id: string) => {
    setIntegrationSources(prev => prev.filter(source => source.id !== id));
  };

  // 저장 핸들러
  const handleSave = () => {
    // TODO: 실제 저장 로직 구현
    console.log('저장할 데이터:', formData);
    console.log('인테그레이션 소스:', integrationSources);
    
    // 임시로 targets 페이지로 이동
    navigate('/settings/targets');
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
            >
              저장
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
                  />
                </div>

                {/* 메일링 리스트 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">송신 대상</label>
                  <Select
                    value={formData.mailingListName || ''}
                    onValueChange={(value) => handleInputChange('mailingListName', value)}
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
                  <Select value={scheduleType} onValueChange={handleScheduleTypeChange}>
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
                    const integration = sampleIntegrations.find(i => i.id === source.integrationId);
                    return (
                      <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <LinearBadge variant="secondary" size="sm">
                            {integration?.name}
                          </LinearBadge>
                          <span className="text-sm text-foreground">{source.sourceIdent}</span>
                        </div>
                        <LinearButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveIntegrationSource(source.id)}
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 인테그레이션 선택 */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">인테그레이션</label>
                    <Select
                      value={newIntegration.integrationId}
                      onValueChange={(value) => setNewIntegration(prev => ({ 
                        ...prev, 
                        integrationId: value,
                        sourceIdent: '' // 인테그레이션이 바뀌면 소스도 초기화
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {sampleIntegrations.map((integration) => (
                          <SelectItem key={integration.id} value={integration.id}>
                            {integration.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 소스 선택 (인테그레이션에 따라 다름) */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      {newIntegration.integrationId === '1' ? '레포지토리' : 
                       newIntegration.integrationId === '2' ? '채널' : '소스'}
                    </label>
                    <Select
                      value={newIntegration.sourceIdent}
                      onValueChange={(value) => setNewIntegration(prev => ({ ...prev, sourceIdent: value }))}
                      disabled={!newIntegration.integrationId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {newIntegration.integrationId === '1' && // GitHub
                          sampleGitHubRepos.map((repo) => (
                            <SelectItem key={repo.id} value={repo.name}>
                              {repo.name}
                            </SelectItem>
                          ))
                        }
                        {newIntegration.integrationId === '2' && // Slack
                          sampleSlackChannels.map((channel) => (
                            <SelectItem key={channel.id} value={channel.name}>
                              {channel.name}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 추가 버튼 */}
                  <div className="flex items-end">
                    <LinearButton
                      variant="secondary"
                      size="sm"
                      leftIcon={<Plus />}
                      onClick={handleAddIntegrationSource}
                      disabled={!newIntegration.integrationId || !newIntegration.sourceIdent}
                      className="w-full"
                    >
                      추가
                    </LinearButton>
                  </div>
                </div>
              </div>
            </LinearCardContent>
          </LinearCard>
        </div>
      </div>
    </div>
  );
}
