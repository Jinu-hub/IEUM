const FLUE_BASE_URL = process.env.FLUE_BASE_URL ?? "http://localhost:8787";

type Usage = { totalTokens?: number; cost?: { total?: number } };

type CoreResult = { generationNo: number; elapsedMs: number; usage: Usage };

type ReportResult = {
  reportId: string;
  reportNo: number;
  generationNo: number;
  elapsedMs?: number;
  usage?: Usage;
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

/** Generates the next Daily Core generation, then the Daily Report from it (both saved by the Worker). */
export async function generateDailyReport(dailyCoreId: string) {
  const core = await callFlue<CoreResult>("/core/generate", { dailyCoreId });
  const report = await callFlue<ReportResult>("/report/generate", { dailyCoreId });
  return {
    core,
    report,
    totalTokens: (core.usage.totalTokens ?? 0) + (report.usage?.totalTokens ?? 0),
    cost: (core.usage.cost?.total ?? 0) + (report.usage?.cost?.total ?? 0),
  };
}
