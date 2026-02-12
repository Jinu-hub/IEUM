import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";
import { logger } from "~/core/lib/logger";

export const createNewsletterRun = async (client: SupabaseClient<Database>, 
    { workspaceId, trigger, logRef }: 
    { workspaceId: string, trigger: string, logRef: string | null }) => {
    try {
        const status = "queued";
        // logRefが空文字列の場合はnullに変換（UUID型のカラムにはnullが必要）
        const logRefValue = logRef && logRef.trim() !== '' ? logRef : null;
        const { data: runs, error } = await client
            .from('newsletter_runs')
            .insert({ 
                workspace_id: workspaceId,
                trigger: trigger,
                status: status,
                log_ref: logRefValue,
                is_archived: false,
            }).select().single();
        if (error) {
            console.error('createNewsletterRun error', error);
            throw error
        }

        const runId = runs.run_id;

        const { data: runSteps, error: runStepsError } = await client
            .from('newsletter_run_steps')
            .insert({
                workspace_id: workspaceId,
                run_id: runId,
                step: status,
                status: status,
                try_count: 0,
                log_ref: logRefValue,
            }).select().single();
        if (runStepsError) {
            console.error('createNewsletterRunStep error', runStepsError);
            throw error
        }
        const runStepId = runSteps?.run_step_id;
        return { runId, runStepId };
    } catch (error) {
        console.error('createNewsletterRun error', error);
        throw error
    }
}

export const updateNewsletterRun = async (client: SupabaseClient<Database>, 
    { runId, runStepId, status, step, metricsJson, accuratedTokens }: 
    { runId: string, runStepId: string, status: string, step: string, metricsJson: any, accuratedTokens?: number }) => {
    try {
        const now = new Date().toISOString();
        if (status === "running") {
            const { data: runs, error } = await client
                .from('newsletter_runs')
                .update({
                    status: status as Database["public"]["Enums"]["run_status"],
                    started_at: now,
                    metrics_json: metricsJson,
                })
                .eq('run_id', runId)
                .select().single();
            if (error) {
                console.error('updateNewsletterRun error', error);
                throw error
            }

            const { data: runSteps, error: runStepsError } = await client
            .from('newsletter_run_steps')
                .update({
                    step: step as Database["public"]["Enums"]["step_name"],
                    status: status as Database["public"]["Enums"]["step_status"],
                    started_at: now,
                })
                .eq('run_step_id', runStepId)
                .select().single();
            if (runStepsError) {
                console.error('updateNewsletterRunStep error', runStepsError);
                throw error
            }

        } else{
            
            const { data: runs, error } = await client
                .from('newsletter_runs')
                .update({
                    status: status as Database["public"]["Enums"]["run_status"],
                    finished_at: now,
                    metrics_json: metricsJson,
                    accurated_tokens: accuratedTokens,
                })
                .eq('run_id', runId)
                .select().single();
            if (error) {
                console.error('updateNewsletterRun error', error);
                throw error
            }
            const { data: runSteps, error: runStepsError } = await client
                .from('newsletter_run_steps')
                .update({
                    step: step as Database["public"]["Enums"]["step_name"],
                    status: status as Database["public"]["Enums"]["step_status"],
                    finished_at: now,
                })
                .eq('run_step_id', runStepId)
                .select().single();
            if (runStepsError) {
                console.error('updateNewsletterRunStep error', runStepsError);
                throw error
            }
        }

        return { ok: true };
    } catch (error) {
        console.error('updateNewsletterRun error', error);
        throw error
    }
}

export const updateNewsletterRunError = async (client: SupabaseClient<Database>, 
    { runId, runStepId, errorSummary }: 
    { runId: string, runStepId: string, errorSummary: string }) => {
    try {
        const { error } = await client
            .from('newsletter_runs')
            .update({
                status: 'failed' as Database["public"]["Enums"]["run_status"],
            })
            .eq('run_id', runId)
        if (error) {
            console.error('updateNewsletterRunError error', error);
            throw error
        }
        const { error: runStepsError } = await client
            .from('newsletter_run_steps')
            .update({
                status: 'failed' as Database["public"]["Enums"]["step_status"],
                error_summary: errorSummary,
            })
            .eq('run_step_id', runStepId)
        if (runStepsError) {
            console.error('updateNewsletterRunStepError error', runStepsError);
            throw runStepsError
        }
        return { ok: true };
    } catch (error) {
        console.error('updateNewsletterRunError error', error);
        throw error
    }
}

export const updateNewsletterRunStep = async (client: SupabaseClient<Database>,
    { runStepId, step, processTimeJson }: {
        runStepId: string;
        step: string;
        /** Optional: merge these keys (e.g. { summarize_data_ms: 1234 }) into process_time_json */
        processTimeJson?: Record<string, number>;
    }) => {
    try {
        const updatePayload: { step: Database["public"]["Enums"]["step_name"]; process_time_json?: Database["public"]["Tables"]["newsletter_run_steps"]["Row"]["process_time_json"] } = {
            step: step as Database["public"]["Enums"]["step_name"],
        };
        if (processTimeJson != null && Object.keys(processTimeJson).length > 0) {
            const { data: current, error: selectError } = await client
                .from('newsletter_run_steps')
                .select('process_time_json')
                .eq('run_step_id', runStepId)
                .single();
            if (selectError) {
                console.error('updateNewsletterRunStep select error', selectError);
                throw selectError;
            }
            const existing = (current?.process_time_json as Record<string, number> | null) ?? {};
            updatePayload.process_time_json = { ...existing, ...processTimeJson } as Database["public"]["Tables"]["newsletter_run_steps"]["Row"]["process_time_json"];
        }
        const { data: runSteps, error } = await client
            .from('newsletter_run_steps')
            .update(updatePayload)
            .eq('run_step_id', runStepId)
            .select().single();
        if (error) {
            console.error('updateNewsletterRunStep error', error);
            throw error
        }
        return { ok: true };
    } catch (error) {
        console.error('updateNewsletterRunStep error', error);
        throw error
    }
}


export const saveNewsletterEditions = async (client: SupabaseClient<Database>, 
    { workspaceId, runId, targetId, subject, htmlBody, textBody, statsJson, sentAt, status, providerMessageId, failureReason, period, periodKey }: 
    { workspaceId: string, runId: string, targetId: string, subject: string, htmlBody: string, textBody: string
        , statsJson: any, sentAt: string, status: string, providerMessageId: string, failureReason: string | null
        , period: string, periodKey: string }) => {
    try {
        const sentAtValue = sentAt ?? new Date().toISOString();
        const { data: newsletterEditions, error } = await client
            .from('newsletter_editions')
            .insert({
                workspace_id: workspaceId,
                target_id: targetId,
                run_id: runId,
                subject: subject,
                html_body: htmlBody,
                text_body: textBody,
                stats_json: statsJson,
                sent_at: sentAtValue,
                status: status as Database["public"]["Enums"]["mail_status"],
                provider_message_id: providerMessageId,
                failure_reason: failureReason,
                period: period as Database["public"]["Enums"]["period"],
                period_key: periodKey,
            })
            .select()
            .single();
        if (error) {
            console.error('saveNewsletterEditions error', error);
            throw error
        }
        return newsletterEditions;
    } catch (error) {
        console.error('saveNewsletterEditions error', error);
        throw error
    }
}

export const saveHighlight = async (client: SupabaseClient<Database>, 
    { workspaceId, targetId, runId, source, title, url, weight, metaJson, dedupKey, tags, period, periodKey }: 
    { workspaceId: string, targetId: string, runId: string, source: string, title: string
        , url: string | null, weight: number, metaJson: any, dedupKey: string, tags: string[]
        , period: string, periodKey: string }) => {
    try {
        const { data: highlights, error } = await client
            .from('highlights')
            .insert({
                workspace_id: workspaceId,
                target_id: targetId,
                run_id: runId,
                source: source,
                title: title,
                url: url,
                weight: weight,
                meta_json: metaJson,
                dedup_key: dedupKey,
                tags: tags,
                period: period as Database["public"]["Enums"]["period"],
                period_key: periodKey,
                created_at: new Date().toISOString(),
            })
            .select()
            .single();
        if (error) {
            console.error('saveHighlight error', error);
            throw error
        }
        return highlights;
    } catch (error) {
        console.error('saveHighlight error', error);
        throw error
    }
}

/**
 * usage_counters 등록/업데이트
 * 
 * workspace_id를 기반으로 owner user의 usage counter를 업데이트합니다.
 * 현재 시간보다 period_end가 작은 monthly 레코드가 있으면 process_count를 증가시키고,
 * 없으면 새로운 monthly 레코드를 생성합니다.
 * 
 * @param client - Supabase client instance (admin client 권장)
 * @param workspaceId - workspace ID
 * @returns 업데이트 또는 생성된 usage counter 레코드, 실패 시 null
 */
export const initializeUsageCounterForEmail = async (
    client: SupabaseClient<Database>,
    { workspaceId, userId }: { workspaceId: string, userId: string }
): Promise<Database["public"]["Tables"]["usage_counters"]["Row"] | null> => {
    try {

        // user의 active 상태의 subscription mode 가져오기
        const { data: subscriptionData, error: subscriptionError } = await client
            .from('subscriptions')
            .select('mode')
            .eq('user_id', userId)
            .not('status', 'in', '(expired,paused)')
            .or('ends_at.is.null,ends_at.gt.now()')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        const mode = subscriptionData?.mode || 'free';

        // 현재 시간
        const now = new Date();
        // 1개월 뒤
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        // 현재 시간보다 period_end가 지나지 않은 monthly 레코드가 있는지 확인
        const { data: existingCounter, error: checkError } = await client
            .from('usage_counters')
            .select('counter_id, process_count, email_sent_count')
            .eq('user_id', userId)
            .eq('period_type', 'monthly')
            .gt('period_end', now.toISOString())
            .order('period_end', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (checkError) {
            logger.error('Failed to check existing usage counter', { error: checkError });
            return null;
        }

        if (existingCounter) {
            // 기존 레코드가 있으면 process_count만 increment
            const { data: usageCounter, error: updateError } = await client
                .from('usage_counters')
                .update({ process_count: (existingCounter.process_count || 0) + 1 })
                .eq('counter_id', existingCounter.counter_id)
                .select()
                .single();

            if (updateError) {
                logger.error('Failed to update usage counter', { error: updateError });
                return null;
            } else {
                logger.info('Updated usage counter', { counter_id: existingCounter.counter_id });
                return usageCounter;
            }
        } else {
            // 새 레코드 생성
            const { data: usageCounter, error: insertError } = await client
                .from('usage_counters')
                .insert({
                    user_id: userId,
                    mode: mode,
                    period_type: 'monthly',
                    period_start: now.toISOString(),
                    period_end: periodEnd.toISOString(),
                    process_count: 1,
                    email_sent_count: 0,
                    accurated_token_count: 0,
                })
                .select()
                .single();

            if (insertError) {
                logger.error('Failed to insert usage counter', { error: insertError });
                return null;
            } else {
                logger.info('Created usage counter', { userId, mode, period_type: 'monthly' });
                return usageCounter;
            }
        }
    } catch (error: any) {
        logger.error('Usage counter update error', { error: error.message });
        // usage counter 오류는 전체 프로세스를 중단하지 않음
        return null;
    }
}

/**
 * usage_counters 이메일 전송 카운트 증가 및 추정 토큰 수 증가
 * 
 * @param client - Supabase client instance
 * @param counterId - usage counter ID
 * @param estimatedTokens - 추정 토큰 수
 * @returns 업데이트된 usage counter 레코드, 실패 시 null
 */
export const incrementUsageCounter = async (client: SupabaseClient<Database>, 
    { counterId, accuratedTokens }: { counterId: string, accuratedTokens: number }) => {
    try {
        // 현재 카운터 값 조회
        const { data: existingCounter, error: fetchError } = await client
            .from('usage_counters')
            .select('email_sent_count, accurated_token_count')
            .eq('counter_id', counterId)
            .single();
        
        if (fetchError) {
            logger.error('Failed to fetch usage counter', { error: fetchError });
            return null;
        }

        const { data: usageCounter, error: updateError } = await client
            .from('usage_counters')
            .update({ email_sent_count: (existingCounter?.email_sent_count || 0) + 1
                , accurated_token_count: (existingCounter?.accurated_token_count || 0) + accuratedTokens })
            .eq('counter_id', counterId)
            .select()
            .single();
            
        if (updateError) {
            logger.error('Failed to increment usage counter', { error: updateError });
            return null;
        }
        return usageCounter;
    } catch (error: any) {
        logger.error('Usage counter update error', { error: error.message });
        return null;
    }
}