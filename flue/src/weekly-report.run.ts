// Writes the Phase 2 review render for one week. LLM 0, no DB write.
// Run: npx tsx flue/src/weekly-report.run.ts <targetId> <from> <to> <out>
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { loadWeeklyInput, type Db } from "./weekly-input.ts";
import { renderWeeklyReport, weeklyReportProblems } from "./weekly-report.ts";

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
const db: Db = async <T>(path: string) => {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return (await res.json()) as T[];
};

const week = await loadWeeklyInput(db, targetId, from, to);
const rendered = renderWeeklyReport(week);
const problems = weeklyReportProblems(week, rendered.view);
if (problems.length) throw new Error(problems.join("\n"));
mkdirSync(dirname(out), { recursive: true });
writeFileSync(`${out}.md`, rendered.markdown);
writeFileSync(`${out}.html`, rendered.html);
const highlights = week.days.reduce((sum, day) => sum + (day.core?.highlights.length ?? 0), 0);
console.log(
  JSON.stringify({
    out,
    highlights,
    days: rendered.view.days.map((day) => ({ date: day.date, entries: day.entries.length, note: day.note })),
    metrics: rendered.view.metrics,
    markdown: rendered.markdown.length,
    html: rendered.html.length,
  }),
);
