import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useFetcher } from 'react-router';
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
import type { TargetData, IntegrationSource } from '../lib/types';
import type {
  ConnectedIntegration,
  SourceItem,
} from '../lib/common';
import {
  getConnectedIntegrations,
  getSourcesForIntegration,
  getSourceTypeLabel,
  handleGitHubFetcherResponse,
  handleSlackFetcherResponse,
  getNonMemberSlackChannels,
} from '../lib/common';


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

  // 인테그레이션 연결 상태
  const [githubStatus, setGithubStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [slackStatus, setSlackStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [githubData, setGithubData] = useState<any>(null);
  const [slackData, setSlackData] = useState<any>(null);
  
  // 연결된 인테그레이션 목록
  const [connectedIntegrations, setConnectedIntegrations] = useState<ConnectedIntegration[]>([]);
  
  // API 호출을 위한 fetcher
  const githubFetcher = useFetcher();
  const slackFetcher = useFetcher();
  
  // 사용 가능한 소스 목록
  const [availableSources, setAvailableSources] = useState<SourceItem[]>([]);
  
  // 비멤버 Slack 채널 목록
  const [nonMemberChannels, setNonMemberChannels] = useState<any[]>([]);
  
  // 비멤버 채널 목록 확장 상태
  const [expandedNonMemberChannels, setExpandedNonMemberChannels] = useState(false);

  // 인테그레이션 데이터 로드
  useEffect(() => {
    // GitHub 상태 확인
    githubFetcher.load('/api/settings/github-integration');
    // Slack 상태 확인  
    slackFetcher.load('/api/settings/slack-integration');
  }, []);

  // GitHub fetcher 응답 처리
  useEffect(() => {
    handleGitHubFetcherResponse(githubFetcher.data, setGithubStatus, setGithubData);
  }, [githubFetcher.data]);

  // Slack fetcher 응답 처리
  useEffect(() => {
    handleSlackFetcherResponse(slackFetcher.data, setSlackStatus, setSlackData);
  }, [slackFetcher.data]);

  // 연결된 인테그레이션 목록 업데이트
  useEffect(() => {
    const integrations = getConnectedIntegrations(githubStatus, githubData, slackStatus, slackData);
    setConnectedIntegrations(integrations);
  }, [githubStatus, githubData, slackStatus, slackData]);

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

  // 인테그레이션 선택 시 소스 로드
  useEffect(() => {
    if (newIntegration.integrationId) {
      const sources = getSourcesForIntegration(newIntegration.integrationId, connectedIntegrations);
      setAvailableSources(sources);
      
      // Slack인 경우 비멤버 채널도 가져오기
      const integration = connectedIntegrations.find(i => i.id === newIntegration.integrationId);
      if (integration?.type === 'slack' && integration.data?.channels) {
        const nonMembers = getNonMemberSlackChannels(integration.data.channels);
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
  }, [newIntegration.integrationId, connectedIntegrations]);

  // 인테그레이션 소스 추가
  const handleAddIntegrationSource = () => {
    if (
      newIntegration.integrationId && 
      newIntegration.sourceIdent &&
      newIntegration.integrationId !== 'no-integrations' &&
      newIntegration.sourceIdent !== 'no-sources-available'
    ) {
      const integration = connectedIntegrations.find(i => i.id === newIntegration.integrationId);
      const sourceType = integration?.type === 'github' ? 'github_repo' : 'slack_channel';
      
      const newSource: IntegrationSource = {
        id: Date.now().toString(),
        integrationId: newIntegration.integrationId,
        sourceType,
        sourceIdent: newIntegration.sourceIdent,
      };

      setIntegrationSources(prev => [...prev, newSource]);
      setNewIntegration({ integrationId: '', sourceType: '', sourceIdent: '' });
      setAvailableSources([]); // 소스 목록 초기화
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
                    const integration = connectedIntegrations.find(i => i.id === source.integrationId);
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
                  {/* 연결된 서비스 선택 */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">연결된 서비스</label>
                    <Select
                      value={newIntegration.integrationId}
                      onValueChange={(value) => setNewIntegration(prev => ({ 
                        ...prev, 
                        integrationId: value,
                        sourceIdent: '' // 서비스가 바뀌면 소스도 초기화
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="연결된 서비스를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {connectedIntegrations.length > 0 ? (
                          connectedIntegrations.map((integration) => (
                            <SelectItem key={integration.id} value={integration.id}>
                              <div className="flex items-center space-x-2">
                                <span>{integration.name}</span>
                                <LinearBadge variant="success" size="sm">연결됨</LinearBadge>
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

                  {/* 소스 선택 (선택된 서비스에 따라 동적으로 로드) */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      {(() => {
                        const selectedIntegration = connectedIntegrations.find(i => i.id === newIntegration.integrationId);
                        return selectedIntegration ? getSourceTypeLabel(selectedIntegration.type) : '소스';
                      })()}
                    </label>
                    <Select
                      value={newIntegration.sourceIdent}
                      onValueChange={(value) => setNewIntegration(prev => ({ ...prev, sourceIdent: value }))}
                      disabled={!newIntegration.integrationId}
                    >
                      <SelectTrigger>
                        <SelectValue 
                          placeholder={
                            !newIntegration.integrationId 
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
                        ) : newIntegration.integrationId ? (
                          <SelectItem value="no-sources-available" disabled>
                            사용 가능한 소스가 없습니다
                          </SelectItem>
                        ) : null}
                      </SelectContent>
                    </Select>
                    
                    {/* Slack 선택 시 안내 메시지 */}
                    {(() => {
                      const selectedIntegration = connectedIntegrations.find(i => i.id === newIntegration.integrationId);
                      return selectedIntegration?.type === 'slack' && (
                        <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                          <p>💡 봇이 초대된 채널만 데이터 수집이 가능합니다.</p>
                          {availableSources.length === 0 && (
                            <p className="mt-1 text-amber-600">아래 후보 채널에서 봇을 초대해주세요.</p>
                          )}
                        </div>
                      );
                    })()}
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
                
                {/* Slack 비멤버 채널 후보 목록 */}
                {(() => {
                  const selectedIntegration = connectedIntegrations.find(i => i.id === newIntegration.integrationId);
                  return selectedIntegration?.type === 'slack' && nonMemberChannels.length > 0 && (
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
