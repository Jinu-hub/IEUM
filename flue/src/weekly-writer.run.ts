// Writes the weekly prose from a saved merge, then renders it. No DB write.
// Run: npx tsx flue/src/weekly-writer.run.ts <targetId> <from> <to> <groups.json> <out>
// Needs the local Worker (npm run dev).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { loadWeeklyInput, type Db } from "./weekly-input.ts";
import { renderWeeklyReport } from "./weekly-report.ts";
import type { WeeklyDraft } from "./weekly-writer.ts";

const [targetId, from, to, groupsFile, out] = process.argv.slice(2);
if (!targetId || !from || !to || !groupsFile || !out) {
  throw new Error("usage: weekly-writer.run.ts <targetId> <from> <to> <groups.json> <out>");
}

const env: Record<string, string> = {};
for (const line of readFileSync(new URL("../.dev.vars", import.meta.url), "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const cut = trimmed.indexOf("=");
  if (cut < 0) continue;
  env[trimmed.slice(0, cut)] = trimmed.slice(cut + 1).replace(/^"|"$/g, "");
}
const saved = JSON.parse(readFileSync(groupsFile, "utf8")) as { groups: { ids: string[] }[] };
const base = env.FLUE_BASE_URL ?? "http://localhost:8787";
const res = await fetch(`${base}/weekly/write`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.FLUE_API_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ targetId, from, to, groups: saved.groups.map((group) => ({ ids: group.ids })) }),
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
  report?: WeeklyDraft;
};
if (result.status !== "succeeded" || !result.report) throw new Error(`${res.status}: ${result.error ?? text.slice(0, 500)}`);

const db: Db = async <T>(path: string) => {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
  });
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${await response.text()}`);
  return (await response.json()) as T[];
};
const week = await loadWeeklyInput(db, targetId, from, to);
const groups = saved.groups.map((group) => ({ ids: group.ids }));
const rendered = renderWeeklyReport(week, groups, result.report);
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
    entries: result.report.entries.length,
  }),
);
