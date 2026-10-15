import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Local dev only: when true, each generateDailyReport run is saved to works/out/flue-runs/<YYYYMMDD>/<n>/. */
const SAVE_FLUE_RUNS = true;

const FLUE_BASE_URL = process.env.FLUE_BASE_URL ?? "http://localhost:8787";

type Usage = { totalTokens?: number; cost?: { total?: number } };

type CoreResult = {
  generationNo: number;
  elapsedMs: number;
  usage: Usage;
  coreJson: unknown;
  input: string;
  agentOutputs: { signals?: unknown; interpretation: unknown; structuring: unknown; dropped_actors: unknown };
};

type ReportResult = {
  reportId: string;
  reportNo: number;
  generationNo: number;
  elapsedMs?: number;
  usage?: Usage;
  /** Set when the finalizer failed and the writer's draft was used instead. */
  finalizerError?: string;
  /** Missing on days without activity (rendered by code, no model call). */
  draft?: unknown;
  writerDraft?: unknown;
  subject: string;
  markdown: string;
  html: string;
};

async function callFlue<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${FLUE_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.FLUE_API_TOKEN ?? ""}` },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const json = (() => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  })();
  if (!res.ok || json?.status === "failed") {
    throw new Error(`Flue ${path} ${res.status}: ${String(json?.error ?? text).slice(0, 500)}`);
  }
  return json as T;
}

function saveRun(core: CoreResult, report: ReportResult) {
  if (!SAVE_FLUE_RUNS || !import.meta.env.DEV) return;
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date()).replaceAll("-", "");
  const root = join(process.cwd(), "works/out/flue-runs", day);
  mkdirSync(root, { recursive: true });
  let n = Math.max(0, ...readdirSync(root).map(Number).filter(Number.isInteger)) + 1;
  // Targets can run concurrently: mkdir fails when another run took the number.
  for (; ; n++) {
    try {
      mkdirSync(join(root, String(n)));
      break;
    } catch {}
  }
  const { signals, interpretation, structuring, dropped_actors } = core.agentOutputs;
  const files: Record<string, unknown> = {
    "0.input.txt": core.input,
    ...(signals !== undefined && { "1.extractor.json": signals }),
    "2.interpreter.json": { interpretation, dropped_actors },
    "3.structurer.json": structuring,
    "4.core.json": core.coreJson,
    ...(report.writerDraft !== undefined && { "5.writer.json": report.writerDraft }),
    ...(report.draft !== undefined && { "6.report.json": report.draft }),
    "7.report.md": report.markdown,
  };
  for (const [name, data] of Object.entries(files)) {
    writeFileSync(join(root, String(n), name), typeof data === "string" ? data : JSON.stringify(data, null, 2));
  }
}

/** Generates the next Daily Core generation, then the Daily Report from it (both saved by the Worker). */
export async function generateDailyReport(dailyCoreId: string) {
  const core = await callFlue<CoreResult>("/core/generate", { dailyCoreId });
  const report = await callFlue<ReportResult>("/report/generate", { dailyCoreId });
  try {
    saveRun(core, report);
  } catch (error) {
    console.warn("Flue run not saved:", error);
  }
  return {
    core,
    report,
    totalTokens: (core.usage.totalTokens ?? 0) + (report.usage?.totalTokens ?? 0),
    cost: (core.usage.cost?.total ?? 0) + (report.usage?.cost?.total ?? 0),
  };
}
