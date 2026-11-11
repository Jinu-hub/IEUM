import * as v from "valibot";
import type { WeeklyInput } from "./weekly-input.ts";
import { inventedRefs } from "./weekly-writer.ts";

export const WEEKLY_AREAS_CAP = 6;

// Topic / progress rows of the week, not highlights. id is date/n so it never looks like a highlight's date#n.
export type AreaItem = {
  id: string;
  date: string;
  kind: string;
  title: string | null;
  summary: string;
  status: string | null;
  entities: string[];
};

export const WeeklyAreas = v.object({
  areas: v.array(
    v.object({
      name: v.pipe(v.string(), v.description("One entity name copied exactly from a cited item.")),
      ids: v.array(v.string()),
      text: v.string(),
    }),
  ),
});
export type WeeklyAreas = v.InferOutput<typeof WeeklyAreas>;

export function areaItems(week: WeeklyInput): AreaItem[] {
  return week.days.flatMap((day) =>
    (day.core?.others ?? []).map((item, index) => ({
      id: `${day.date}/${index + 1}`,
      date: day.date,
      kind: item.item_type === "progress_roadmap" ? "progress" : item.item_type,
      title: item.title,
      summary: item.summary,
      status: item.status,
      entities: item.entities,
    })),
  );
}

export function areasInput(week: WeeklyInput) {
  return JSON.stringify({ language: week.language, from: week.from, to: week.to, items: areaItems(week) }, null, 2);
}

// Leaving an item out is fine. An area must be named after something its cites name.
export function areasProblems(draft: WeeklyAreas, items: AreaItem[]) {
  const byId = new Map(items.map((item) => [item.id, item]));
  const seen = new Map<string, number>();
  const problems: string[] = [];
  if (!draft.areas.length) problems.push("no areas; write at least one");
  if (draft.areas.length > WEEKLY_AREAS_CAP) problems.push(`areas ${draft.areas.length} > ${WEEKLY_AREAS_CAP}; keep the main ones`);
  draft.areas.forEach((area, index) => {
    const n = index + 1;
    const cites = area.ids.map((id) => byId.get(id)).filter((item): item is AreaItem => !!item);
    if (!area.ids.length) problems.push(`area ${n} (${area.name}) cites nothing`);
    for (const id of area.ids) {
      if (!byId.has(id)) problems.push(`unknown id ${id}; use only ids from the input`);
      else if (seen.has(id)) problems.push(`id ${id} is in area ${seen.get(id)} and area ${n}; cite each item once`);
      else seen.set(id, n);
    }
    if (cites.length && !cites.some((item) => item.entities.includes(area.name))) {
      const names = [...new Set(cites.flatMap((item) => item.entities))];
      problems.push(`area ${n} name "${area.name}" is not an entity of its items; pick one of: ${names.join(", ") || "(none, cite items that name it)"}`);
    }
    if (!area.text.trim()) problems.push(`area ${n} (${area.name}) has empty text`);
    const source = cites.flatMap((item) => [item.title ?? "", item.summary]).join("\n");
    problems.push(...inventedRefs(source, area.text).map((line) => `area ${n}: ${line}; copy them from its items`));
  });
  return problems;
}
