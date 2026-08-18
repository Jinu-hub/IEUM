import type {
  DailyCoreCategory,
  DailyCoreLanguage,
  DailyCoreMetricOrigin,
  DailyCoreRollupHint,
} from "./common";
import type { DailyCoreAgentResults } from "./agent-io";
import type { DailyCoreAnalysisFields } from "./daily-core-analysis";

export type DailyCoreEvidence = {
  source_type: string;
  source_ident: string;
  source_item_id: string;
  occurred_at: string;
  url?: string | null;
  excerpt?: string | null;
};

export type DailyCoreCanonicalItem = {
  item_key: string;
  title: string;
  summary: string;
  status?: string | null;
  importance?: number | null;
  confidence?: number | null;
  tags: string[];
  classifications: Record<string, unknown>;
  entities: Array<Record<string, unknown>>;
  evidence: DailyCoreEvidence[];
  payload: Record<string, unknown>;
};

export type DailyCoreMetric = {
  key: string;
  value: number;
  unit: string;
  origin: DailyCoreMetricOrigin;
  rollup_hint: DailyCoreRollupHint;
  dimensions?: Record<string, unknown>;
  evidence?: Record<string, unknown>;
};

export type DailyCoreQuality = {
  status: "ready" | "partial" | "empty";
  warnings?: string[];
};

export type DailyCoreMeta = {
  target_id: string;
  core_date: string;
  timezone: string;
  language: DailyCoreLanguage;
  target_display_name: string;
  target_category: DailyCoreCategory;
  window_start_at: string;
  window_end_at: string;
};

export type DailyCoreJson = {
  schema_version: string;

  meta: DailyCoreMeta;

  overview: DailyCoreAnalysisFields["overview"];

  highlights: DailyCoreCanonicalItem[];
  topics: DailyCoreCanonicalItem[];
  progress_roadmap: DailyCoreCanonicalItem[];
  member_activity: DailyCoreCanonicalItem[];

  metrics: DailyCoreMetric[];

  quality: DailyCoreQuality;
};

export type DailyCoreProjectionPayloads = {
  items: unknown[];
  metrics: unknown[];
  source_snapshots: unknown[];
};

export type FinalDailyCoreResult = {
  core_json: DailyCoreJson;
  projection_payloads: DailyCoreProjectionPayloads;
  agent_results: DailyCoreAgentResults;
};
