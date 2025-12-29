import { logger } from "~/core/lib/logger";
import resendClient from "~/core/lib/resend-client.server";
import adminClient from "~/core/lib/supa-admin-client.server";
import type { CreateContentsInput } from "~/core/lib/types";
import { generatePeriodKey } from "~/core/processes/utils";
import { saveNewsletterEditions } from "~/features/contents/db/mutations";
import { getUniquePeriodKey } from "~/features/contents/db/queries";
import { getMailingListMembers, getUserEmail, getWorkspaceOwner } from "~/features/settings/db/queries";

/**
 * 이메일 목록을 가져오는 함수
 * @param workspaceId 워크스페이스 ID
 * @param mailingListId 메일링 리스트 ID
 * @param slackResult Slack 결과
 * @returns 이메일 목록
 */
export async function getTargetEmails(workspaceId: string, mailingListId: string, slackResult: any) {
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
    const bccEmailsArray = toEmail === ownerEmail?.email 
      ? targetEmails 
      : targetEmails.length > 1 ? targetEmails.slice(1) : [];
    
    const bccEmails = bccEmailsArray.length > 0 ? bccEmailsArray : undefined;

    logger.info('Sending email with BCC protection', {
      to: toEmail,
      isOwnerEmail: toEmail === ownerEmail?.email,
      bccCount: bccEmails?.length || 0,
      totalRecipients: targetEmails.length + (ownerEmail ? 1 : 0)
    });

    return { toEmail, bccEmails };
}

/**
 * 이메일을 전송하는 함수
 * @param input 입력 데이터
 * @param targetDisplayName 타겟 디스플레이 이름
 * @param mailingListId 메일링 리스트 ID
 * @param slackResult Slack 결과
 * @param contents 콘텐츠
 * @returns 
 */
export async function sendMails(input: CreateContentsInput, targetDisplayName: string, mailingListId: string
  , slackResult: any, contents: { finalContents: string, htmlContents: string }) {

    const { toEmail, bccEmails } = await getTargetEmails(input.workspaceId, mailingListId, slackResult) || { toEmail: undefined, bccEmails: undefined };
    
    if (!toEmail) {
      logger.error('To email not found', { workspaceId: input.workspaceId, mailingListId });
      return;
    }

    const subject = `${targetDisplayName} Weekly Newsletter`;
    //to: "jinu35@ymail.ne.jp",
    const sendResult = await resendClient.emails.send({
      from: "Nexletter <info@mail.nexone.ink>",
      to: "takefree.withu@gmail.com",
      bcc: 'son@digitalsheep.co.jp',
      subject: subject,
      html: contents.htmlContents,
    });

    let status;
    let failureReason;
    if (sendResult.error) {
      logger.error('Failed to send email', { error: sendResult.error, toEmail });
      status = 'failed';
      failureReason = sendResult.error.message;
    } else {
      logger.info('Email sent successfully', { emailId: sendResult.data?.id, toEmail });
      status = 'delivered';
      failureReason = null;
    }

    const statsJson: any = {
      count: 1 + (bccEmails?.length || 0),
      to: toEmail,
      bcc: bccEmails,
      range: input.range,
    };

    const period = input.period;
    const basePeriodKey = generatePeriodKey(period, input.from);
    const periodKey = await getUniquePeriodKey(adminClient, input.workspaceId, basePeriodKey, 'newsletter_editions');

    await saveNewsletterEditions(adminClient, { 
      workspaceId: input.workspaceId,
      runId: input.runId,
      targetId: input.targetId,
      subject: subject,
      htmlBody: contents.htmlContents,
      textBody: contents.finalContents,
      statsJson: statsJson,
      sentAt: new Date().toISOString(),
      status: status,
      providerMessageId: sendResult.data?.id || '',
      failureReason: failureReason,
      period: period,
      periodKey: periodKey,
    });
    

}


export async function sendWarmingUpEmail(toEmail: string, bccEmails: string[], subject: string, html: string) {
  const sendResult = await resendClient.emails.send({
    from: "Nexletter <info@mail.nexone.ink>",
    to: toEmail,
    bcc: bccEmails,
    subject: subject,
    html: html,
  });
  return sendResult;
}