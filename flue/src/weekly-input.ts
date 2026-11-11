import { MAX_HIGHLIGHTS } from "./daily-core.ts";

// Daily report's six activity keys (daily-report.ts LABELS.metric). Counts sum across days.
// active_member_count is rollup "none": the same person would be counted once per day.
export const WEEKLY_METRIC_KEYS = [
  "slack_message_count",
  "github_commit_count",
  "github_pull_request_count",
  "github_issue_opened_count",
  "github_issue_closed_count",
  "active_member_count",
] as const;

const SUMMED_KEYS = new Set<string>(WEEKLY_METRIC_KEYS.filter((key) => key !== "active_member_count"));

export type Db = <T>(path: string) => Promise<T[]>;

type CoreRow = {
  daily_core_id: string;
  core_date: string;
  current_generation_no: number | null;
  quality_status: string;
  language: string;
  target_display_name: string;
};

type GenerationRow = {
  generation_id: string;
  daily_core_id: string;
  generation_no: number;
  quality_status: string | null;
};

type ItemRow = {
  generation_id: string;
  item_type: string;
  item_key: string;
  title: string | null;
  summary: string;
  status: string | null;
  importance: number | string | null;
  classifications_json?: { primary?: string } | null;
};

type MetricRow = {
  generation_id: string;
  metric_key: string;
  metric_value: number | string;
  rollup_hint: string;
  dimensions_json: { source_ident?: string } | null;
};

export type WeeklyHighlight = {
  item_key: string;
  title: string | null;
  summary: string;
  status: string | null;
  importance: number | null;
};

// Topic and progress rows for the topics section. category is the tagger's primary ("" when untagged).
export type WeeklyOther = {
  item_type: string;
  item_key: string;
  title: string | null;
  summary: string;
  status: string | null;
  category: string;
};

const OTHER_TYPES = ["topic", "progress_roadmap"];

export type WeeklyMetric = {
  key: string;
  value: number;
  rollup_hint: string;
  source_ident: string | null;
};

export type WeeklyDay = {
  date: string;
  core: {
    daily_core_id: string;
    generation_id: string;
    generation_no: number;
    quality_status: string | null;
    highlights: WeeklyHighlight[];
    others: WeeklyOther[];
    metrics: WeeklyMetric[];
  } | null;
};

export type WeeklyInput = {
  target_id: string;
  from: string;
  to: string;
  language: string | null;
  target_display_name: string | null;
  days: WeeklyDay[];
  metrics: { key: string; value: number }[];
  unsummed: { key: string; by_day: { date: string; value: number }[] }[];
  extra_metric_keys: string[];
};

const num = (value: number | string | null | undefined) => {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export function eachDate(from: string, to: string) {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) throw new Error(`bad range ${from}..${to}`);
  const dates: string[] = [];
  for (let t = start; t <= end; t += 86_400_000) dates.push(new Date(t).toISOString().slice(0, 10));
  return dates;
}

// Rows are whatever the loader fetched. Only the current succeeded generation's highlights count.
export function assembleWeeklyInput(
  targetId: string,
  from: string,
  to: string,
  cores: CoreRow[],
  generations: GenerationRow[],
  items: ItemRow[],
  metrics: MetricRow[],
): WeeklyInput {
  const byCore = new Map(cores.map((core) => [core.core_date, core]));
  const generationByCore = new Map(generations.map((generation) => [`${generation.daily_core_id}:${generation.generation_no}`, generation]));
  const days = eachDate(from, to).map((date): WeeklyDay => {
    const core = byCore.get(date);
    const generation =
      core?.current_generation_no == null
        ? undefined
        : generationByCore.get(`${core.daily_core_id}:${core.current_generation_no}`);
    if (!core || !generation) return { date, core: null };
    const highlights = items
      .filter((item) => item.generation_id === generation.generation_id && item.item_type === "highlight")
      .map((item) => ({
        item_key: item.item_key,
        title: item.title,
        summary: item.summary,
        status: item.status,
        importance: num(item.importance),
      }))
      .sort((a, b) => (b.importance ?? -1) - (a.importance ?? -1) || a.item_key.localeCompare(b.item_key));
    const others = items
      .filter((item) => item.generation_id === generation.generation_id && OTHER_TYPES.includes(item.item_type))
      .sort((a, b) => (num(b.importance) ?? -1) - (num(a.importance) ?? -1) || a.item_key.localeCompare(b.item_key))
      .map((item) => ({
        item_type: item.item_type,
        item_key: item.item_key,
        title: item.title,
        summary: item.summary,
        status: item.status,
        category: item.classifications_json?.primary ?? "",
      }));
    const dayMetrics = metrics
      .filter((metric) => metric.generation_id === generation.generation_id)
      .map((metric) => ({
        key: metric.metric_key,
        value: num(metric.metric_value) ?? 0,
        rollup_hint: metric.rollup_hint,
        source_ident: metric.dimensions_json?.source_ident ?? null,
      }));
    return {
      date,
      core: {
        daily_core_id: core.daily_core_id,
        generation_id: generation.generation_id,
        generation_no: generation.generation_no,
        quality_status: generation.quality_status ?? core.quality_status,
        highlights,
        others,
        metrics: dayMetrics,
      },
    };
  });

  const summed = new Map<string, number>();
  const held = new Map<string, { date: string; value: number }[]>();
  const extra = new Set<string>();
  for (const day of days) {
    if (!day.core) continue;
    const heldToday = new Map<string, number>();
    for (const metric of day.core.metrics) {
      if (!WEEKLY_METRIC_KEYS.includes(metric.key as (typeof WEEKLY_METRIC_KEYS)[number])) extra.add(metric.key);
      if (metric.rollup_hint === "sum" && SUMMED_KEYS.has(metric.key)) {
        summed.set(metric.key, (summed.get(metric.key) ?? 0) + metric.value);
      } else if (metric.rollup_hint !== "sum") {
        heldToday.set(metric.key, (heldToday.get(metric.key) ?? 0) + metric.value);
      }
    }
    for (const [key, value] of heldToday) (held.get(key) ?? held.set(key, []).get(key)!).push({ date: day.date, value });
  }

  const named = cores.find((core) => byCore.get(core.core_date));
  return {
    target_id: targetId,
    from,
    to,
    language: named?.language ?? null,
    target_display_name: named?.target_display_name ?? null,
    days,
    metrics: WEEKLY_METRIC_KEYS.filter((key) => summed.has(key)).map((key) => ({ key, value: summed.get(key)! })),
    unsummed: [...held].map(([key, by_day]) => ({ key, by_day })),
    extra_metric_keys: [...extra].sort(),
  };
}

export function weeklyInputProblems(week: WeeklyInput) {
  return [
    ...week.days.flatMap((day) =>
      day.core && day.core.highlights.length > MAX_HIGHLIGHTS
        ? [`${day.date}: highlights ${day.core.highlights.length} > ${MAX_HIGHLIGHTS}`]
        : [],
    ),
    ...week.extra_metric_keys.map((key) => `metric outside daily six: ${key}`),
  ];
}

const cols = (row: string, select: string) => `${row}&select=${select}`;

export async function loadWeeklyInput(db: Db, targetId: string, from: string, to: string) {
  const cores = await db<CoreRow>(
    cols(
      `daily_core_data?target_id=eq.${targetId}&core_date=gte.${from}&core_date=lte.${to}&order=core_date`,
      "daily_core_id,core_date,current_generation_no,quality_status,language,target_display_name",
    ),
  );
  const current = cores.filter((core) => core.current_generation_no != null);
  const generations = current.length
    ? await db<GenerationRow>(
        cols(
          `daily_core_generations?daily_core_id=in.(${current.map((core) => core.daily_core_id).join(",")})&generation_status=eq.succeeded`,
          "generation_id,daily_core_id,generation_no,quality_status",
        ),
      )
    : [];
  const wanted = new Set(current.map((core) => `${core.daily_core_id}:${core.current_generation_no}`));
  const currentGenerations = generations.filter((generation) => wanted.has(`${generation.daily_core_id}:${generation.generation_no}`));
  const ids = currentGenerations.map((generation) => generation.generation_id);
  const inIds = ids.length ? `generation_id=in.(${ids.join(",")})` : "";
  const [items, metrics] = inIds
    ? await Promise.all([
        db<ItemRow>(
          cols(
            `daily_core_items?${inIds}&item_type=in.(highlight,${OTHER_TYPES.join(",")})`,
            "generation_id,item_type,item_key,title,summary,status,importance,classifications_json",
          ),
        ),
        db<MetricRow>(
          cols(
            `daily_core_metrics?${inIds}`,
            "generation_id,metric_key,metric_value,rollup_hint,dimensions_json",
          ),
        ),
      ])
    : [[], []];
  return assembleWeeklyInput(targetId, from, to, cores, currentGenerations, items, metrics);
}
