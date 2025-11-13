import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";
import { getPeriodKeyRange } from "~/core/processes/utils";

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


export async function getHighlightsMetadata(
  client: SupabaseClient<Database>,
  { workspaceId, period, periodNumber, source }: 
  { workspaceId: string, period: string, periodNumber: number, source?: string },
) {
  const { startKey, endKey } = getPeriodKeyRange(period, periodNumber);

  let query = client
    .from("highlights")
    .select("period_key, meta_json")
    .eq("workspace_id", workspaceId)
    .eq("period", period as Database["public"]["Enums"]["period"])
    .gte("period_key", startKey)
    .lte("period_key", endKey);
  if (source) {
    query = query.eq("source", source)
  }
  query = query.order("created_at", { ascending: false });
  const { data, error } = await query;
  if (error) {
    console.log('getHighlights error', error);
    throw error;
  }
  return data;
}


export async function getHighlightsCount(
  client: SupabaseClient<Database>,
  { workspaceId, period, periodNumber, source }: 
  { workspaceId: string, period: string, periodNumber: number, source?: string },
) {
  const { startKey, endKey } = getPeriodKeyRange(period, periodNumber);
  let query = client
    .from('highlights')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('period', period as Database["public"]["Enums"]["period"])
    .gte('period_key', startKey)
    .lte('period_key', endKey);
  if (source) {
    query = query.eq('source', source);
  }
  const { count, error } = await query;
  if (error) {
    console.log('getHighlightsCount error', error);
    throw error;  
  }
  return count ?? 0;
}

export async function getSentEmailMetadata(client: SupabaseClient<Database>, 
  { workspaceId, period, periodNumber }: { workspaceId: string, period: string, periodNumber: number }) {
  const { startKey, endKey } = getPeriodKeyRange(period, periodNumber);
  const { data, error } = await client
    .from('newsletter_editions')
    .select('period_key, stats_json')
    .eq('workspace_id', workspaceId)
    .eq('period', period as Database["public"]["Enums"]["period"])
    .gte('period_key', startKey)
    .lte('period_key', endKey);
  if (error) {
    console.log('getSentEmails error', error);
    throw error;
  }
  return data;
}
