/**
 * Admin Billing Screen
 *
 * subscriptions / payments monitoring screen
 */

import { Fragment, useState } from "react";
import { data, redirect } from "react-router";
import {
  NexBadge,
  NexCard,
  NexCardContent,
  NexCardHeader,
  NexCardTitle,
} from "~/core/components/nex";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/core/components/ui/table";
import adminClient from "~/core/lib/supa-admin-client.server";
import makeServerClient from "~/core/lib/supa-client.server";
import { getUserProfile } from "~/features/users/queries";
import { getActiveTargets, getPayments, getSubscriptions, getUserEmailMap } from "../db/queries";
import type { Route } from "./+types/billing";

export const meta: Route.MetaFunction = () => {
  return [{ title: `Admin Billing | ${import.meta.env.VITE_APP_NAME}` }];
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

  const [subscriptions, payments, emails, activeTargets] = await Promise.all([
    getSubscriptions(adminClient),
    getPayments(adminClient),
    getUserEmailMap(adminClient),
    getActiveTargets(adminClient),
  ]);

  const targetsByUser: Record<string, typeof activeTargets> = {};
  for (const target of activeTargets) {
    const ownerId = target.workspace.owner_user_id;
    if (ownerId) (targetsByUser[ownerId] ??= []).push(target);
  }

  return data({ subscriptions, payments, emails, targetsByUser });
};

type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "secondary";

const SUBSCRIPTION_STATUS_VARIANT: Record<string, BadgeVariant> = {
  active: "success",
  trialing: "info",
  paused: "warning",
  expired: "error",
  canceled: "secondary",
};

function getPaymentStatusVariant(status: string): BadgeVariant {
  const s = status.toLowerCase();
  if (s === "done" || s === "paid") return "success";
  if (s.includes("cancel")) return "secondary";
  if (s.includes("fail") || s === "aborted" || s === "expired") return "error";
  return "warning";
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(amount: number, currency: string | null): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "KRW" }).format(amount);
  } catch {
    return `${amount} ${currency ?? ""}`;
  }
}

export default function AdminBilling({ loaderData }: Route.ComponentProps) {
  const { subscriptions, payments, emails, targetsByUser } = loaderData;
  const now = Date.now();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const statusCounts = subscriptions.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Billing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor subscriptions and payments
          </p>
        </div>

        <NexCard variant="outlined">
          <NexCardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <NexCardTitle>Subscriptions ({subscriptions.length})</NexCardTitle>
              <div className="flex flex-wrap gap-2">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <NexBadge key={status} variant={SUBSCRIPTION_STATUS_VARIANT[status] ?? "default"} size="sm">
                    {status} {count}
                  </NexBadge>
                ))}
              </div>
            </div>
          </NexCardHeader>
          <NexCardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Interval</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Ends</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((s) => {
                  const isStale =
                    s.status !== "expired" && s.ends_at !== null && new Date(s.ends_at).getTime() < now;
                  const isExpanded = expandedId === s.subscription_id;
                  const targets = targetsByUser[s.user_id] ?? [];
                  return (
                    <Fragment key={s.subscription_id}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : s.subscription_id)}
                    >
                      <TableCell className="text-xs">
                        <span className="mr-1 text-muted-foreground">{isExpanded ? "▾" : "▸"}</span>
                        {emails[s.user_id] || s.user_id}
                        <NexBadge variant={targets.length > 0 ? "info" : "default"} size="sm" className="ml-2">
                          {targets.length} targets
                        </NexBadge>
                      </TableCell>
                      <TableCell>{s.plan_type}</TableCell>
                      <TableCell>
                        <NexBadge variant={SUBSCRIPTION_STATUS_VARIANT[s.status] ?? "default"} size="sm">
                          {s.status}
                        </NexBadge>
                      </TableCell>
                      <TableCell>{s.payment_methods?.pg_provider ?? (s.mode === "paid" ? "-" : s.mode)}</TableCell>
                      <TableCell>{s.billing_interval ?? "-"}</TableCell>
                      <TableCell className="text-xs">{formatDateTime(s.started_at)}</TableCell>
                      <TableCell className={isStale ? "text-xs font-semibold text-destructive" : "text-xs"}>
                        {formatDateTime(s.ends_at)}
                        {isStale && " (overdue)"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDateTime(s.updated_at)}</TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={8} className="whitespace-normal p-4">
                          {targets.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No active targets</p>
                          ) : (
                            <ul className="space-y-2">
                              {targets.map((t) => (
                                <li key={t.target_id} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                                  <span className="font-medium">{t.display_name}</span>
                                  <span className="text-xs text-muted-foreground">{t.workspace.name}</span>
                                  <span className="text-xs">{t.category} / {t.language}</span>
                                  <span className="font-mono text-xs">
                                    {t.schedule_cron ?? `${t.schedule_hour ?? "-"}h`} ({t.timezone})
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Last sent: {formatDateTime(t.last_sent_at)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </NexCardContent>
        </NexCard>

        <NexCard variant="outlined">
          <NexCardHeader>
            <NexCardTitle>Payments (latest {payments.length})</NexCardTitle>
          </NexCardHeader>
          <NexCardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.payment_id}>
                    <TableCell className="text-xs">{formatDateTime(p.approved_at ?? p.created_at)}</TableCell>
                    <TableCell className="text-xs">{(p.user_id && emails[p.user_id]) || p.user_id || "-"}</TableCell>
                    <TableCell>{p.pg_provider}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs">{p.order_name}</TableCell>
                    <TableCell className="text-right font-mono">{formatAmount(p.total_amount, p.currency)}</TableCell>
                    <TableCell>
                      <NexBadge variant={getPaymentStatusVariant(p.status)} size="sm">
                        {p.status}
                      </NexBadge>
                    </TableCell>
                    <TableCell>
                      {p.receipt_url ? (
                        <a
                          href={p.receipt_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </NexCardContent>
        </NexCard>
      </div>
    </div>
  );
}
