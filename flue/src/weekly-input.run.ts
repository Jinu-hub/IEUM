// Lists days that have a current generation, then loads one week.
// Run: npx tsx flue/src/weekly-input.run.ts [targetId from to]
// With no args, uses the target with the most current days and the Mon–Sun of its latest day.
import { readFileSync } from "node:fs";
import { loadWeeklyInput, type Db, weeklyInputProblems } from "./weekly-input.ts";

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

type CoreList = { target_id: string; core_date: string; target_display_name: string; quality_status: string; language: string };
const listed = await db<CoreList>(
  "daily_core_data?current_generation_no=not.is.null&select=target_id,core_date,target_display_name,quality_status,language&order=core_date",
);

const byTarget = new Map<string, CoreList[]>();
for (const row of listed) (byTarget.get(row.target_id) ?? byTarget.set(row.target_id, []).get(row.target_id)!).push(row);

const monday = (date: string) => {
  const t = Date.parse(`${date}T00:00:00Z`);
  const day = new Date(t).getUTCDay();
  return new Date(t - ((day + 6) % 7) * 86_400_000).toISOString().slice(0, 10);
};
const plus = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

const [argTarget, argFrom, argTo] = process.argv.slice(2);
const picked = argTarget
  ? { target_id: argTarget, from: argFrom, to: argTo }
  : (() => {
      const [target_id, rows] = [...byTarget].sort((a, b) => b[1].length - a[1].length)[0] ?? [];
      if (!target_id || !rows) throw new Error("no current daily core");
      const from = monday(rows.at(-1)!.core_date);
      return { target_id, from, to: plus(from, 6) };
    })();

const week = await loadWeeklyInput(db, picked.target_id, picked.from, picked.to);
const present = new Set(week.days.filter((day) => day.core).map((day) => day.date));
console.log(
  JSON.stringify(
    {
      targets: [...byTarget].map(([target_id, rows]) => ({
        target_id,
        name: rows[0].target_display_name,
        language: rows[0].language,
        dates: rows.map((row) => `${row.core_date} ${row.quality_status}`),
      })),
      week: {
        target_id: week.target_id,
        name: week.target_display_name,
        language: week.language,
        from: week.from,
        to: week.to,
        days: week.days.map((day) =>
          day.core
            ? {
                date: day.date,
                quality: day.core.quality_status,
                generation_no: day.core.generation_no,
                highlights: day.core.highlights.length,
                titles: day.core.highlights.map((item) => item.title),
              }
            : { date: day.date, core: null },
        ),
        metrics: week.metrics,
        unsummed: week.unsummed,
        extra_metric_keys: week.extra_metric_keys,
        problems: weeklyInputProblems(week),
        missing: week.days.filter((day) => !present.has(day.date)).map((day) => day.date),
      },
    },
    null,
    2,
  ),
);
