/**
 * Admin Monitoring Screen
 * 
 * newsletter_runs と newsletter_run_steps のモニタリング画面
 */

import { useState } from 'react';
import { Link, data, redirect } from 'react-router';
import {
  NexBadge,
  NexButton,
  NexCard,
  NexCardContent,
  NexCardHeader,
  NexCardTitle,
} from '~/core/components/nex';
import adminClient from '~/core/lib/supa-admin-client.server';
import makeServerClient from '~/core/lib/supa-client.server';
import { cn } from '~/core/lib/utils';
import { getUserProfile } from '~/features/users/queries';
import { getNewsletterRunsWithSteps } from '../db/queries';
import type { Route } from "./+types/monitoring";

export const meta: Route.MetaFunction = () => {
  return [{ title: `Admin Monitoring | ${import.meta.env.VITE_APP_NAME}` }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const [client] = makeServerClient(request);
  const { data: { user } } = await client.auth.getUser();
  const profile = await getUserProfile(client, { userId: user?.id ?? null });
  if (!profile?.is_admin) {
    throw redirect('/dashboard');
  }
  const runs = await getNewsletterRunsWithSteps(adminClient, { limit: 50 });
  return data({ runs });
};

// ステータスに応じたバッジの色を返す
function getStatusVariant(status: string): "default" | "success" | "warning" | "error" | "info" {
  switch (status) {
    case 'success':
      return 'success';
    case 'running':
      return 'info';
    case 'queued':
      return 'default';
    case 'failed':
      return 'error';
    case 'canceled':
      return 'warning';
    default:
      return 'default';
  }
}

// 日時をフォーマット
function formatDateTime(dateString: string | null): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// 処理時間を計算
function calculateDuration(startedAt: string | null, finishedAt: string | null): string {
  if (!startedAt || !finishedAt) return '-';
  const start = new Date(startedAt).getTime();
  const end = new Date(finishedAt).getTime();
  const durationMs = end - start;
  
  if (durationMs < 1000) return `${durationMs}ms`;
  if (durationMs < 60000) return `${(durationMs / 1000).toFixed(1)}s`;
  return `${(durationMs / 60000).toFixed(1)}min`;
}

export default function AdminMonitoring({ loaderData }: Route.ComponentProps) {
  const { runs } = loaderData;
  const [expandedRunIds, setExpandedRunIds] = useState<Set<string>>(new Set());

  const toggleExpand = (runId: string) => {
    setExpandedRunIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(runId)) {
        newSet.delete(runId);
      } else {
        newSet.add(runId);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Newsletter Runs Monitoring</h1>
          <Link to="/admin/logs">
            <NexButton variant="secondary" size="sm">
              Run Logs →
            </NexButton>
          </Link>
        </div>

        <div className="mb-4 text-sm text-muted-foreground">
          Total: {runs.length} runs
        </div>

        <div className="space-y-4">
          {runs.map((run) => (
            <NexCard key={run.run_id} variant="outlined">
              <NexCardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleExpand(run.run_id)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <NexBadge variant={getStatusVariant(run.status)} size="sm">
                      {run.status}
                    </NexBadge>
                    <NexBadge variant="default" size="sm">
                      {run.trigger}
                    </NexBadge>
                    <span className="text-xs text-muted-foreground font-mono">
                      {run.run_id.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {formatDateTime(run.started_at)}
                    </span>
                    <span className="text-muted-foreground">
                      Duration: {calculateDuration(run.started_at, run.finished_at)}
                    </span>
                    <span className={cn(
                      "transition-transform",
                      expandedRunIds.has(run.run_id) ? "rotate-180" : ""
                    )}>
                      ▼
                    </span>
                  </div>
                </div>
              </NexCardHeader>

              {expandedRunIds.has(run.run_id) && (
                <NexCardContent>
                  <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                    <div className="mb-3 flex items-center justify-between">
                      <Link
                        to={`/admin/logs?runId=${run.run_id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View Logs for this Run →
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Run ID:</span>
                        <Link
                          to={`/admin/logs?runId=${run.run_id}`}
                          className="ml-2 font-mono text-primary hover:underline"
                        >
                          {run.run_id}
                        </Link>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Workspace ID:</span>
                        <span className="ml-2 font-mono text-xs">{run.workspace_id}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Started:</span>
                        <span className="ml-2">{formatDateTime(run.started_at)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Finished:</span>
                        <span className="ml-2">{formatDateTime(run.finished_at)}</span>
                      </div>
                      {run.cancel_reason && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Cancel Reason:</span>
                          <span className="ml-2 text-destructive">{run.cancel_reason}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Steps */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Steps</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3">Step</th>
                            <th className="text-left py-2 px-3">Status</th>
                            <th className="text-left py-2 px-3">Try Count</th>
                            <th className="text-left py-2 px-3">Started</th>
                            <th className="text-left py-2 px-3">Duration</th>
                            <th className="text-left py-2 px-3">Error</th>
                          </tr>
                        </thead>
                        <tbody>
                          {run.newsletter_run_steps?.map((step) => (
                            <tr 
                              key={step.run_step_id} 
                              className={cn(
                                "border-b last:border-0",
                                step.status === 'failed' && "bg-destructive/10"
                              )}
                            >
                              <td className="py-2 px-3 font-mono text-xs">
                                {step.step}
                              </td>
                              <td className="py-2 px-3">
                                <NexBadge variant={getStatusVariant(step.status)} size="sm">
                                  {step.status}
                                </NexBadge>
                              </td>
                              <td className="py-2 px-3 text-center">
                                {step.try_count}
                              </td>
                              <td className="py-2 px-3 text-xs">
                                {formatDateTime(step.started_at)}
                              </td>
                              <td className="py-2 px-3 text-xs">
                                {calculateDuration(step.started_at, step.finished_at)}
                              </td>
                              <td className="py-2 px-3">
                                {step.error_summary && (
                                  <span className="text-destructive text-xs truncate block max-w-xs" title={step.error_summary}>
                                    {step.error_summary}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                          {(!run.newsletter_run_steps || run.newsletter_run_steps.length === 0) && (
                            <tr>
                              <td colSpan={6} className="py-4 text-center text-muted-foreground">
                                No steps found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </NexCardContent>
              )}
            </NexCard>
          ))}

          {runs.length === 0 && (
            <NexCard variant="outlined">
              <NexCardContent className="py-8 text-center text-muted-foreground">
                No newsletter runs found
              </NexCardContent>
            </NexCard>
          )}
        </div>
      </div>
    </div>
  );
}
