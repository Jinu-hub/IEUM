import * as v from "valibot";
import type { WeeklyInput } from "./weekly-input.ts";

// The model cites these short ids. Code resolves them to (date, item_key); item_key is only unique within a day.
export type MergeItem = {
  id: string;
  date: string;
  item_key: string;
  title: string | null;
  summary: string;
  status: string | null;
};

export const MergeGroups = v.object({
  groups: v.array(v.object({ ids: v.array(v.string()) })),
});
export type MergeGroups = v.InferOutput<typeof MergeGroups>;

export function mergeItems(week: WeeklyInput): MergeItem[] {
  return week.days.flatMap((day) =>
    (day.core?.highlights ?? []).map((item, index) => ({
      id: `${day.date}#${index + 1}`,
      date: day.date,
      item_key: item.item_key,
      title: item.title,
      summary: item.summary,
      status: item.status,
    })),
  );
}

export function mergeInput(week: WeeklyInput) {
  const items = mergeItems(week).map(({ id, date, item_key, title, summary, status }) => ({
    id,
    date,
    item_key,
    title,
    summary,
    status,
  }));
  return JSON.stringify({ from: week.from, to: week.to, items }, null, 2);
}

// Unknown cite, one highlight in two groups, or a highlight left out. A group of one is valid.
export function mergeProblems(merge: MergeGroups, items: { id: string }[]) {
  const known = new Set(items.map((item) => item.id));
  const seen = new Map<string, number>();
  const problems: string[] = [];
  merge.groups.forEach((group, index) => {
    const groupNo = index + 1;
    if (!group.ids.length) problems.push(`group ${groupNo} is empty; omit it or cite at least one id`);
    for (const id of group.ids) {
      if (!known.has(id)) problems.push(`unknown id ${id}; use only ids from the input`);
      else if (seen.has(id)) problems.push(`id ${id} is in group ${seen.get(id)} and group ${groupNo}; cite each highlight once`);
      else seen.set(id, groupNo);
    }
  });
  const missing = items.filter((item) => !seen.has(item.id)).map((item) => item.id);
  if (missing.length) problems.push(`highlights not covered: ${missing.join(", ")}; cite every highlight in exactly one group`);
  return problems;
}
