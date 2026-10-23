// Classification taxonomies for core-tagger (TODO 3-4 B안).
// Each site/product line is one pack keyed by version. Add another pack + TAXONOMIES entry to extend;
// do not widen a single list into "all industries". /core/generate writes this pack's version when
// the tagger call succeeds; on tagger failure it keeps "none". Later: targets.pipeline_options.taxonomy
// → resolveTaxonomyVersion.

export type TagRules = {
  maxPerItem: number;
  maxFree: number;
  maxFreeLength: number;
  pattern: RegExp;
};

export type TaxonomyPack = {
  version: string;
  primary: readonly string[];
  secondary: readonly string[];
  tagAllowlist: readonly string[];
  tagRules: TagRules;
  entityTypes: readonly string[];
};

// --- work-kind-v1: software / product engineering teams (seeded from D_G_S 2026-10-21~22) ---

const WORK_KIND_V1 = {
  version: "work-kind-v1",
  primary: [
    "bugfix", // defect / error / regression fix
    "feature", // new or changed product behavior
    "performance", // speed, load, query plan
    "release", // module send, main push for ship, cutover
    "docs_spec", // overview, FAQ, spec vs implementation
    "coordination", // priority, assignment, schedule, waiting on client/LW
    "investigation", // survey / repro without a ship yet
    "tooling", // internal tools (LEAD-tools, converters), not product UI
  ],
  secondary: [
    "admin", // 管理者機能
    "learning", // eラーニング / 進捗 / 受講
    "hr_sync", // 人事連携 / 組織コード
    "import_export", // インポート / エクスポート / CSV
    "extended_status", // 拡張ステータス
    "mail", // 公開メール / 日次配信
    "security", // 脆弱性 / 権限
    "other",
  ],
  tagAllowlist: ["module", "review", "main", "sql", "api", "ui", "batch", "deadline", "rollback", "hotfix"],
  tagRules: {
    maxPerItem: 5,
    maxFree: 2,
    maxFreeLength: 24,
    pattern: /^[a-z][a-z0-9-]{0,23}$/,
  },
  entityTypes: [
    "ticket", // No.68, #22777 — code extracts + contextual name (B3)
    "pull_request", // PR #558 — code extracts (B3)
    "person", // highlight/topic/progress: from payload.owners (Interpreter actors)
    "project", // eStudio, MillviV3 — tagger
    "component",
    "service",
  ],
} as const satisfies TaxonomyPack;

// Registry: new site taxonomy = new const + one line here.
export const TAXONOMIES: Record<string, TaxonomyPack> = {
  [WORK_KIND_V1.version]: WORK_KIND_V1,
};

export const DEFAULT_TAXONOMY_VERSION = WORK_KIND_V1.version;

export function getTaxonomy(version: string = DEFAULT_TAXONOMY_VERSION): TaxonomyPack {
  return TAXONOMIES[version] ?? TAXONOMIES[DEFAULT_TAXONOMY_VERSION]!;
}

// Hook for a future target.pipeline_options.taxonomy (or workspace default). Unknown keys fall back.
export function resolveTaxonomyVersion(options?: { taxonomy?: string } | null): string {
  const key = options?.taxonomy;
  return key && key in TAXONOMIES ? key : DEFAULT_TAXONOMY_VERSION;
}

// Convenience aliases for the default pack (tagger / checks import these).
export const TAXONOMY_VERSION = DEFAULT_TAXONOMY_VERSION;
export const PRIMARY = WORK_KIND_V1.primary;
export const SECONDARY = WORK_KIND_V1.secondary;
export const TAG_ALLOWLIST = WORK_KIND_V1.tagAllowlist;
export const TAG_RULES = WORK_KIND_V1.tagRules;
export const ENTITY_TYPES = WORK_KIND_V1.entityTypes;

export type Primary = (typeof PRIMARY)[number];
export type Secondary = (typeof SECONDARY)[number];
export type AllowedTag = (typeof TAG_ALLOWLIST)[number];
export type EntityType = (typeof ENTITY_TYPES)[number];

export type TaxonomyClassifications = {
  primary: Primary;
  secondary: Secondary[];
};
