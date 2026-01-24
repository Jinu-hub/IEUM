import type { PlanType, SubscriptionMode, SubscriptionStatus } from "~/core/lib/constants";

export type EmailMetadataRow = {
  stats_json?: unknown;
  period_key?: unknown;
} | Record<string, unknown>;

export type GitHubKpiMetadataRow = {
  period_key?: unknown;
  meta_json?: unknown;
} | Record<string, unknown>;

export type SlackActivityMetadataRow = {
  period_key?: unknown;
  meta_json?: unknown;
} | Record<string, unknown>;

export type SlackActivitySummaryEntry = {
  periodKey: string;
  range: string;
  activities: unknown[];
  meta: Record<string, unknown>;
  sortTimestamp: number;
};

export type PeriodAccumulator = {
  count: number;
  memberCount: number;
  earliest: Date | null;
  latest: Date | null;
};

export type GithubCaseEntry = {
  case?: unknown;
  commits?: unknown;
  count?: unknown;
};

export type GithubDeveloperEntry = {
  name?: unknown;
  developer?: unknown;
  commits?: unknown;
  count?: unknown;
};

export type SubscriptionInfo = {
  plan_type: PlanType;
  mode: SubscriptionMode;
  status: SubscriptionStatus;
} | null;