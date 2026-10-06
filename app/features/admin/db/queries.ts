/**
 * Admin Monitoring Queries
 * 
 * newsletter_runs と newsletter_run_steps テーブルのデータを取得するクエリ
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

/**
 * 全ての newsletter_runs を取得（最新順）
 */
export const getNewsletterRuns = async (
  client: SupabaseClient<Database>,
  { limit = 50 }: { limit?: number } = {}
) => {
  const { data, error } = await client
    .from('newsletter_runs')
    .select(`
      run_id,
      workspace_id,
      trigger,
      started_at,
      finished_at,
      status,
      metrics_json,
      cancel_reason,
      is_archived
    `)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getNewsletterRuns error:', error);
    throw error;
  }

  return data;
};

/**
 * 特定の run_id に紐づく newsletter_run_steps を取得
 */
export const getNewsletterRunSteps = async (
  client: SupabaseClient<Database>,
  { runId }: { runId: string }
) => {
  const { data, error } = await client
    .from('newsletter_run_steps')
    .select(`
      run_step_id,
      run_id,
      step,
      status,
      started_at,
      finished_at,
      try_count,
      error_summary
    `)
    .eq('run_id', runId)
    .order('started_at', { ascending: true });

  if (error) {
    console.error('getNewsletterRunSteps error:', error);
    throw error;
  }

  return data;
};

/**
 * 全ての newsletter_runs と関連する steps を一括取得
 */
export const getNewsletterRunsWithSteps = async (
  client: SupabaseClient<Database>,
  { limit = 50 }: { limit?: number } = {}
) => {
  const { data, error } = await client
    .from('newsletter_runs')
    .select(`
      run_id,
      workspace_id,
      trigger,
      started_at,
      finished_at,
      status,
      metrics_json,
      cancel_reason,
      is_archived,
      newsletter_run_steps (
        run_step_id,
        step,
        status,
        started_at,
        finished_at,
        try_count,
        error_summary
      )
    `)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getNewsletterRunsWithSteps error:', error);
    throw error;
  }

  return data;
};

/**
 * run_log_events を取得（最新順、オプションで run_id / level / step_name でフィルタ）
 */
export const getRunLogEvents = async (
  client: SupabaseClient<Database>,
  { limit = 200, runId, level, stepName }: { limit?: number; runId?: string; level?: string; stepName?: string } = {}
) => {
  let q = client
    .from('run_log_events')
    .select(`
      run_log_event_id,
      workspace_id,
      run_id,
      level,
      step_name,
      message,
      meta,
      created_at,
      newsletter_runs (
        trigger,
        status,
        started_at,
        finished_at
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (runId) q = q.eq('run_id', runId);
  if (level) q = q.eq('level', level);
  if (stepName) q = q.eq('step_name', stepName);

  const { data, error } = await q;

  if (error) {
    console.error('getRunLogEvents error:', error);
    throw error;
  }

  return data;
};

/**
 * subscriptions を取得（更新日時の新しい順）
 */
export const getSubscriptions = async (client: SupabaseClient<Database>) => {
  const { data, error } = await client
    .from('subscriptions')
    .select(`
      subscription_id,
      user_id,
      plan_type,
      status,
      mode,
      billing_interval,
      billing_currency,
      started_at,
      ends_at,
      updated_at,
      stripe_subscription_id,
      payment_methods (
        pg_provider
      )
    `)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('getSubscriptions error:', error);
    throw error;
  }

  return data;
};

/**
 * payments を取得（最新順）
 */
export const getPayments = async (
  client: SupabaseClient<Database>,
  { limit = 200 }: { limit?: number } = {}
) => {
  const { data, error } = await client
    .from('payments')
    .select(`
      payment_id,
      user_id,
      pg_provider,
      order_name,
      total_amount,
      currency,
      status,
      approved_at,
      created_at,
      receipt_url
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getPayments error:', error);
    throw error;
  }

  return data;
};

/**
 * 有効な targets を取得（workspace のオーナー user_id 付き）
 */
export const getActiveTargets = async (client: SupabaseClient<Database>) => {
  const { data, error } = await client
    .from('targets')
    .select(`
      target_id,
      display_name,
      schedule_cron,
      schedule_hour,
      timezone,
      category,
      language,
      last_sent_at,
      workspace!inner (
        name,
        owner_user_id
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('getActiveTargets error:', error);
    throw error;
  }

  return data;
};

/**
 * user_id → email のマップを取得（auth.users は PostgREST で join できないため）
 */
export const getUserEmailMap = async (client: SupabaseClient<Database>) => {
  // ponytail: first 1000 users only, paginate listUsers if the user base grows past that
  const { data, error } = await client.auth.admin.listUsers({ perPage: 1000 });

  if (error) {
    console.error('getUserEmailMap error:', error);
    throw error;
  }

  return Object.fromEntries(data.users.map((u) => [u.id, u.email ?? ""]));
};
