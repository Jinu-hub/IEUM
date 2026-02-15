/**
 * Admin Run Logs Screen
 *
 * run_log_events monitoring screen
 */

import { useState } from "react";
import { data, redirect } from "react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/core/components/ui/select";
import {
  NexBadge,
  NexButton,
  NexCard,
  NexCardContent,
  NexCardHeader,
  NexCardTitle,
  NexInput,
} from "~/core/components/nex";
import adminClient from "~/core/lib/supa-admin-client.server";
import makeServerClient from "~/core/lib/supa-client.server";
import { cn } from "~/core/lib/utils";
import { getUserProfile } from "~/features/users/queries";
import { getRunLogEvents } from "../db/queries";
import type { Route } from "./+types/run-logs";

export const meta: Route.MetaFunction = () => {
  return [{ title: `Admin Run Logs | ${import.meta.env.VITE_APP_NAME}` }];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  const profile = await getUserProfile(client, { userId: user?.id ?? null });
  if (!profile?.is_admin) {
    throw redirect("/dashboard");
  }

  const url = new URL(request.url);
  const runId = url.searchParams.get("runId") ?? undefined;
  const level = url.searchParams.get("level") ?? undefined;
  const stepName = url.searchParams.get("stepName") ?? undefined;
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "200", 10) || 200, 500);

  const logs = await getRunLogEvents(adminClient, { limit, runId, level, stepName });
  return data({ logs, filters: { runId, level, stepName, limit } });
};

function getLevelVariant(
  level: string
): "default" | "success" | "warning" | "error" | "info" {
  switch (level.toLowerCase()) {
    case "error":
      return "error";
    case "warn":
    case "warning":
      return "warning";
    case "info":
    case "debug":
      return "info";
    case "success":
      return "success";
    default:
      return "default";
  }
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

type NewsletterRun = {
  trigger?: string;
  status?: string;
  started_at?: string | null;
  finished_at?: string | null;
} | null;

type LogRow = {
  run_log_event_id: string;
  workspace_id: string;
  run_id: string;
  level: string;
  step_name: string;
  message: string;
  meta: Record<string, unknown>;
  created_at: string;
  newsletter_runs: NewsletterRun;
};

export default function AdminRunLogs({ loaderData }: Route.ComponentProps) {
  const { logs, filters } = loaderData;
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [filterForm, setFilterForm] = useState({
    runId: filters.runId ?? "",
    level: filters.level ?? "",
    stepName: filters.stepName ?? "",
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filterForm.runId) params.set("runId", filterForm.runId);
    if (filterForm.level) params.set("level", filterForm.level);
    if (filterForm.stepName) params.set("stepName", filterForm.stepName);
    params.set("limit", String(filters.limit ?? 200));
    window.location.search = params.toString();
  };

  const runRows = (logs ?? []) as LogRow[];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Run Log Events</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor run_log_events table logs
            </p>
          </div>
          <a href="/admin/monitoring">
            <NexButton variant="secondary" size="sm">
              ← Runs Monitoring
            </NexButton>
          </a>
        </div>

        <NexCard variant="outlined" className="mb-6">
          <NexCardHeader>
            <NexCardTitle>Filter</NexCardTitle>
          </NexCardHeader>
          <NexCardContent>
            <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-center gap-4">
              <div className="flex flex-nowrap items-center gap-2">
                <label className="shrink-0 whitespace-nowrap text-sm font-medium">Run ID</label>
                <NexInput
                  placeholder="Filter by run_id"
                  value={filterForm.runId}
                  onChange={(e) =>
                    setFilterForm((f) => ({ ...f, runId: e.target.value }))
                  }
                  variant="outlined"
                  className="w-48"
                />
              </div>
              <div className="flex flex-nowrap items-center gap-2">
                <label className="shrink-0 whitespace-nowrap text-sm font-medium">Level</label>
                <Select
                  value={filterForm.level || "all"}
                  onValueChange={(v) =>
                    setFilterForm((f) => ({ ...f, level: v === "all" ? "" : v }))
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="info">info</SelectItem>
                    <SelectItem value="warn">warn</SelectItem>
                    <SelectItem value="error">error</SelectItem>
                    <SelectItem value="debug">debug</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-nowrap items-center gap-2">
                <label className="shrink-0 whitespace-nowrap text-sm font-medium">Step Name</label>
                <NexInput
                  placeholder="Filter by step_name"
                  value={filterForm.stepName}
                  onChange={(e) =>
                    setFilterForm((f) => ({ ...f, stepName: e.target.value }))
                  }
                  variant="outlined"
                  className="w-48"
                />
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-2">
                <NexButton type="submit" variant="primary">
                  Apply
                </NexButton>
                <NexButton
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setFilterForm({ runId: "", level: "", stepName: "" });
                    window.location.search = "";
                  }}
                >
                  Reset
                </NexButton>
              </div>
            </form>
          </NexCardContent>
        </NexCard>

        <div className="mb-4 text-sm text-muted-foreground">
          Total: {runRows.length} logs
        </div>

        <div className="space-y-3">
          {runRows.map((log) => {
            const isExpanded = expandedIds.has(log.run_log_event_id);
            const run = log.newsletter_runs;
            const hasMeta =
              log.meta && typeof log.meta === "object" && Object.keys(log.meta as Record<string, unknown>).length > 0;

            return (
              <NexCard key={log.run_log_event_id} variant="outlined">
                <NexCardHeader
                  className={cn(
                    "cursor-pointer transition-colors",
                    log.level?.toLowerCase() === "error" && "bg-destructive/5"
                  )}
                  onClick={() => toggleExpand(log.run_log_event_id)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <NexBadge
                        variant={getLevelVariant(log.level)}
                        size="sm"
                      >
                        {log.level}
                      </NexBadge>
                      <span className="font-mono text-xs text-muted-foreground">
                        {log.step_name}
                      </span>
                      <span className="max-w-md truncate text-sm">
                        {log.message}
                      </span>
                      {run?.trigger && (
                        <NexBadge variant="default" size="sm">
                          {run.trigger}
                        </NexBadge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatDateTime(log.created_at)}</span>
                      <span className="font-mono">
                        {log.run_id.slice(0, 8)}...
                      </span>
                      <span
                        className={cn(
                          "transition-transform",
                          isExpanded ? "rotate-180" : ""
                        )}
                      >
                        ▼
                      </span>
                    </div>
                  </div>
                </NexCardHeader>

                {isExpanded && (
                  <NexCardContent>
                    <div className="space-y-3">
                      <div className="grid gap-2 rounded-lg bg-muted/30 p-3 text-sm sm:grid-cols-2">
                        <div>
                          <span className="text-muted-foreground">
                            Run Log Event ID:
                          </span>
                          <span className="ml-2 font-mono text-xs">
                            {log.run_log_event_id}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Run ID:
                          </span>
                          <a
                            href={`/admin/logs?runId=${log.run_id}`}
                            className="ml-2 font-mono text-xs text-primary hover:underline"
                          >
                            {log.run_id}
                          </a>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Workspace ID:
                          </span>
                          <span className="ml-2 font-mono text-xs">
                            {log.workspace_id}
                          </span>
                        </div>
                        {run && (
                          <>
                            <div>
                              <span className="text-muted-foreground">
                                Run Status:
                              </span>
                              <NexBadge
                                variant={run.status === "failed" ? "error" : "info"}
                                size="sm"
                                className="ml-2"
                              >
                                {run.status}
                              </NexBadge>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Started:
                              </span>
                              <span className="ml-2 text-xs">
                                {formatDateTime(run.started_at ?? null)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      {hasMeta && (
                        <div>
                          <h4 className="mb-2 text-sm font-semibold">Meta</h4>
                          <pre className="max-h-48 overflow-auto rounded-lg bg-muted/50 p-3 text-xs">
                            {JSON.stringify(log.meta, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </NexCardContent>
                )}
              </NexCard>
            );
          })}

          {runRows.length === 0 && (
            <NexCard variant="outlined">
              <NexCardContent className="py-8 text-center text-muted-foreground">
                No log events found
              </NexCardContent>
            </NexCard>
          )}
        </div>
      </div>
    </div>
  );
}
