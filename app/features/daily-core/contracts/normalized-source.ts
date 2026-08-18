import type { EntityRef } from "./common";

export type NormalizedSourceType = "slack_channel" | "github_repo" | "notion_page" | "jira_issue";

export type NormalizedSourceItem = {
  source_ref: string;

  source_type: NormalizedSourceType;
  source_ident: string;
  source_item_id: string;

  occurred_at: string;

  author?: {
    id?: string;
    name?: string;
  };

  title?: string | null;
  content: string;
  url?: string | null;

  thread_ref?: string | null;
  parent_ref?: string | null;

  entities?: EntityRef[];

  tags?: string[];

  meta?: Record<string, unknown>;
};
