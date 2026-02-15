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
