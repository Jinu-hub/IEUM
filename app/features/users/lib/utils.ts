

type EmailMetadataRow = {
  stats_json?: unknown;
  period_key?: unknown;
} | Record<string, unknown>;

type GitHubKpiMetadataRow = {
  period_key?: unknown;
  meta_json?: unknown;
} | Record<string, unknown>;

type SlackActivityMetadataRow = {
  period_key?: unknown;
  meta_json?: unknown;
} | Record<string, unknown>;

type SlackActivitySummaryEntry = {
  periodKey: string;
  range: string;
  activities: unknown[];
  meta: Record<string, unknown>;
  sortTimestamp: number;
};

function parseRange(range?: unknown) {
  if (typeof range !== "string") {
    return undefined;
  }
  const [rawStart, rawEnd] = range
    .split("~")
    .map((part) => part?.trim())
    .filter(Boolean);
  if (!rawStart || !rawEnd) return undefined;

  const start = new Date(rawStart);
  const end = new Date(rawEnd);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return undefined;

  return { start, end };
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

type PeriodAccumulator = {
  count: number;
  memberCount: number;
  earliest: Date | null;
  latest: Date | null;
};

function periodKeyToTimestamp(periodKey: string) {
  if (!periodKey) return 0;

  // Daily: 20251110 or 2025-11-10
  if (/^\d{8}$/.test(periodKey)) {
    const year = Number(periodKey.slice(0, 4));
    const month = Number(periodKey.slice(4, 6)) - 1;
    const day = Number(periodKey.slice(6, 8));
    return Date.UTC(year, month, day);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(periodKey)) {
    const [year, month, day] = periodKey.split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  }

  // Weekly: 2025-W45
  const weeklyMatch = /^(\d{4})-W(\d{1,2})$/.exec(periodKey);
  if (weeklyMatch) {
    const year = Number(weeklyMatch[1]);
    const week = Number(weeklyMatch[2]);
    const jan4 = Date.UTC(year, 0, 4);
    const jan4Date = new Date(jan4);
    const jan4Day = jan4Date.getUTCDay() || 7;
    const mondayOfWeek1 = jan4 - (jan4Day - 1) * 24 * 60 * 60 * 1000;
    return mondayOfWeek1 + (week - 1) * 7 * 24 * 60 * 60 * 1000;
  }

  // Monthly: 2025-11
  const monthlyMatch = /^(\d{4})-(\d{2})$/.exec(periodKey);
  if (monthlyMatch) {
    const year = Number(monthlyMatch[1]);
    const month = Number(monthlyMatch[2]) - 1;
    return Date.UTC(year, month, 1);
  }

  // Fallback: try Date parsing
  const parsed = Date.parse(periodKey);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function extractEmailSentData(emailMetadata: EmailMetadataRow[] | null | undefined) {
  if (!Array.isArray(emailMetadata) || emailMetadata.length === 0) {
    return {
      emailSentCount: 0,
      emailSentMemberCount: 0,
      emailSentRange: "",
      latestPeriodKey: "",
      perPeriod: [],
    };
  }

  const perPeriodMap = new Map<string, PeriodAccumulator>();

  for (const row of emailMetadata) {
    let stats: unknown =
      typeof row === "object" && row !== null
        ? ("stats_json" in row ? (row as Record<string, unknown>).stats_json : row)
        : null;

    if (typeof stats === "string") {
      try {
        stats = JSON.parse(stats);
      } catch {
        stats = null;
      }
    }

    if (stats && typeof stats === "object" && !Array.isArray(stats)) {
      const statsRecord = stats as Record<string, unknown>;
      const rawCount = statsRecord["count"];
      const numericCount =
        typeof rawCount === "number"
          ? rawCount
          : typeof rawCount === "string"
          ? Number(rawCount)
          : undefined;

      let periodKey: string | undefined;
      if (typeof row === "object" && row !== null && "period_key" in row) {
        const rawPeriod = (row as Record<string, unknown>)["period_key"];
        if (typeof rawPeriod === "string") {
          periodKey = rawPeriod;
        } else if (rawPeriod != null) {
          periodKey = String(rawPeriod);
        }
      }
      if (!periodKey && statsRecord["period_key"] !== undefined && statsRecord["period_key"] !== null) {
        periodKey = String(statsRecord["period_key"]);
      }

      if (!periodKey) {
        periodKey = "unknown";
      }

      const accumulator =
        perPeriodMap.get(periodKey) ??
        perPeriodMap.set(periodKey, { count: 0, memberCount: 0, earliest: null, latest: null }).get(periodKey)!;

      accumulator.count += 1;
      if (typeof numericCount === "number" && Number.isFinite(numericCount)) {
        accumulator.memberCount += numericCount;
      }

      const rangeInfo = parseRange(statsRecord["range"]);
      if (rangeInfo) {
        if (!accumulator.earliest || rangeInfo.start < accumulator.earliest) {
          accumulator.earliest = rangeInfo.start;
        }
        if (!accumulator.latest || rangeInfo.end > accumulator.latest) {
          accumulator.latest = rangeInfo.end;
        }
      }
    }
  }

  const perPeriodEntries = Array.from(perPeriodMap.entries()).map(([periodKey, value]) => {
    const range =
      value.earliest && value.latest
        ? `${formatDate(value.earliest)} ~ ${formatDate(value.latest)}`
        : "";
    const sortTimestamp =
      value.latest?.getTime() ??
      value.earliest?.getTime() ??
      periodKeyToTimestamp(periodKey);
    return {
      periodKey,
      count: value.count,
      memberCount: value.memberCount,
      range,
      sortTimestamp,
    };
  });

  perPeriodEntries.sort((a, b) => b.sortTimestamp - a.sortTimestamp);

  const latestPeriod = perPeriodEntries[0];

  return {
    emailSentCount: latestPeriod?.count ?? 0,
    emailSentMemberCount: latestPeriod?.memberCount ?? 0,
    emailSentRange: latestPeriod?.range ?? "",
    latestPeriodKey: latestPeriod?.periodKey ?? "",
    perPeriod: perPeriodEntries.map(({ sortTimestamp, ...summary }) => summary),
  };
}

export function extractGitHubKpiData(githubKpi: GitHubKpiMetadataRow[] | null | undefined) {
  if (!Array.isArray(githubKpi) || githubKpi.length === 0) {
    return {
      latestPeriodKey: "",
      latest: null,
      perPeriod: [],
    };
  }

  const perPeriod = githubKpi
    .filter((row) => row && row.meta_json && typeof row.meta_json === "object" && !Array.isArray(row.meta_json))
    .map((row) => {
      const periodKey = typeof row.period_key === "string" ? row.period_key : String(row.period_key ?? "");
      const meta = row.meta_json as Record<string, unknown>;
      const range = typeof meta["range"] === "string" ? meta["range"] : "";
      const rangeEnd = range.split("~")[1]?.trim() ?? "";

      return {
        periodKey,
        meta,
        range,
        sortTimestamp: periodKeyToTimestamp(rangeEnd || periodKey),
      };
    })
    .sort((a, b) => b.sortTimestamp - a.sortTimestamp)
    .map(({ sortTimestamp, range, ...rest }) => rest);

  const latest = perPeriod[0] ?? null;

  return {
    latestPeriodKey: latest?.periodKey ?? "",
    latest,
    perPeriod,
  };
}

function normalizeSlackMeta(metaRaw: unknown): { range: string; activities: unknown[]; meta: Record<string, unknown> } {
  let meta: Record<string, unknown> = {};
  if (metaRaw && typeof metaRaw === "object" && !Array.isArray(metaRaw)) {
    meta = metaRaw as Record<string, unknown>;
  } else if (Array.isArray(metaRaw) && metaRaw.length > 0) {
    const candidate = metaRaw.find(
      (item) => item && typeof item === "object" && !Array.isArray(item),
    ) as Record<string, unknown> | undefined;
    if (candidate) {
      meta = candidate;
    }
  }
  const range = typeof meta["range"] === "string" ? (meta["range"] as string) : "";
  const activities = Array.isArray(meta["activities"]) ? (meta["activities"] as unknown[]) : [];
  return { range, activities, meta };
}

export function extractSlackActivityData(slackActivity: SlackActivityMetadataRow[] | null | undefined) {
  if (!Array.isArray(slackActivity) || slackActivity.length === 0) {
    return {
      latestPeriodKey: "",
      latest: null,
      perPeriod: [],
    };
  }

  const perPeriod: SlackActivitySummaryEntry[] = slackActivity
    .map((row) => {
      let metaRaw =
        typeof row === "object" && row !== null
          ? ("meta_json" in row ? (row as Record<string, unknown>).meta_json : row)
          : null;

      if (typeof metaRaw === "string") {
        try {
          metaRaw = JSON.parse(metaRaw);
        } catch {
          metaRaw = {};
        }
      }

      const periodKey = typeof row?.period_key === "string" ? row.period_key : String(row?.period_key ?? "");

      const normalized = normalizeSlackMeta(metaRaw);
      const rangeEnd = normalized.range.split("~")[1]?.trim() ?? "";

      return {
        periodKey,
        range: normalized.range,
        activities: normalized.activities,
        meta: normalized.meta,
        sortTimestamp: periodKeyToTimestamp(rangeEnd || periodKey),
      };
    })
    .sort((a, b) => b.sortTimestamp - a.sortTimestamp);

  const latest = perPeriod[0] ?? null;

  return {
    latestPeriodKey: latest?.periodKey ?? "",
    latest,
    perPeriod,
  };
}