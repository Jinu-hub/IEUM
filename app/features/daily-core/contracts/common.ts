import type { Database } from "database.types";

export type DailyCoreLanguage = Database["public"]["Enums"]["language"];
export type DailyCoreCategory = Database["public"]["Enums"]["category_type"];
export type DailyCoreQualityStatus = Database["public"]["Enums"]["daily_core_quality_status"];
export type DailyCoreMetricOrigin = Database["public"]["Enums"]["daily_core_metric_origin"];
export type DailyCoreRollupHint = Database["public"]["Enums"]["daily_core_rollup_hint"];
export type DailyCoreItemType = Database["public"]["Enums"]["daily_core_item_type"];

export type ActorType = "member" | "team" | "system" | "other";

export type ActorRef = {
  type: ActorType;
  name: string;
  ident?: string;
};

export type EntityRef = {
  type: string;
  name: string;
  ident?: string;
};

export type Classifications = {
  primary: string;
  secondary: string[];
  attributes: Record<string, unknown>;
};

export type OverviewSummary = {
  summary: string;
  key_points: string[];
};

export type KnownConceptItem = {
  concept_key: string;
  title: string;
};

export type DailyCoreTargetContext = {
  target_id: string;
  target_display_name: string;
  target_category: DailyCoreCategory;
  language: DailyCoreLanguage;
};

export type DailyCoreWindowContext = {
  core_date: string;
  window_start_at: string;
  window_end_at: string;
  timezone: string;
};

export type CoreItemRole = "highlight" | "topic" | "progress" | "member_activity";

export type CoreItemStatus = "planned" | "in_progress" | "blocked" | "completed" | "unknown";

export type ProgressTransition = {
  from?: string;
  to?: string;
  next_step?: string;
};
