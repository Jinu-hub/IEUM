// Writes the topics section, then renders it with a saved merge and writer prose. No DB write.
// Run: npx tsx flue/src/weekly-topics.run.ts <targetId> <from> <to> <groups.json> <writer.json> <out>
// Needs the local Worker (npm run dev).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { loadWeeklyInput, type Db } from "./weekly-input.ts";
import { renderWeeklyReport } from "./weekly-report.ts";
import type { WeeklyTopics } from "./weekly-topics.ts";
import type { WeeklyDraft } from "./weekly-writer.ts";

const [targetId, from, to, groupsFile, writerFile, out] = process.argv.slice(2);
if (!targetId || !from || !to || !groupsFile || !writerFile || !out) {
  throw new Error("usage: weekly-topics.run.ts <targetId> <from> <to> <groups.json> <writer.json> <out>");
}
// Read inputs before the model call so a wrong path does not waste one.
const groups = (JSON.parse(readFileSync(groupsFile, "utf8")) as { groups: { ids: string[] }[] }).groups.map((group) => ({ ids: group.ids }));
const prose = (JSON.parse(readFileSync(writerFile, "utf8")) as { report: WeeklyDraft }).report;

const env: Record<string, string> = {};
for (const line of readFileSync(new URL("../.dev.vars", import.meta.url), "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const cut = trimmed.indexOf("=");
  if (cut < 0) continue;
  env[trimmed.slice(0, cut)] = trimmed.slice(cut + 1).replace(/^"|"$/g, "");
}
const base = env.FLUE_BASE_URL ?? "http://localhost:8787";
const res = await fetch(`${base}/weekly/topics`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.FLUE_API_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ targetId, from, to }),
});
const text = await res.text();
const result = JSON.parse(text) as {
  status: string;
  error?: string;
  promptVersion?: string;
  model?: string;
  elapsedMs?: number;
  usage?: { cost?: { total?: number } };
  rejections?: string[];
  categories?: WeeklyTopics["categories"];
};
if (result.status !== "succeeded" || !result.categories) throw new Error(`${res.status}: ${result.error ?? text.slice(0, 500)}`);

const db: Db = async <T>(path: string) => {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
  });
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${await response.text()}`);
  return (await response.json()) as T[];
};
const week = await loadWeeklyInput(db, targetId, from, to);
const rendered = renderWeeklyReport(week, groups, prose, result.categories);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(`${out}.json`, JSON.stringify(result, null, 2));
writeFileSync(`${out}.md`, rendered.markdown);
writeFileSync(`${out}.html`, rendered.html);
console.log(
  JSON.stringify({
    out,
    promptVersion: result.promptVersion,
    model: result.model,
    elapsedMs: result.elapsedMs,
    cost: result.usage?.cost?.total,
    rejections: result.rejections?.length ?? 0,
    categories: result.categories.map((entry) => ({ key: entry.key, ids: entry.ids.length })),
  }),
);
