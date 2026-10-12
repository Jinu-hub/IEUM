// Runs one Core agent (/core/agent, no DB writes) and saves each run for side-by-side review.
// Run (in flue/): npx tsx src/core-agent.run.ts --agent <extractor|interpreter|structurer> --label <name>
//   [--runs 3] [--id <dailyCoreId>] [--model <provider/model>] [--from <earlier run .json>]
// --from feeds an earlier agent's saved output to this one: the interpreter reads its `signals` instead of
// the raw lines, the structurer its `interpretation` (required). The day comes from that file unless --id.
// Needs the local Worker (npm run dev). FLUE_BASE_URL overrides http://localhost:8787.
// Writes works/out/core-agents/<date>-input.txt and <date>-<agent>-<label>-r<n>.json / .md;
// run numbers continue after the files already there, so reruns never overwrite.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

// 2026-10-09 LEAD, the day of runs 1-24 in works/out/261011.
const DEFAULT_DAY = "d36d689e-04bf-4bbf-821c-d307ea1a45d5";
const OUT = fileURLToPath(new URL("../../works/out/core-agents/", import.meta.url));
const AGENTS = ["extractor", "interpreter", "structurer"];

const { values: args } = parseArgs({
  options: {
    agent: { type: "string" },
    label: { type: "string" },
    runs: { type: "string", default: "1" },
    id: { type: "string" },
    model: { type: "string" },
    from: { type: "string" },
  },
});
if (!args.agent || !AGENTS.includes(args.agent)) throw new Error(`--agent must be one of ${AGENTS.join(", ")}`);
if (!args.label || !/^[\w.-]+$/.test(args.label)) throw new Error("--label <name> is required ([A-Za-z0-9_.-])");
process.loadEnvFile(fileURLToPath(new URL("../.dev.vars", import.meta.url)));
const base = process.env.FLUE_BASE_URL ?? "http://localhost:8787";

type Signal = { refs: string[]; kind: string; subject: string; fact: string };
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
type Interpretation = { overview_candidate: { summary: string }; core_items: Item[] };
type Placed = { item_key: string; title: string; summary: string; status?: string | null; core_item_ids: string[] };
type Structuring = {
  overview: { summary: string };
  highlights: Placed[];
  topics: Placed[];
  progress_roadmap: Placed[];
  member_activity: Placed[];
};
type Result = {
  status: string;
  error?: string;
  agent: string;
  dailyCoreId: string;
  coreDate: string;
  promptVersion: string;
  model: string;
  thinkingLevel?: string;
  elapsedMs: number;
  usage: { output?: number; cost?: { total?: number } };
  metrics: { rejections: string[] };
  input: { body: string; authors: Record<string, string> };
  signals?: Signal[];
  signalsBody?: string;
  interpretation?: Interpretation;
  droppedActors?: string[];
  review?: { uncited: string[]; pairs: string[]; upserted?: string[]; removed?: string[]; overviewRewritten?: boolean } | null;
  structuring?: Structuring;
  stats?: Record<string, unknown> & { unplaced_core_items?: string[] };
};

const from: Result | undefined = args.from ? JSON.parse(readFileSync(args.from, "utf8")) : undefined;
if (args.agent === "structurer" && !from?.interpretation) throw new Error("--agent structurer needs --from <interpreter run .json>");
if (from && args.agent === "interpreter" && !from.signals) throw new Error(`--from ${args.from} has no signals`);
const dailyCoreId = args.id ?? from?.dailyCoreId ?? DEFAULT_DAY;

const refOf = (line: string) => line.match(/^\s*(?:↳ )?\[([^\]]+)\]/)?.[1];
const block = (text: string) => ["```", text, "```", ""];

// The raw input with each line marked by what cites it: ✔ <labels>, ✘ a person's line nobody cites, · others.
function citations(r: Result, labelsByRef: Map<string, string[]>) {
  const lines = r.input.body.split("\n");
  const uncited = lines.filter((line) => {
    const ref = refOf(line);
    return ref && ref in r.input.authors && !labelsByRef.has(ref);
  });
  return [
    `## Uncited human lines (${uncited.length})`,
    "",
    ...uncited.map((line) => `- ${line.trim()}`),
    "",
    "## Input with citations",
    "",
    ...block(
      lines
        .map((line) => {
          const ref = refOf(line);
          if (!ref) return line;
          const by = labelsByRef.get(ref);
          return `${by ? `✔ ${by.join(",")}` : ref in r.input.authors ? "✘" : "·"}\t${line}`;
        })
        .join("\n"),
    ),
  ];
}

const labelsBy = <T>(list: T[], refs: (x: T) => string[], label: (x: T) => string) => {
  const map = new Map<string, string[]>();
  for (const x of list) for (const ref of new Set(refs(x))) map.set(ref, [...new Set([...(map.get(ref) ?? []), label(x)])]);
  return map;
};

function extractorBody(r: Result) {
  const signals = r.signals ?? [];
  return [
    `signals ${signals.length} (ack ${signals.filter((s) => s.kind === "ack").length}) | subjects ${new Set(signals.map((s) => s.subject.trim())).size}`,
    "",
    "## Signals",
    "",
    ...block(r.signalsBody ?? ""),
    ...citations(r, labelsBy(signals, (s) => s.refs, (s) => s.subject.trim())),
  ];
}

function interpreterBody(r: Result) {
  const { core_items: items, overview_candidate } = r.interpretation!;
  const rv = r.review;
  return [
    rv
      ? `first submission: uncited ${rv.uncited.length}, pairs ${rv.pairs.length}${rv.upserted ? ` -> revision upserted ${rv.upserted.length} (${rv.upserted.join(", ")}), removed ${rv.removed?.length ?? 0} (${rv.removed?.join(", ")}), overview ${rv.overviewRewritten ? "rewritten" : "kept"}` : rv.uncited.length || rv.pairs.length ? " -> no revision" : ""}`
      : "",
    r.signals ? `input: ${r.signals.length} signals from ${args.from}` : "input: raw lines",
    ...(rv?.pairs ?? []).map((pair) => `- pair: ${pair}`),
    r.droppedActors?.length ? `dropped actors: ${r.droppedActors.join("; ")}` : "",
    "",
    "## Overview",
    "",
    overview_candidate.summary,
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
    ...(r.signalsBody ? ["## Signals (interpreter input)", "", ...block(r.signalsBody)] : []),
    ...citations(r, labelsBy(items, (i) => i.evidence_refs, (i) => i.concept_key)),
  ];
}

function structurerBody(r: Result) {
  const s = r.structuring!;
  const items = new Map(r.interpretation!.core_items.map((item) => [item.concept_key, item]));
  const unplaced = r.stats?.unplaced_core_items ?? [];
  const sections = ["highlights", "topics", "progress_roadmap", "member_activity"] as const;
  return [
    `from: ${args.from} (${items.size} core items) | unplaced ${unplaced.length}`,
    "",
    "## Overview",
    "",
    s.overview.summary,
    "",
    ...sections.flatMap((section) => [
      `## ${section} (${s[section].length})`,
      "",
      ...s[section].flatMap((entry) => [
        `### ${entry.title}`,
        `\`${entry.item_key}\` | ${entry.status ?? "-"} | from ${entry.core_item_ids.map((id) => `${id} (${items.get(id)?.importance ?? "?"})`).join(", ")}`,
        "",
        entry.summary,
        "",
      ]),
    ]),
    `## Unplaced core items (${unplaced.length})`,
    "",
    ...unplaced.map((id) => `- \`${id}\` (importance ${items.get(id)?.importance ?? "?"}) ${items.get(id)?.title ?? ""}`),
    "",
    "## Stats",
    "",
    ...block(JSON.stringify(r.stats, null, 2)),
  ];
}

const render = (r: Result, label: string) =>
  [
    `# ${r.coreDate} ${r.agent} ${label} (${r.promptVersion}, ${r.model}, thinking ${r.thinkingLevel ?? "?"})`,
    "",
    `${(r.elapsedMs / 1000).toFixed(0)}s | output ${r.usage.output ?? "?"} tokens | $${r.usage.cost?.total?.toFixed(4) ?? "?"}`,
    ...r.metrics.rejections.map((text, i) => `rejection ${i + 1}: ${text.split("Received arguments")[0].trim().replace(/\s*\n\s*/g, " ")}`),
    ...(r.agent === "extractor" ? extractorBody(r) : r.agent === "interpreter" ? interpreterBody(r) : structurerBody(r)),
  ].join("\n");

const summary = (r: Result) => {
  if (r.agent === "extractor") return `signals ${r.signals?.length}`;
  const s = r.stats as Record<string, number>;
  if (r.agent === "interpreter") return `items ${s.core_items}, cited ${s.human_refs_cited}/${s.human_refs}`;
  const items = r.stats?.items as Record<string, number>;
  return `${Object.entries(items).map(([k, n]) => `${k} ${n}`).join(", ")}, unplaced ${r.stats?.unplaced_core_items?.length}`;
};

mkdirSync(OUT, { recursive: true });
const runs = Number(args.runs);
for (let i = 0; i < runs; i++) {
  const res = await fetch(`${base}/core/agent`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.FLUE_API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      dailyCoreId,
      agent: args.agent,
      model: args.model,
      ...(args.agent === "interpreter" && from && { signals: from.signals }),
      ...(args.agent === "structurer" && { interpretation: from!.interpretation }),
    }),
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
  const prefix = `${result.coreDate}-${args.agent}-${args.label}-r`;
  const n = readdirSync(OUT).filter((f) => f.startsWith(prefix) && f.endsWith(".json")).length + 1;
  const name = `${OUT}${prefix}${n}`;
  const inputFile = `${OUT}${result.coreDate}-input.txt`;
  if (!existsSync(inputFile)) writeFileSync(inputFile, result.input.body);
  writeFileSync(`${name}.json`, JSON.stringify(result, null, 2));
  writeFileSync(`${name}.md`, render(result, `${args.label}-r${n}`));
  console.log(
    `${args.agent} ${args.label}-r${n}: ${summary(result)}, ${(result.elapsedMs / 1000).toFixed(0)}s, $${result.usage.cost?.total?.toFixed(4) ?? "?"} -> ${name}.json`,
  );
}
