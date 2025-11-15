type EmailMetadataRow = {
    stats_json?: unknown;
    period_key?: unknown;
  } | Record<string, unknown>;
  
  type GitHubKpiMetadataRow = {
    period_key?: unknown;
    meta_json?: unknown;
  } | Record<string, unknown>;
  
  type SlackActivityMetadataRow = {
    period_key?: unknown;
    meta_json?: unknown;
  } | Record<string, unknown>;
  
  type SlackActivitySummaryEntry = {
    periodKey: string;
    range: string;
    activities: unknown[];
    meta: Record<string, unknown>;
    sortTimestamp: number;
  };
  
  type PeriodAccumulator = {
    count: number;
    memberCount: number;
    earliest: Date | null;
    latest: Date | null;
  };
  
  type GithubCaseEntry = {
    case?: unknown;
    commits?: unknown;
    count?: unknown;
  };

  type GithubDeveloperEntry = {
    name?: unknown;
    developer?: unknown;
    commits?: unknown;
    count?: unknown;
  };