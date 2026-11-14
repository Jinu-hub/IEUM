// Merge, then writer, then topics, and render the weekly report. No DB write.
// Run: npx tsx flue/src/weekly-report.run.ts <targetId> <from> <to> <out>
// Writes <out>.merge.json and <out>.writer.json as each step finishes, so a later step
// can be re-run alone with weekly-writer.run.ts / weekly-topics.run.ts.
// Needs the local Worker (npm run dev). FLUE_BASE_URL overrides http://localhost:8787.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { loadWeeklyInput, type Db } from "./weekly-input.ts";
import { renderWeeklyReport } from "./weekly-report.ts";
import type { WeeklyTopics } from "./weekly-topics.ts";
import type { WeeklyDraft } from "./weekly-writer.ts";

const [targetId, from, to, out] = process.argv.slice(2);
if (!targetId || !from || !to || !out) throw new Error("usage: weekly-report.run.ts <targetId> <from> <to> <out>");

const env: Record<string, string> = {};
for (const line of readFileSync(new URL("../.dev.vars", import.meta.url), "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const cut = trimmed.indexOf("=");
  if (cut < 0) continue;
  env[trimmed.slice(0, cut)] = trimmed.slice(cut + 1).replace(/^"|"$/g, "");
}
const base = env.FLUE_BASE_URL ?? "http://localhost:8787";

type Call = {
  status: string;
  error?: string;
  promptVersion?: string;
  model?: string;
  elapsedMs?: number;
  usage?: { cost?: { total?: number } };
  rejections?: string[];
};

const post = async (path: string, body: unknown) => {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.FLUE_API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let result: Call;
  try {
    result = JSON.parse(text) as Call;
  } catch {
    throw new Error(`${path} ${res.status}: ${text.slice(0, 500)}`);
  }
  if (result.status !== "succeeded") throw new Error(`${path} ${res.status}: ${result.error ?? text.slice(0, 500)}`);
  return result;
};

mkdirSync(dirname(out), { recursive: true });

const merge = (await post("/weekly/merge", { targetId, from, to })) as Call & { groups?: { ids: string[] }[] };
if (!merge.groups?.length) throw new Error("/weekly/merge: no groups");
writeFileSync(`${out}.merge.json`, JSON.stringify(merge, null, 2));

const groups = merge.groups.map((group) => ({ ids: group.ids }));
const writer = (await post("/weekly/write", { targetId, from, to, groups })) as Call & { report?: WeeklyDraft };
if (!writer.report) throw new Error("/weekly/write: no report");
writeFileSync(`${out}.writer.json`, JSON.stringify(writer, null, 2));

const topics = (await post("/weekly/topics", { targetId, from, to })) as Call & { categories?: WeeklyTopics["categories"] };
if (!topics.categories) throw new Error("/weekly/topics: no categories");

const db: Db = async <T>(path: string) => {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
  });
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${await response.text()}`);
  return (await response.json()) as T[];
};
const week = await loadWeeklyInput(db, targetId, from, to);
const rendered = renderWeeklyReport(week, groups, writer.report, topics.categories);
writeFileSync(`${out}.json`, JSON.stringify({ merge, writer, topics }, null, 2));
writeFileSync(`${out}.md`, rendered.markdown);
writeFileSync(`${out}.html`, rendered.html);

const steps = [merge, writer, topics];
console.log(
  JSON.stringify({
    out,
    groups: merge.groups.length,
    entries: writer.report.entries.length,
    categories: topics.categories.map((entry) => ({ key: entry.key, ids: entry.ids.length })),
    rejections: steps.reduce((sum, step) => sum + (step.rejections?.length ?? 0), 0),
    elapsedMs: steps.reduce((sum, step) => sum + (step.elapsedMs ?? 0), 0),
    cost: steps.reduce((sum, step) => sum + (step.usage?.cost?.total ?? 0), 0),
  }),
);
