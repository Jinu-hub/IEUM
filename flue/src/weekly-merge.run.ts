// Runs the weekly merge once and saves the groups for review. No DB write.
// Run: npx tsx flue/src/weekly-merge.run.ts <targetId> <from> <to> <out>
// Needs the local Worker (npm run dev). FLUE_BASE_URL overrides http://localhost:8787.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const [targetId, from, to, out] = process.argv.slice(2);
if (!targetId || !from || !to || !out) throw new Error("usage: weekly-merge.run.ts <targetId> <from> <to> <out>");

const env: Record<string, string> = {};
for (const line of readFileSync(new URL("../.dev.vars", import.meta.url), "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const cut = trimmed.indexOf("=");
  if (cut < 0) continue;
  env[trimmed.slice(0, cut)] = trimmed.slice(cut + 1).replace(/^"|"$/g, "");
}
const base = env.FLUE_BASE_URL ?? "http://localhost:8787";
const res = await fetch(`${base}/weekly/merge`, {
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
  usage?: { output?: number; cost?: { total?: number } };
  rejections?: string[];
  groups?: { ids: string[]; cites: { id: string; date: string; item_key: string; title: string | null; status: string | null; summary: string }[] }[];
};
if (result.status !== "succeeded" || !result.groups) throw new Error(`${res.status}: ${result.error ?? text.slice(0, 500)}`);

const lines = [
  `# Weekly merge ${from} – ${to}`,
  "",
  `${result.promptVersion} · ${result.model} · ${((result.elapsedMs ?? 0) / 1000).toFixed(0)}s · $${result.usage?.cost?.total?.toFixed(4) ?? "?"}`,
  ...(result.rejections ?? []).map((rejection, i) => `rejection ${i + 1}: ${rejection.split("\n")[0]}`),
  "",
];
result.groups.forEach((group, index) => {
  lines.push(`## ${index + 1} (${group.cites.length})`, "");
  for (const cite of group.cites) lines.push(`- ${cite.date} \`${cite.id}\` ${cite.status ?? "-"} ${cite.title ?? cite.item_key}`);
  lines.push("");
});
mkdirSync(dirname(out), { recursive: true });
writeFileSync(`${out}.json`, JSON.stringify(result, null, 2));
writeFileSync(`${out}.md`, lines.join("\n"));
console.log(
  JSON.stringify({
    groups: result.groups.length,
    cites: result.groups.reduce((sum, group) => sum + group.cites.length, 0),
    multi: result.groups.filter((group) => group.cites.length > 1).length,
    rejections: result.rejections?.length ?? 0,
    elapsedMs: result.elapsedMs,
    cost: result.usage?.cost?.total,
    out,
  }),
);
