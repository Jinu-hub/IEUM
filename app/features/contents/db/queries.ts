import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

export const getSentEmailList = async (
  client: SupabaseClient<Database>,
  { workspaceId }: { workspaceId: string },
) => {
  const { data, error } = await client
    .from('newsletter_editions')
    .select(`
      edition_id,
      subject,
      sent_at,
      status,
      provider_message_id,
      archive_url,
      failure_reason,
      target_id,
      targets!inner (
        display_name
      )
    `)
    .eq('workspace_id', workspaceId)
    .order('sent_at', { ascending: false });
  if (error) {
    console.log('getNewsletterEditions error', error);
    throw error;
  }

  return data.map(sentEmail => ({
    id: sentEmail.edition_id,
    targetId: sentEmail.target_id,
    targetTitle: sentEmail.targets.display_name,
    subject: sentEmail.subject || '제목 없음',
    sentAt: sentEmail.sent_at || new Date().toISOString(),
    status: sentEmail.status,
    providerMessageId: sentEmail.provider_message_id || undefined,
    archiveUrl: sentEmail.archive_url || undefined,
    failureReason: sentEmail.failure_reason || undefined,
  }));
  
};


export const getSentEmail = async (
  client: SupabaseClient<Database>,
  { workspaceId, editionId }: { workspaceId: string, editionId: string },
) => {
  const { data, error } = await client
    .from('newsletter_editions')
    .select(`
      edition_id,
      subject,
      sent_at,
      status,
      provider_message_id,
      archive_url,
      failure_reason,
      target_id,
      html_body,
      text_body,
      targets!inner (
        display_name
      )
    `)
    .eq('workspace_id', workspaceId)
    .eq('edition_id', editionId)
    .single();
  if (error) {
    console.log('getSentEmail error', error);
    throw error;
  }
  return {
    id: data.edition_id,
    targetId: data.target_id,
    targetTitle: data.targets.display_name,
    subject: data.subject || '제목 없음',
    sentAt: data.sent_at || new Date().toISOString(),
    status: data.status,
    providerMessageId: data.provider_message_id || undefined,
    archiveUrl: data.archive_url || undefined,
    failureReason: data.failure_reason || undefined,
    htmlBody: data.html_body || '',
    textBody: data.text_body || '',
  };
};