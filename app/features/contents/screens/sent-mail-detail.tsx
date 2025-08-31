import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  LinearCard, 
  LinearCardContent,
  LinearButton,
  LinearBadge,
} from '~/core/components/linear';
import { 
  ArrowLeft,
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Copy,
  ExternalLink,
  RotateCcw,
  Eye,
  Calendar,
  User,
  FileText,
  Download,
  X
} from 'lucide-react';
import { cn } from '~/core/lib/utils';
import type { SentEmailData, EmailStatus } from '../lib/types';
import { formatTime, formatDetailedTime } from '../lib/common';
import { sampleSentEmails } from '../lib/mackData';
import { sampleEmailHTML } from '~/features/settings/lib/mockdata';

export const meta = () => {
  return [{ title: `메일 상세 | ${import.meta.env.VITE_APP_NAME}` }];
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
        label: '송신 완료',
        variant: 'success' as const,
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-950',
      };
    case 'failed':
      return {
        icon: XCircle,
        label: '송신 실패',
        variant: 'error' as const,
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-950',
      };
  }
};

export default function SentMailDetailScreen() {
  const { emailId } = useParams();
  const navigate = useNavigate();
  
  // HTML 미리보기 상태
  const [previewMode, setPreviewMode] = useState<'none' | 'preview' | 'html'>('none');
  
  // 실제로는 API에서 가져올 데이터
  const email = sampleSentEmails.find(e => e.id === emailId);
  
  if (!email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#F1F2F4] dark:from-[#0D0E10] dark:to-[#1A1B1E] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Mail className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold text-foreground mb-2">메일을 찾을 수 없습니다</h1>
            <p className="text-muted-foreground mb-6">요청하신 메일을 찾을 수 없습니다.</p>
            <LinearButton variant="primary" onClick={() => navigate('/contents/sent-mail')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로 돌아가기
            </LinearButton>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(email.status);
  const StatusIcon = statusConfig.icon;

  // 메일 재발송 핸들러
  const handleResendEmail = () => {
    console.log('메일 재발송:', email.id);
    // TODO: 메일 재발송 로직 구현
  };

  // 메일 ID 복사 핸들러
  const handleCopyId = (messageId: string) => {
    navigator.clipboard.writeText(messageId);
    console.log('메시지 ID 복사됨:', messageId);
  };

  // HTML 미리보기 핸들러
  const handlePreviewEmail = () => {
    setPreviewMode('preview');
  };

  // HTML 코드 보기 핸들러
  const handleViewHTML = () => {
    setPreviewMode('html');
  };

  // HTML 다운로드 핸들러
  const handleDownloadHTML = () => {
    const htmlContent = getEmailHTML();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-${email.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 이메일 HTML 내용 가져오기
  const getEmailHTML = () => {
    // 실제로는 이메일 데이터에서 HTML을 가져와야 함
    // 여기서는 샘플 데이터를 사용
    const mailingListName = email.targetTitle || '';
    
    if (mailingListName.includes('기술 뉴스')) {
      return sampleEmailHTML.techNewsletter;
    } else if (mailingListName.includes('제품 업데이트')) {
      return sampleEmailHTML.productUpdate;
    } else if (mailingListName.includes('긴급 공지사항')) {
      return sampleEmailHTML.emergencyAlert;
    }
    
    // 기본 HTML
    return sampleEmailHTML.techNewsletter;
  };

  // 아카이브 링크 열기 핸들러
  const handleViewArchive = (archiveUrl: string) => {
    window.open(archiveUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#F1F2F4] dark:from-[#0D0E10] dark:to-[#1A1B1E] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 헤더 섹션 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <LinearButton 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/contents/sent-mail')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로
            </LinearButton>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-[#0D0E10] dark:text-[#FFFFFF]">
                메일 상세
              </h1>
              <p className="text-sm text-[#8B92B5] dark:text-[#6C6F7E]">
                {email.targetTitle}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <LinearBadge variant={statusConfig.variant} size="md">
              <StatusIcon className="h-4 w-4 mr-1" />
              {statusConfig.label}
            </LinearBadge>
          </div>
        </div>

        {/* 메일 정보 카드 */}
        <LinearCard variant="elevated">
          <LinearCardContent className="p-0">
            {/* 메일 헤더 */}
            <div className="border-b border-[#E1E4E8] dark:border-[#2C2D30] bg-[#F8F9FA] dark:bg-[#1A1B1E] p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className={cn("p-3 rounded-full", statusConfig.bgColor)}>
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h2 className="text-lg font-semibold text-foreground">
                        {email.subject}
                      </h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      메시지 ID: {email.providerMessageId}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <LinearButton variant="ghost" size="sm" onClick={handleResendEmail}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    재발송
                  </LinearButton>
                  {email.providerMessageId && (
                    <LinearButton 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleCopyId(email.providerMessageId!)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      ID 복사
                    </LinearButton>
                  )}
                  {email.archiveUrl && (
                    <LinearButton 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewArchive(email.archiveUrl!)}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      아카이브
                    </LinearButton>
                  )}
                </div>
              </div>
            </div>

            {/* 메일 메타데이터 */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* FROM */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">FROM</span>
                  </div>
                  <p className="text-sm text-foreground">
                    LinkVerse &lt;hello@mail.linkverse.app&gt;
                  </p>
                </div>

                {/* TO */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">TO</span>
                  </div>
                  <p className="text-sm text-foreground">
                    {email.targetTitle}
                  </p>
                </div>

                {/* SUBJECT */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">SUBJECT</span>
                  </div>
                  <p className="text-sm text-foreground">
                    {email.subject}
                  </p>
                </div>

                {/* 발송 시간 */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">발송 시간</span>
                  </div>
                  <p className="text-sm text-foreground">
                    {formatDetailedTime(email.sentAt)}
                  </p>
                </div>
              </div>

              {/* 이메일 이벤트 상태 */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">이메일 이벤트</h4>
                <div className="flex items-center space-x-4 p-4 bg-[#F8F9FA] dark:bg-[#2C2D30] rounded-lg">
                  <div className={cn("p-2 rounded-full", statusConfig.bgColor)}>
                    <StatusIcon className={cn("h-4 w-4", statusConfig.color)} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        {statusConfig.label}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatDetailedTime(email.sentAt)}
                      </span>
                    </div>
                    {email.failureReason && (
                      <p className="text-sm text-red-600 mt-1">
                        {email.failureReason}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 실패 사유 (실패한 경우에만) */}
              {email.failureReason && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                        발송 실패
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        {email.failureReason}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </LinearCardContent>
        </LinearCard>

        {/* 이메일 미리보기 */}
        <LinearCard variant="outlined">
          <LinearCardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                이메일 미리보기
              </h3>
              <div className="flex items-center space-x-2">
                <LinearButton variant="ghost" size="sm" onClick={handlePreviewEmail}>
                  <Eye className="h-4 w-4 mr-1" />
                  미리보기
                </LinearButton>
                <LinearButton variant="ghost" size="sm" onClick={handleViewHTML}>
                  <FileText className="h-4 w-4 mr-1" />
                  HTML
                </LinearButton>
                <LinearButton variant="ghost" size="sm" onClick={handleDownloadHTML}>
                  <Download className="h-4 w-4 mr-1" />
                  다운로드
                </LinearButton>
              </div>
            </div>
            
            {previewMode === 'none' ? (
              <div className="border border-[#E1E4E8] dark:border-[#2C2D30] rounded-lg bg-white dark:bg-[#1A1B1E] min-h-[300px] flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Mail className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    버튼을 클릭하여 이메일을 미리보기하거나 HTML을 확인하세요
                  </p>
                  <LinearButton variant="secondary" size="sm" onClick={handlePreviewEmail}>
                    이메일 미리보기
                  </LinearButton>
                </div>
              </div>
            ) : previewMode === 'preview' ? (
              <div className="border border-[#E1E4E8] dark:border-[#2C2D30] rounded-lg bg-white dark:bg-[#1A1B1E] overflow-hidden">
                <div className="p-4 border-b border-[#E1E4E8] dark:border-[#2C2D30] bg-[#F8F9FA] dark:bg-[#2C2D30]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">이메일 미리보기</span>
                    <LinearButton variant="ghost" size="sm" onClick={() => setPreviewMode('none')}>
                      <X className="h-4 w-4" />
                    </LinearButton>
                  </div>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  <iframe
                    srcDoc={getEmailHTML()}
                    className="w-full h-[600px] border-0"
                    title="이메일 미리보기"
                  />
                </div>
              </div>
            ) : (
              <div className="border border-[#E1E4E8] dark:border-[#2C2D30] rounded-lg bg-white dark:bg-[#1A1B1E] overflow-hidden">
                <div className="p-4 border-b border-[#E1E4E8] dark:border-[#2C2D30] bg-[#F8F9FA] dark:bg-[#2C2D30]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">HTML 코드</span>
                    <LinearButton variant="ghost" size="sm" onClick={() => setPreviewMode('none')}>
                      <X className="h-4 w-4" />
                    </LinearButton>
                  </div>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  <pre className="text-sm text-foreground p-4 bg-[#F8F9FA] dark:bg-[#2C2D30] overflow-x-auto whitespace-pre-wrap">
                    <code>{getEmailHTML()}</code>
                  </pre>
                </div>
              </div>
            )}
          </LinearCardContent>
        </LinearCard>
      </div>
    </div>
  );
}
