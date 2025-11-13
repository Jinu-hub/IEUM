import {
    ArrowLeft,
    Calendar,
    Copy,
    Download,
    ExternalLink,
    Eye,
    FileText,
    Mail,
    RotateCcw,
    User,
    X,
    XCircle
} from 'lucide-react';
import { useState } from 'react';
import { redirect, useNavigate } from 'react-router';
import {
    NexBadge,
    NexButton,
    NexCard,
    NexCardContent,
} from '~/core/components/nex';
import makeServerClient from '~/core/lib/supa-client.server';
import { cn } from '~/core/lib/utils';
import { getWorkspace } from '~/features/settings/db/queries';
import { getSentEmail } from '../db/queries';
import { formatDetailedTime, getStatusConfig } from '../lib/common';
import type { Route } from './+types/sent-mail-detail';

export const meta = () => {
  return [{ title: `메일 상세 | ${import.meta.env.VITE_APP_NAME}` }];
};


export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const [client] = makeServerClient(request);
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return redirect('/login');
  }

  const workspace = await getWorkspace(client, { userId: user.id });
  const workspaceId = workspace[0].workspace_id;
  const editionId = params.emailId as string;
  const email = await getSentEmail(client, { workspaceId: workspaceId, editionId: editionId });
  return { email };
};

export default function SentMailDetailScreen( { loaderData }: Route.ComponentProps ) {
  const { email } = loaderData;
  const navigate = useNavigate();
  
  // HTML 미리보기 상태
  const [previewMode, setPreviewMode] = useState<'none' | 'preview' | 'html' | 'markdown'>('none');
  
  if (!email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#F1F2F4] dark:from-[#0D0E10] dark:to-[#1A1B1E] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Mail className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold text-foreground mb-2">메일을 찾을 수 없습니다</h1>
            <p className="text-muted-foreground mb-6">요청하신 메일을 찾을 수 없습니다.</p>
            <NexButton variant="primary" onClick={() => navigate('/contents/sent-mail')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로 돌아가기
            </NexButton>
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

  // MARKDOWN 코드 보기 핸들러
  const handleViewMarkdown = () => {
    setPreviewMode('markdown');
  };

  // HTML 다운로드 핸들러
  const handleDownloadHTML = () => {
    const htmlContent = email.htmlBody;
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
            <NexButton 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/contents/sent-mail')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로
            </NexButton>
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
            <NexBadge variant={statusConfig.variant} size="md">
              <StatusIcon className="h-4 w-4 mr-1" />
              {statusConfig.label}
            </NexBadge>
          </div>
        </div>

        {/* 메일 정보 카드 */}
        <NexCard variant="elevated">
          <NexCardContent className="p-0">
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
                  <NexButton variant="ghost" size="sm" onClick={handleResendEmail}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    재발송
                  </NexButton>
                  {email.providerMessageId && (
                    <NexButton 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleCopyId(email.providerMessageId!)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      ID 복사
                    </NexButton>
                  )}
                  {email.archiveUrl && (
                    <NexButton 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewArchive(email.archiveUrl!)}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      아카이브
                    </NexButton>
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
                    Nexletter &lt;info@mail.nexletter.app&gt;
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
          </NexCardContent>
        </NexCard>

        {/* 이메일 미리보기 */}
        <NexCard variant="outlined">
          <NexCardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                이메일 미리보기
              </h3>
              <div className="flex items-center space-x-2">
                <NexButton variant="ghost" size="sm" onClick={handlePreviewEmail}>
                  <Eye className="h-4 w-4 mr-1" />
                  미리보기
                </NexButton>
                <NexButton variant="ghost" size="sm" onClick={handleViewHTML}>
                  <FileText className="h-4 w-4 mr-1" />
                  HTML
                </NexButton>
                <NexButton variant="ghost" size="sm" onClick={handleDownloadHTML}>
                  <Download className="h-4 w-4 mr-1" />
                  다운로드
                </NexButton>
                <NexButton variant="ghost" size="sm" onClick={handleViewMarkdown}>
                  <FileText className="h-4 w-4 mr-1" />
                  MARKDOWN
                </NexButton>
              </div>
            </div>
            
            {previewMode === 'none' ? (
              <div className="border border-[#E1E4E8] dark:border-[#2C2D30] rounded-lg bg-white dark:bg-[#1A1B1E] min-h-[300px] flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Mail className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    버튼을 클릭하여 이메일을 미리보기하거나 HTML을 확인하세요
                  </p>
                  <NexButton variant="secondary" size="sm" onClick={handlePreviewEmail}>
                    이메일 미리보기
                  </NexButton>
                </div>
              </div>
            ) : previewMode === 'preview' ? (
              <div className="border border-[#E1E4E8] dark:border-[#2C2D30] rounded-lg bg-white dark:bg-[#1A1B1E] overflow-hidden">
                <div className="p-4 border-b border-[#E1E4E8] dark:border-[#2C2D30] bg-[#F8F9FA] dark:bg-[#2C2D30]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">이메일 미리보기</span>
                    <NexButton variant="ghost" size="sm" onClick={() => setPreviewMode('none')}>
                      <X className="h-4 w-4" />
                    </NexButton>
                  </div>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  <iframe
                    srcDoc={email.htmlBody}
                    className="w-full h-[600px] border-0"
                    title="이메일 미리보기"
                  />
                </div>
              </div>
            ) : previewMode === 'html' ? (
              <div className="border border-[#E1E4E8] dark:border-[#2C2D30] rounded-lg bg-white dark:bg-[#1A1B1E] overflow-hidden">
                <div className="p-4 border-b border-[#E1E4E8] dark:border-[#2C2D30] bg-[#F8F9FA] dark:bg-[#2C2D30]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">HTML 코드</span>
                    <NexButton variant="ghost" size="sm" onClick={() => setPreviewMode('none')}>
                      <X className="h-4 w-4" />
                    </NexButton>
                  </div>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  <pre className="text-sm text-foreground p-4 bg-[#F8F9FA] dark:bg-[#2C2D30] overflow-x-auto whitespace-pre-wrap">
                    <code>{email.htmlBody}</code>
                  </pre>
                </div>
              </div>
            ) : previewMode === 'markdown' ? (
              <div className="border border-[#E1E4E8] dark:border-[#2C2D30] rounded-lg bg-white dark:bg-[#1A1B1E] overflow-hidden">
                <div className="p-4 border-b border-[#E1E4E8] dark:border-[#2C2D30] bg-[#F8F9FA] dark:bg-[#2C2D30]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">MARKDOWN 코드</span>
                    <NexButton variant="ghost" size="sm" onClick={() => setPreviewMode('none')}>
                      <X className="h-4 w-4" />
                    </NexButton>
                  </div>
                  <div className="max-h-[600px] overflow-y-auto">
                    <pre className="text-sm text-foreground p-4 bg-[#F8F9FA] dark:bg-[#2C2D30] overflow-x-auto whitespace-pre-wrap">
                      <code>{email.textBody}</code>
                    </pre>
                  </div>
                </div>
              </div>
            ) : null}
          </NexCardContent>
        </NexCard>
      </div>
    </div>
  );
}
