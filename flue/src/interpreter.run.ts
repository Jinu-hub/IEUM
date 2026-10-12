// Runs only the core interpreter (/core/interpret, no DB writes) and saves each run for side-by-side review.
// Run (in flue/): npx tsx src/interpreter.run.ts --label v8 [--runs 3] [--id <dailyCoreId>] [--model <provider/model>]
// Needs the local Worker (npm run dev). FLUE_BASE_URL overrides http://localhost:8787.
// Writes works/out/interpreter-test-2610/<date>-input.txt and <date>-<label>-r<n>.json / .md;
// run numbers continue after the files already there, so reruns never overwrite.
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

// 2026-10-09 LEAD, the day of runs 1-24 in works/out/261011.
const DEFAULT_DAY = "d36d689e-04bf-4bbf-821c-d307ea1a45d5";
const OUT = fileURLToPath(new URL("../../works/out/interpreter-test-2610/", import.meta.url));

const { values: args } = parseArgs({
  options: {
    label: { type: "string" },
    runs: { type: "string", default: "1" },
    id: { type: "string", default: DEFAULT_DAY },
    model: { type: "string" },
  },
});
if (!args.label || !/^[\w.-]+$/.test(args.label)) throw new Error("--label <name> is required ([A-Za-z0-9_.-])");
process.loadEnvFile(fileURLToPath(new URL("../.dev.vars", import.meta.url)));
const base = process.env.FLUE_BASE_URL ?? "http://localhost:8787";

type Item = {
  concept_key: string;
  title: string;
  summary: string;
  importance: number;
  roles: string[];
  status?: string | null;
  actors: { type: string; name: string }[];
  evidence_refs: string[];
  progress?: { from?: string; to?: string };
  next_step: string | null;
};
type Result = {
  status: string;
  error?: string;
  coreDate: string;
  promptVersion: string;
  model: string;
  thinkingLevel?: string;
  elapsedMs: number;
  usage: { output?: number; cost?: { total?: number } };
  stats: { core_items: number; human_refs: number; human_refs_cited: number; people: number; people_as_actors: number };
  interpretation: { overview_candidate: { summary: string }; core_items: Item[] };
  droppedActors: string[];
  review?: { uncited: string[]; pairs: string[]; upserted?: string[]; removed?: string[]; overviewRewritten?: boolean } | null;
  metrics: { rejections: string[] };
  input: { body: string; authors: Record<string, string> };
};

const refOf = (line: string) => line.match(/^\s*(?:↳ )?\[([^\]]+)\]/)?.[1];

function review(r: Result, label: string) {
  const items = r.interpretation.core_items;
  const citedBy = new Map<string, string[]>();
  for (const item of items) {
    for (const ref of item.evidence_refs) citedBy.set(ref, [...(citedBy.get(ref) ?? []), item.concept_key]);
  }
  const lines = r.input.body.split("\n");
  const uncited = lines.filter((line) => {
    const ref = refOf(line);
    return ref && ref in r.input.authors && !citedBy.has(ref);
  });
  const { stats, usage, review: rv } = r;
  return [
    `# ${r.coreDate} ${label} (${r.promptVersion}, ${r.model}, thinking ${r.thinkingLevel ?? "?"})`,
    "",
    `items ${stats.core_items} | human lines cited ${stats.human_refs_cited}/${stats.human_refs} | members as actors ${stats.people_as_actors}/${stats.people} | ${(r.elapsedMs / 1000).toFixed(0)}s | output ${usage.output ?? "?"} tokens | $${usage.cost?.total?.toFixed(4) ?? "?"}`,
    rv
      ? `first submission: uncited ${rv.uncited.length}, pairs ${rv.pairs.length}${rv.upserted ? ` -> revision upserted ${rv.upserted.length} (${rv.upserted.join(", ")}), removed ${rv.removed?.length ?? 0} (${rv.removed?.join(", ")}), overview ${rv.overviewRewritten ? "rewritten" : "kept"}` : rv.uncited.length || rv.pairs.length ? " -> no revision" : ""}`
      : "",
    ...(rv?.pairs ?? []).map((pair) => `- pair: ${pair}`),
    r.droppedActors.length ? `dropped actors: ${r.droppedActors.join("; ")}` : "",
    ...r.metrics.rejections.map((text, i) => `rejection ${i + 1}: ${text.split("Received arguments")[0].trim().replace(/\s*\n\s*/g, " ")}`),
    "",
    "## Overview",
    "",
    r.interpretation.overview_candidate.summary,
    "",
    "## Items",
    "",
    ...[...items].sort((a, b) => b.importance - a.importance).flatMap((item) => [
      `### ${item.title}`,
      `\`${item.concept_key}\` | importance ${item.importance} | ${item.roles.join(", ")} | ${item.status ?? "-"} | ${item.actors.map((a) => a.name).join(", ")}`,
      "",
      item.summary,
      "",
      ...(item.progress?.from || item.progress?.to ? [`- progress: ${item.progress.from ?? "?"} → ${item.progress.to ?? "?"}`] : []),
      `- next: ${item.next_step ?? "-"}`,
      `- refs: ${item.evidence_refs.join(", ")}`,
      "",
    ]),
    `## Uncited human lines (${uncited.length})`,
    "",
    ...uncited.map((line) => `- ${line.trim()}`),
    "",
    "## Input with citations",
    "",
    "```",
    ...lines.map((line) => {
      const ref = refOf(line);
      if (!ref) return line;
      const by = citedBy.get(ref);
      return `${by ? `✔ ${by.join(",")}` : ref in r.input.authors ? "✘" : "·"}\t${line}`;
    }),
    "```",
    "",
  ].join("\n");
}

mkdirSync(OUT, { recursive: true });
const runs = Number(args.runs);
for (let i = 0; i < runs; i++) {
  const res = await fetch(`${base}/core/interpret`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.FLUE_API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ dailyCoreId: args.id, model: args.model }),
  });
  const text = await res.text();
  let result: Result;
  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(`${res.status}: ${text.slice(0, 500)}`);
  }
  if (result.status !== "succeeded") {
    console.error(`run ${i + 1}/${runs} failed: ${result.error ?? text.slice(0, 500)}`);
    continue;
  }
  const prefix = `${result.coreDate}-${args.label}-r`;
  const n = readdirSync(OUT).filter((f) => f.startsWith(prefix) && f.endsWith(".json")).length + 1;
  const name = `${OUT}${prefix}${n}`;
  const inputFile = `${OUT}${result.coreDate}-input.txt`;
  if (!existsSync(inputFile)) writeFileSync(inputFile, result.input.body);
  writeFileSync(`${name}.json`, JSON.stringify(result, null, 2));
  writeFileSync(`${name}.md`, review(result, `${args.label}-r${n}`));
  const s = result.stats;
  const rv = result.review;
  console.log(
    `${args.label}-r${n}: items ${s.core_items}, cited ${s.human_refs_cited}/${s.human_refs}${rv ? ` (first ${s.human_refs - rv.uncited.length}, pairs ${rv.pairs.length})` : ""}, actors ${s.people_as_actors}/${s.people}, ${(result.elapsedMs / 1000).toFixed(0)}s, $${result.usage.cost?.total?.toFixed(4) ?? "?"} -> ${name}.md`,
  );
}
