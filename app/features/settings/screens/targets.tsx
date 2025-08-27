import React, { useState } from 'react';
import { 
  LinearCard, 
  LinearCardTitle, 
  LinearCardDescription, 
  LinearCardContent,
  LinearButton,
  LinearBadge,
  PlusIcon,
} from '~/core/components/linear';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/core/components/ui/dropdown-menu";
import { Target, Clock, Mail, MoreVertical, Power, PowerOff, Trash2, Edit, Copy } from 'lucide-react';
import { cn } from '~/core/lib/utils';
import type { Route } from "./+types/targets";
import { sampleTargets } from '../lib/mockdata';
import type { TargetData } from '../lib/types';

export const meta: Route.MetaFunction = () => {
  return [{ title: `타겟 | ${import.meta.env.VITE_APP_NAME}` }];
};

// 스케줄 표시용 포맷 함수
const formatSchedule = (cron?: string): string => {
  if (!cron) return "수동 발송";
  
  // 간단한 cron 문자열 해석
  const parts = cron.split(' ');
  if (parts.length !== 5) return cron;
  
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  
  if (dayOfWeek !== '*' && dayOfMonth === '*') {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const dayIndex = parseInt(dayOfWeek);
    return `매주 ${days[dayIndex]}요일 ${hour}:${minute.padStart(2, '0')}`;
  }
  
  if (dayOfMonth !== '*' && dayOfWeek === '*') {
    return `매월 ${dayOfMonth}일 ${hour}:${minute.padStart(2, '0')}`;
  }
  
  return `매일 ${hour}:${minute.padStart(2, '0')}`;
};

// 마지막 발송 시각 포맷 함수
const formatLastSent = (lastSentAt?: string): string => {
  if (!lastSentAt) return "미발송";
  
  const date = new Date(lastSentAt);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  } else if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  } else if (diffInDays < 7) {
    return `${diffInDays}일 전`;
  } else {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
};

export default function TargetsScreen() {
  const [targets, setTargets] = useState<TargetData[]>(sampleTargets);

  // 활성 상태 토글
  const toggleTargetActive = (targetId: string) => {
    setTargets(prev => 
      prev.map(target => 
        target.targetId === targetId 
          ? { ...target, isActive: !target.isActive }
          : target
      )
    );
  };

  // 타겟 추가 핸들러
  const handleAddTarget = () => {
    // TODO: 타겟 추가 모달 또는 페이지로 이동
    console.log("타겟 추가 구현 예정");
  };

  // 타겟 삭제 핸들러
  const handleDeleteTarget = (targetId: string) => {
    if (confirm("정말로 이 타겟을 삭제하시겠습니까?")) {
      setTargets(prev => prev.filter(target => target.targetId !== targetId));
      console.log("타겟 삭제됨:", targetId);
    }
  };

  // 타겟 편집 핸들러
  const handleEditTarget = (targetId: string) => {
    // TODO: 타겟 편집 모달 또는 페이지로 이동
    console.log("타겟 편집:", targetId);
  };

  // 타겟 복사 핸들러
  const handleCopyTarget = (targetId: string) => {
    // TODO: 타겟 복사 기능 구현
    console.log("타겟 복사:", targetId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#F1F2F4] dark:from-[#0D0E10] dark:to-[#1A1B1E] p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 헤더 섹션 */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-[#0D0E10] dark:text-[#FFFFFF]">
              타겟 관리
            </h1>
            <p className="text-lg text-[#8B92B5] dark:text-[#6C6F7E]">
              뉴스레터 발송 타겟을 생성하고 관리하세요.
            </p>
          </div>
          
          <LinearBadge variant="info" size="md">
            {targets.length}개의 타겟
          </LinearBadge>
        </div>

        {/* 타겟 리스트 */}
        <div className="grid gap-4">
          {targets.length === 0 ? (
            /* 빈 상태 */
            <LinearCard variant="outlined" className="text-center py-12">
              <LinearCardContent>
                <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <LinearCardTitle className="mb-2">타겟이 없습니다</LinearCardTitle>
                <LinearCardDescription className="mb-6">
                  첫 번째 뉴스레터 타겟을 추가해주세요
                </LinearCardDescription>
                <LinearButton 
                  variant="primary" 
                  leftIcon={<PlusIcon />}
                  onClick={handleAddTarget}
                >
                  타겟 추가
                </LinearButton>
              </LinearCardContent>
            </LinearCard>
          ) : (
            /* 타겟 카드 리스트 */
            targets.map((target) => (
              <LinearCard 
                key={target.targetId} 
                variant="elevated" 
                hoverable
                className="transition-all duration-200"
              >
                <LinearCardContent className="p-6">
                  <div className="flex items-center justify-between">
                    {/* 좌측: 타겟 정보 */}
                    <div className="flex items-start space-x-4 flex-1">
                      {/* 활성 상태 인디케이터 */}
                      <div className="flex flex-col items-center space-y-2">
                        <button
                          onClick={() => toggleTargetActive(target.targetId)}
                          className={cn(
                            "p-2 rounded-full transition-colors duration-200",
                            target.isActive 
                              ? "bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400" 
                              : "bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-500"
                          )}
                          title={target.isActive ? "활성 - 클릭하여 비활성화" : "비활성 - 클릭하여 활성화"}
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
                          <LinearBadge 
                            variant={target.isActive ? "success" : "secondary"}
                            size="sm"
                          >
                            {target.isActive ? "활성" : "비활성"}
                          </LinearBadge>
                        </div>

                        {/* 타겟 정보 그리드 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          {/* 스케줄 */}
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="font-medium">스케줄:</span>
                              <div className="text-muted-foreground">
                                {formatSchedule(target.scheduleCron)}
                              </div>
                            </div>
                          </div>

                          {/* 메일링 리스트 */}
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="font-medium">송신 대상:</span>
                              <div className="text-muted-foreground">
                                {target.mailingListName || "미설정"}
                              </div>
                            </div>
                          </div>

                          {/* 마지막 발송 시각 */}
                          <div className="flex items-center space-x-2">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="font-medium">마지막 발송:</span>
                              <div className="text-muted-foreground">
                                {formatLastSent(target.lastSentAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                                        {/* 우측: 액션 버튼 */}
                    <div className="flex items-center space-x-2 ml-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <LinearButton
                              variant="ghost"
                              size="sm"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </LinearButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem 
                              onClick={() => handleEditTarget(target.targetId)}
                              className="flex items-center space-x-2"
                            >
                              <Edit className="h-4 w-4" />
                              <span>편집</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleCopyTarget(target.targetId)}
                              className="flex items-center space-x-2"
                            >
                              <Copy className="h-4 w-4" />
                              <span>복사</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteTarget(target.targetId)}
                              className="flex items-center space-x-2 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>삭제</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  </div>
                </LinearCardContent>
              </LinearCard>
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
          "dark:focus:ring-offset-background"
        )}
        title="새 타겟 추가"
      >
        <PlusIcon className="h-6 w-6" />
      </button>
    </div>
  );
}
