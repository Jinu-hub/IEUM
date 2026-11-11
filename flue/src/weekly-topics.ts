import * as v from "valibot";
import type { WeeklyInput } from "./weekly-input.ts";
import { inventedRefs } from "./weekly-writer.ts";

// Tagger primary → shown category. Small kinds share "other". Order is the render order.
export const TOPIC_CATEGORIES = ["bugfix", "feature", "coordination", "investigation", "other"] as const;
export type TopicCategory = (typeof TOPIC_CATEGORIES)[number];
const categoryOf = (primary: string): TopicCategory =>
  (TOPIC_CATEGORIES as readonly string[]).includes(primary) ? (primary as TopicCategory) : "other";

// Topic / progress rows of the week, not highlights. id is date/n so it never looks like a highlight's date#n.
export type TopicItem = {
  id: string;
  date: string;
  kind: string;
  title: string | null;
  summary: string;
  status: string | null;
  category: TopicCategory;
};

export const WeeklyTopics = v.object({
  categories: v.array(
    v.object({
      key: v.pipe(v.string(), v.description(`One of the input category keys.`)),
      ids: v.array(v.string()),
      text: v.string(),
    }),
  ),
});
export type WeeklyTopics = v.InferOutput<typeof WeeklyTopics>;

export function topicItems(week: WeeklyInput): TopicItem[] {
  return week.days.flatMap((day) =>
    (day.core?.others ?? []).map((item, index) => ({
      id: `${day.date}/${index + 1}`,
      date: day.date,
      kind: item.item_type === "progress_roadmap" ? "progress" : item.item_type,
      title: item.title,
      summary: item.summary,
      status: item.status,
      category: categoryOf(item.category),
    })),
  );
}

export function topicGroups(items: TopicItem[]) {
  return TOPIC_CATEGORIES.map((key) => ({ key, items: items.filter((item) => item.category === key) })).filter(
    (group) => group.items.length,
  );
}

export function topicsInput(week: WeeklyInput) {
  const categories = topicGroups(topicItems(week)).map((group) => ({
    key: group.key,
    count: group.items.length,
    items: group.items.map(({ category: _, ...item }) => item),
  }));
  return JSON.stringify({ language: week.language, from: week.from, to: week.to, categories }, null, 2);
}

// One paragraph per input category, citing only that category's items.
export function topicsProblems(draft: WeeklyTopics, items: TopicItem[]) {
  const groups = new Map(topicGroups(items).map((group) => [group.key as string, group.items]));
  const seen = new Set<string>();
  const problems: string[] = [];
  for (const entry of draft.categories) {
    const own = groups.get(entry.key);
    if (!own) {
      problems.push(`unknown category ${entry.key}; use only keys from the input`);
      continue;
    }
    if (seen.has(entry.key)) problems.push(`category ${entry.key} is written twice`);
    seen.add(entry.key);
    if (!entry.ids.length) problems.push(`category ${entry.key} cites nothing`);
    const ownIds = new Set(own.map((item) => item.id));
    for (const id of entry.ids) if (!ownIds.has(id)) problems.push(`id ${id} is not in category ${entry.key}`);
    if (!entry.text.trim()) problems.push(`category ${entry.key} has empty text`);
    const source = own.flatMap((item) => [item.title ?? "", item.summary]).join("\n");
    problems.push(...inventedRefs(source, entry.text).map((line) => `${entry.key}: ${line}; copy them from its items`));
  }
  const missing = [...groups.keys()].filter((key) => !seen.has(key));
  if (missing.length) problems.push(`categories not covered: ${missing.join(", ")}; write one for each`);
  return problems;
}
