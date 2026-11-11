import * as v from "valibot";
import type { MergeGroups } from "./weekly-merge.ts";
import type { WeeklyInput } from "./weekly-input.ts";
import { movementKey, weeklyMovements } from "./weekly-report.ts";

export const WeeklyDraft = v.object({
  opening: v.string(),
  entries: v.array(v.object({ id: v.string(), text: v.string() })),
  closing: v.string(),
});
export type WeeklyDraft = v.InferOutput<typeof WeeklyDraft>;

const TICKET = /#\d{3,}|No\.\d{2,}|PR #\d{2,}/gi;
const PERSON = /[\u4e00-\u9fff]{1,4}さん|[A-Z][a-z]+(?: [A-Z][a-z]+)+/g;

const found = (text: string, pattern: RegExp) =>
  [...text.matchAll(new RegExp(pattern.source, pattern.flags))].map((match) => match[0]);

// Ticket numbers and person names in prose that the source does not have.
export function inventedRefs(source: string, prose: string) {
  return [
    [TICKET, "ticket numbers"],
    [PERSON, "names"],
  ].flatMap(([pattern, label]) => {
    const allowed = new Set(found(source, pattern as RegExp));
    const invented = [...new Set(found(prose, pattern as RegExp))].filter((token) => !allowed.has(token));
    return invented.length ? [`${label} not in the input: ${invented.join(", ")}`] : [];
  });
}

export function weeklyWriterInput(week: WeeklyInput, groups: MergeGroups["groups"]) {
  const movements = weeklyMovements(week, groups).map((thread) => ({
    id: movementKey(thread.ids),
    cites: thread.cites.map(({ id, date, title, summary, status }) => ({ id, date, title, summary, status })),
  }));
  return JSON.stringify(
    {
      language: week.language,
      from: week.from,
      to: week.to,
      metrics: week.metrics,
      movements,
    },
    null,
    2,
  );
}

// Ticket numbers and person-name spellings in the prose must already be in the movements.
export function writerProblems(draft: WeeklyDraft, week: WeeklyInput, groups: MergeGroups["groups"]) {
  const movements = weeklyMovements(week, groups);
  const ids = movements.map((thread) => movementKey(thread.ids));
  const known = new Set(ids);
  const problems: string[] = [];
  if (!draft.opening.trim()) problems.push("opening is empty");
  const seen = new Map<string, number>();
  draft.entries.forEach((entry, index) => {
    const n = index + 1;
    if (!entry.text.trim()) problems.push(`entry ${n} (${entry.id}) has empty text`);
    if (!known.has(entry.id)) problems.push(`unknown movement ${entry.id}; use only ids from the input`);
    else if (seen.has(entry.id)) problems.push(`movement ${entry.id} is in entry ${seen.get(entry.id)} and entry ${n}`);
    else seen.set(entry.id, n);
  });
  const missing = ids.filter((id) => !seen.has(id));
  if (missing.length) problems.push(`movements not covered: ${missing.join(", ")}; write one entry for each`);

  const source = movements
    .flatMap((thread) => thread.cites.flatMap((cite) => [cite.title ?? "", cite.summary]))
    .join("\n");
  const prose = [draft.opening, draft.closing, ...draft.entries.map((entry) => entry.text)].join("\n");
  problems.push(...inventedRefs(source, prose).map((line) => `${line}; copy them from the movements`));
  return problems;
}
