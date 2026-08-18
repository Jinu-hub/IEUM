import type { Classifications, EntityRef, OverviewSummary } from "./common";

export type DailyCoreAnalysisItem = {
  item_key: string;

  title: string;
  summary: string;

  status?: string | null;
  importance?: number | null;
  confidence?: number | null;

  tags: string[];

  classifications: Classifications;
  entities: EntityRef[];

  evidence_refs: string[];

  payload: Record<string, unknown>;
};

export type DailyCoreAnalysisFields = {
  overview: OverviewSummary;

  highlights: DailyCoreAnalysisItem[];
  topics: DailyCoreAnalysisItem[];
  progress_roadmap: DailyCoreAnalysisItem[];
  member_activity: DailyCoreAnalysisItem[];
};
