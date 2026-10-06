import {
  ArrowLeft,
  Calendar,
  Check,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Mail,
  User,
  X,
  XCircle,
  Zap
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation("common", { keyPrefix: "common" });
  const { t: sentMailT } = useTranslation("common", { keyPrefix: "sentMail" });
  const { i18n } = useTranslation();
  
  // HTML 미리보기 상태
  const [previewMode, setPreviewMode] = useState<'none' | 'preview' | 'html' | 'markdown'>('none');
  
  // ID 복사 상태
  const [copied, setCopied] = useState(false);
  
  // HTML/Markdown 내용 복사 상태
  const [contentCopied, setContentCopied] = useState(false);
  
  if (!email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#F1F2F4] dark:from-[#0D0E10] dark:to-[#1A1B1E] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Mail className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold text-foreground mb-2">{sentMailT("detail.noSentMail")}</h1>
            <p className="text-muted-foreground mb-6">{sentMailT("detail.noSentMailDescription")}</p>
            <NexButton variant="primary" className="cursor-pointer" onClick={() => navigate('/contents/sent-mail')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("back")}
            </NexButton>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(email.status, t);
  const StatusIcon = statusConfig.icon;
  const statsJson = email.statsJson as { count: number, original_count: number };

  // 메일 재발송 핸들러
  const handleResendEmail = () => {
    console.log('메일 재발송:', email.id);
    // TODO: 메일 재발송 로직 구현
  };

  // 메일 ID 복사 핸들러
  const handleCopyId = (messageId: string) => {
    navigator.clipboard.writeText(messageId);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  // HTML/Markdown 내용 복사 핸들러
  const handleCopyContent = () => {
    const content = previewMode === 'html' ? email.htmlBody : email.textBody;
    navigator.clipboard.writeText(content);
    setContentCopied(true);
    setTimeout(() => {
      setContentCopied(false);
    }, 3000);
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
              className="cursor-pointer"
              onClick={() => navigate('/contents/sent-mail')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("back")}
            </NexButton>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-[#0D0E10] dark:text-[#FFFFFF]">
                {sentMailT("detail.mailDetail")}
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
                      {t("mail.messageId")}: {email.providerMessageId}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/*
                  <NexButton variant="ghost" size="sm" onClick={handleResendEmail}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    {t("mail.resend")}
                  </NexButton>
                  */}
                  {email.providerMessageId && (
                    <NexButton 
                      variant={copied ? "primary" : "secondary"}
                      size="sm"
                      className="cursor-pointer transition-all"
                      onClick={() => handleCopyId(email.providerMessageId!)}
                      disabled={copied}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          {t("mail.copied")}
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          {t("mail.idCopy")}
                        </>
                      )}
                    </NexButton>
                  )}
                  {email.archiveUrl && (
                    <NexButton 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewArchive(email.archiveUrl!)}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      {t("mail.archive")}
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
                    IEUM &lt;info@mail.nexletter.app&gt;
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
                    <span className="text-sm font-medium text-muted-foreground">{t("mail.subject")}</span>
                  </div>
                  <p className="text-sm text-foreground">
                    {email.subject}
                  </p>
                </div>

                {/* 발송 시간 */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">{t("mail.sentAt")}</span>
                  </div>
                  <p className="text-sm text-foreground">
                    {formatDetailedTime(email.sentAt, i18n.language)}
                  </p>
                </div>
              </div>

              {/* 이메일 이벤트 상태 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium text-muted-foreground">{t("mail.emailEvent")}</h4>
                </div>
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
                        {formatDetailedTime(email.sentAt, i18n.language)}
                      </span>
                    </div>
                    {email.status === 'partial' && statsJson && (
                      <span className="text-sm text-muted-foreground">
                        {t("mail.result", { count: statsJson.count, originalCount: statsJson.original_count })}
                      </span>
                    )}
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
                        {t("mail.status.failed")}
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
                {t("mail.previewEmail")}
              </h3>
              <div className="flex items-center space-x-2">
                <NexButton variant="ghost" size="sm" className="cursor-pointer" onClick={handlePreviewEmail}>
                  <Eye className="h-4 w-4 mr-1" />
                  {t("preview")}
                </NexButton>
                <NexButton variant="ghost" size="sm" className="cursor-pointer" onClick={handleViewHTML}>
                  <FileText className="h-4 w-4 mr-1" />
                  HTML
                </NexButton>
                <NexButton variant="ghost" size="sm" className="cursor-pointer" onClick={handleDownloadHTML}>
                  <Download className="h-4 w-4 mr-1" />
                  {t("download")}
                </NexButton>
                <NexButton variant="ghost" size="sm" className="cursor-pointer" onClick={handleViewMarkdown}>
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
                    {sentMailT("detail.previewEmailDescription")}
                  </p>
                  <NexButton variant="secondary" className="cursor-pointer" size="sm" onClick={handlePreviewEmail}>
                    {t("mail.previewEmail")}
                  </NexButton>
                </div>
              </div>
            ) : previewMode === 'preview' ? (
              <div className="border border-[#E1E4E8] dark:border-[#2C2D30] rounded-lg bg-white dark:bg-[#1A1B1E] overflow-hidden">
                <div className="p-4 border-b border-[#E1E4E8] dark:border-[#2C2D30] bg-[#F8F9FA] dark:bg-[#2C2D30]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{t("mail.previewEmail")}</span>
                    <NexButton variant="ghost" className="cursor-pointer" size="sm" onClick={() => setPreviewMode('none')}>
                      <X className="h-4 w-4" />
                    </NexButton>
                  </div>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  <iframe
                    srcDoc={email.htmlBody}
                    className="w-full h-[600px] border-0"
                    title={t("mail.previewEmail")}
                  />
                </div>
              </div>
            ) : previewMode === 'html' ? (
              <div className="border border-[#E1E4E8] dark:border-[#2C2D30] rounded-lg bg-white dark:bg-[#1A1B1E] overflow-hidden">
                <div className="p-4 border-b border-[#E1E4E8] dark:border-[#2C2D30] bg-[#F8F9FA] dark:bg-[#2C2D30]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">HTML {t("code")}</span>
                    <div className="flex items-center space-x-2">
                      <NexButton 
                        variant={contentCopied ? "primary" : "secondary"}
                        size="sm"
                        className="cursor-pointer transition-all"
                        onClick={handleCopyContent}
                        disabled={contentCopied}
                      >
                        {contentCopied ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            {t("mail.copied")}
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            {t("copy")}
                          </>
                        )}
                      </NexButton>
                      <NexButton variant="ghost" size="sm" className="cursor-pointer" onClick={() => setPreviewMode('none')}>
                        <X className="h-4 w-4" />
                      </NexButton>
                    </div>
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
                    <span className="text-sm font-medium text-foreground">MARKDOWN {t("code")}</span>
                    <div className="flex items-center space-x-2">
                      <NexButton 
                        variant={contentCopied ? "primary" : "secondary"}
                        size="sm"
                        className="cursor-pointer transition-all"
                        onClick={handleCopyContent}
                        disabled={contentCopied}
                      >
                        {contentCopied ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            {t("mail.copied")}
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            {t("copy")}
                          </>
                        )}
                      </NexButton>
                      <NexButton variant="ghost" size="sm" className="cursor-pointer" onClick={() => setPreviewMode('none')}>
                        <X className="h-4 w-4" />
                      </NexButton>
                    </div>
                  </div>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  <pre className="text-sm text-foreground p-4 bg-[#F8F9FA] dark:bg-[#2C2D30] overflow-x-auto whitespace-pre-wrap">
                    <code>{email.textBody}</code>
                  </pre>
                </div>
              </div>
            ) : null}
          </NexCardContent>
        </NexCard>
      </div>
    </div>
  );
}
