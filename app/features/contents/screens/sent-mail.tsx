import React, { useState } from 'react';
import { 
  LinearCard, 
  LinearCardContent,
  LinearButton,
  LinearBadge,
  LinearInput,
} from '~/core/components/linear';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/core/components/ui/dropdown-menu";
import { 
  Mail, 
  Search, 
  MoreVertical, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Copy,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { cn } from '~/core/lib/utils';
// Route 타입은 React Router에서 자동 생성됩니다
import type { SentEmailData, EmailStatus } from '../lib/types';
import { formatTime } from '../lib/common';
import { sampleSentEmails, createStatusFilters } from '../lib/mackData';

export const meta = () => {
  return [{ title: `보낸 메일 | ${import.meta.env.VITE_APP_NAME}` }];
};

// 메일 상태별 설정 (MVP용 단순화)
const getStatusConfig = (status: EmailStatus) => {
  switch (status) {
    case 'sent':
      return {
        icon: Clock,
        label: '발송됨',
        variant: 'info' as const,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-950',
      };
    case 'delivered':
      return {
        icon: CheckCircle,
        label: '배송 완료',
        variant: 'success' as const,
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-950',
      };
    case 'failed':
      return {
        icon: XCircle,
        label: '배송 실패',
        variant: 'error' as const,
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-950',
      };
  }
};

export default function SentMailScreen() {
  const [sentEmails, setSentEmails] = useState<SentEmailData[]>(sampleSentEmails);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // 상태별 필터 옵션 생성
  const statusFilters = createStatusFilters(sentEmails);

  // 검색 및 필터링
  const filteredEmails = sentEmails.filter(email => {
    const matchesSearch = 
      email.targetTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || email.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  // 메일 재발송 핸들러
  const handleResendEmail = (emailId: string) => {
    console.log('메일 재발송:', emailId);
    // TODO: 메일 재발송 로직 구현
  };

  // 메일 ID 복사 핸들러
  const handleCopyId = (messageId: string) => {
    navigator.clipboard.writeText(messageId);
    console.log('메시지 ID 복사됨:', messageId);
  };

  // 아카이브 링크 열기 핸들러
  const handleViewArchive = (archiveUrl: string) => {
    window.open(archiveUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#F1F2F4] dark:from-[#0D0E10] dark:to-[#1A1B1E] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 헤더 섹션 */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-[#0D0E10] dark:text-[#FFFFFF]">
              보낸 메일
            </h1>
            <p className="text-lg text-[#8B92B5] dark:text-[#6C6F7E]">
              발송된 이메일의 배송 상태 및 통계를 확인하세요.
            </p>
          </div>
          
          <LinearBadge variant="info" size="md">
            {filteredEmails.length}개의 이메일
          </LinearBadge>
        </div>

        {/* 검색 및 필터 섹션 */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* 검색창 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <LinearInput
              placeholder="대상 또는 제목으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 상태 필터 */}
          <div className="flex gap-2 flex-wrap">
            {statusFilters.map((filter) => (
              <LinearButton
                key={filter.value}
                variant={selectedStatus === filter.value ? "primary" : "ghost"}
                size="sm"
                onClick={() => setSelectedStatus(filter.value)}
                className="whitespace-nowrap"
              >
                {filter.label}
                <LinearBadge
                  variant={selectedStatus === filter.value ? "secondary" : "outline"}
                  size="sm"
                  className="ml-2"
                >
                  {filter.count}
                </LinearBadge>
              </LinearButton>
            ))}
          </div>
        </div>

        {/* 이메일 리스트 */}
        <div className="space-y-0 bg-white dark:bg-[#1A1B1E] rounded-lg border border-[#E1E4E8] dark:border-[#2C2D30] overflow-hidden">
          {/* 헤더 */}
          <div className="px-6 py-4 border-b border-[#E1E4E8] dark:border-[#2C2D30] bg-[#F8F9FA] dark:bg-[#1A1B1E]">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-[#6C6F7E] dark:text-[#B4B5B9]">
              <div className="col-span-1">상태</div>
              <div className="col-span-3">대상</div>
              <div className="col-span-4">제목</div>
              <div className="col-span-2">발송 시간</div>
              <div className="col-span-2 text-right">액션</div>
            </div>
          </div>

          {/* 이메일 목록 */}
          {filteredEmails.length === 0 ? (
            <div className="px-6 py-12 text-center">
              {searchTerm || selectedStatus !== 'all' ? (
                <div className="space-y-4">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      검색 결과가 없습니다
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      검색 조건을 확인하고 다시 시도해주세요.
                    </p>
                    <LinearButton 
                      variant="secondary" 
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedStatus('all');
                      }}
                    >
                      필터 초기화
                    </LinearButton>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Mail className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      보낸 메일이 없습니다
                    </h3>
                    <p className="text-muted-foreground">
                      아직 발송된 이메일이 없습니다.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            filteredEmails.map((email, index) => {
              const statusConfig = getStatusConfig(email.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <div 
                  key={email.id}
                  className={cn(
                    "px-6 py-4 hover:bg-[#F8F9FA] dark:hover:bg-[#2C2D30] transition-colors",
                    index !== filteredEmails.length - 1 && "border-b border-[#E1E4E8] dark:border-[#2C2D30]"
                  )}
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* 상태 */}
                    <div className="col-span-1">
                      <div className={cn("p-2 rounded-full w-fit", statusConfig.bgColor)}>
                        <StatusIcon className={cn("h-4 w-4", statusConfig.color)} />
                      </div>
                    </div>

                    {/* 대상 */}
                    <div className="col-span-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Mail className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-foreground truncate">
                          {email.targetTitle}
                        </span>
                      </div>
                    </div>

                    {/* 제목 */}
                    <div className="col-span-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {email.subject}
                        </p>
                        <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                          <LinearBadge variant={statusConfig.variant} size="sm">
                            {statusConfig.label}
                          </LinearBadge>
                          {email.failureReason && (
                            <span className="text-red-600 text-xs">
                              {email.failureReason}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 발송 시간 */}
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(email.sentAt)}</span>
                      </div>
                    </div>

                    {/* 액션 */}
                    <div className="col-span-2 flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <LinearButton variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </LinearButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem 
                            onClick={() => handleResendEmail(email.id)}
                            className="flex items-center space-x-2"
                          >
                            <RotateCcw className="h-4 w-4" />
                            <span>재발송</span>
                          </DropdownMenuItem>
                          {email.providerMessageId && (
                            <DropdownMenuItem 
                              onClick={() => handleCopyId(email.providerMessageId!)}
                              className="flex items-center space-x-2"
                            >
                              <Copy className="h-4 w-4" />
                              <span>메시지 ID 복사</span>
                            </DropdownMenuItem>
                          )}
                          {email.archiveUrl && (
                            <DropdownMenuItem 
                              onClick={() => handleViewArchive(email.archiveUrl!)}
                              className="flex items-center space-x-2"
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span>아카이브 보기</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 통계 요약 (MVP용 단순화) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statusFilters.filter(f => f.value !== 'all').map((filter) => {
            const statusConfig = getStatusConfig(filter.value as EmailStatus);
            const StatusIcon = statusConfig.icon;
            
            return (
              <LinearCard key={filter.value} variant="outlined" hoverable>
                <LinearCardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={cn("p-2 rounded-full", statusConfig.bgColor)}>
                      <StatusIcon className={cn("h-5 w-5", statusConfig.color)} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {filter.label}
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {filter.count}
                      </p>
                    </div>
                  </div>
                </LinearCardContent>
              </LinearCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
