import type { Database } from "database.types";
import { logger } from "~/core/lib/logger";
import resendClient from "~/core/lib/resend-client.server";
import adminClient from "~/core/lib/supa-admin-client.server";
import type { CreateContentsInput } from "~/core/lib/types";
import { generatePeriodKey } from "~/core/processes/lib/utils";
import { claimDailyEdition, finishEdition } from "~/features/contents/db/mutations";
import { getUniquePeriodKey } from "~/features/contents/db/queries";
import { getMailingListMembers, getUserEmail, getWorkspaceOwner } from "~/features/settings/db/queries";
import { recordRuns } from "./run-record";

/**
 * 이메일 목록을 가져오는 함수
 * @param workspaceId 워크스페이스 ID
 * @param mailingListId 메일링 리스트 ID
 * @param slackResult Slack 결과
 * @param planType 플랜 타입
 * @param maxMembers 최대 멤버 수
 * @returns 이메일 목록과 잘림 여부
 */
export async function getTargetEmails(
  workspaceId: string, 
  mailingListId: string, 
  slackResult: any,
  planType: Database["public"]["Enums"]["plan_type"],
  maxMembers: number = 0
) {
    let emailList: string[] = [];

    if (slackResult) {
        const slackEmails = Object.values(slackResult)
          .map((channel: any) => channel.emailList || [])
          .flat()
          .filter((email: string) => email && email.trim() !== ''); 
        logger.info('Slack emails', { slackEmails });
        emailList.push(...slackEmails);
    }

    if (mailingListId) {
      const members = await getMailingListMembers(adminClient, { mailingListId: mailingListId });
      console.log('members', members);
      if (members.length > 0) {
        logger.info('Mailing list members found', { mailingListId, members: members.length });
        emailList.push(...members.map((member: any) => member.email));
      } else {
        logger.info('Mailing list members not found', { mailingListId });
      }
    }

    // 중복 제거 및 최종 이메일 목록
    const targetEmails = [...new Set(emailList)].filter(email => email && email.trim() !== '');
    logger.info('Final email list', { 
      totalEmails: emailList.length, 
      uniqueEmails: targetEmails.length,
      emails: targetEmails 
    });

    const workspaceOwner = await getWorkspaceOwner(adminClient, { workspaceId: workspaceId });
    logger.info('workspaceOwner', { workspaceOwner });
    const ownerEmail = await getUserEmail(adminClient, { userId: workspaceOwner.user_id });
    logger.info('ownerEmail', { ownerEmail });

    // ownerEmail이 있으면 to에 설정, 없으면 targetEmails[0]
    const toEmail = ownerEmail?.email || targetEmails[0];
    
    if (!toEmail) {
      logger.error('To email not found', { workspaceId, mailingListId });
      return;
    }

    // ownerEmail이 to로 설정되면 targetEmails에서 제거
    let bccEmailsArray = toEmail === ownerEmail?.email 
      ? targetEmails 
      : targetEmails.length > 1 ? targetEmails.slice(1) : [];
    
    let isCut = false;

    const originalCount = bccEmailsArray.length;
    
    if (maxMembers > 0) {
      if (originalCount > maxMembers) {
        logger.info('BCC emails exceeded limit, cutting', {
          originalCount: originalCount,
          maxMembers: maxMembers,
          planType: planType
        });
        bccEmailsArray = bccEmailsArray.slice(0, maxMembers);
        isCut = true;
      }
    }
    
    const bccEmails = bccEmailsArray.length > 0 ? bccEmailsArray : undefined;

    logger.info('Sending email with BCC protection', {
      to: toEmail,
      isOwnerEmail: toEmail === ownerEmail?.email,
      bccCount: bccEmails?.length || 0,
      totalRecipients: targetEmails.length + (ownerEmail ? 1 : 0),
      isCut: isCut
    });

    return { toEmail, bccEmails, isCut, originalCount };
}

/**
 * 이메일을 전송하는 함수
 * @param input 입력 데이터
 * @param subject 메일 제목
 * @param mailingListId 메일링 리스트 ID
 * @param slackResult Slack 결과
 * @param contents 콘텐츠
 * @param planType 플랜 타입
 * @param maxMembers 최대 멤버 수
 * @param daily 보낼 Daily Report와 강제 재발송 여부
 * @returns 메일이 나갔으면 true. 받는 사람이 없거나, 같은 daily core의 메일이 이미 있어 건너뛰었거나, 발송이 실패하면 false
 */
export async function sendMails(
  input: CreateContentsInput, 
  subject: string, 
  mailingListId: string,
  slackResult: any, 
  contents: { finalContents: string, htmlContents: string },
  planType: Database["public"]["Enums"]["plan_type"],
  maxMembers: number,
  daily: { dailyCoreId: string; dailyReportId: string; forced: boolean }
): Promise<boolean> {

    const { toEmail, bccEmails, isCut, originalCount } = await getTargetEmails(input.workspaceId, mailingListId, slackResult, planType, maxMembers) || { toEmail: undefined, bccEmails: undefined, isCut: false, originalCount: 0 };
    
    if (!toEmail) {
      logger.error('To email not found', { workspaceId: input.workspaceId, mailingListId });
      return false;
    }

    const statsJson: any = {
      count: 1 + (bccEmails?.length || 0),
      original_count: 1 + originalCount,
      to: toEmail,
      bcc: bccEmails,
      range: input.range,
    };

    // 발송 전에 edition을 sending으로 넣어 그 날의 발송권을 잡는다. 이미 있으면(다른 실행이 보냈거나 보내는 중) 보내지 않는다.
    const edition = recordRuns()
      ? await claimDailyEdition(adminClient, {
          workspaceId: input.workspaceId,
          runId: input.runId,
          targetId: input.targetId,
          subject,
          htmlBody: contents.htmlContents,
          textBody: contents.finalContents,
          statsJson,
          periodKey: await getUniquePeriodKey(adminClient, input.workspaceId, generatePeriodKey(input.period, input.from), 'newsletter_editions'),
          ...daily,
        })
      : undefined;
    if (edition === null) {
      logger.warn('Daily mail already sent or sending, skipping', { dailyCoreId: daily.dailyCoreId });
      return false;
    }

    // A throw here would leave the claimed edition `sending` and block the day, so it is recorded as a failure.
    let sendResult: { data: { id: string } | null; error: { message: string } | null };
    try {
      //to: "jinu35@ymail.ne.jp",
      sendResult = await resendClient.emails.send({
        from: "IEUM <info@mail.nexone.ink>",
        to: "takefree.withu@gmail.com",
        bcc: 'son@digitalsheep.co.jp',
        subject: subject,
        html: contents.htmlContents,
      });
    } catch (error) {
      sendResult = { data: null, error: { message: error instanceof Error ? error.message : String(error) } };
    }

    if (sendResult.error) {
      logger.error('Failed to send email', { error: sendResult.error, toEmail });
    } else {
      logger.info('Email sent successfully', { emailId: sendResult.data?.id, toEmail });
    }

    if (edition) {
      await finishEdition(adminClient, {
        editionId: edition.edition_id,
        // bccEmails가 잘렸으면 status를 'partial'로 설정
        status: sendResult.error ? 'failed' : isCut ? 'partial' : 'delivered',
        providerMessageId: sendResult.data?.id || '',
        failureReason: sendResult.error?.message ?? null,
        sentAt: new Date().toISOString(),
      });
    }

    return !sendResult.error;
}


export async function sendWarmingUpEmail(toEmail: string, bccEmails: string[], subject: string, html: string) {
  const sendResult = await resendClient.emails.send({
    from: "IEUM <info@mail.nexone.ink>",
    to: toEmail,
    bcc: bccEmails,
    subject: subject,
    html: html,
  });
  return sendResult;
}