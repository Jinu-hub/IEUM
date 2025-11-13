import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

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
    { runId, runStepId, status, step, metricsJson }: 
    { runId: string, runStepId: string, status: string, step: string, metricsJson: any }) => {
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
    { runStepId, step }: 
    { runStepId: string, step: string }) => {
    try {
        const { data: runSteps, error } = await client
            .from('newsletter_run_steps')
            .update({
                step: step as Database["public"]["Enums"]["step_name"],
            })
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
    { workspaceId, runId, source, title, url, weight, metaJson, dedupKey, tags, period, periodKey }: 
    { workspaceId: string, runId: string, source: string, title: string
        , url: string | null, weight: number, metaJson: any, dedupKey: string, tags: string[]
        , period: string, periodKey: string }) => {
    try {
        const { data: highlights, error } = await client
            .from('highlights')
            .insert({
                workspace_id: workspaceId,
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