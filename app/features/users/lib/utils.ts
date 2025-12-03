import type React from "react";
import { DEFAULT_PALETTE, STATS_CARD_STYLE } from "./constants";
import type {
  EmailMetadataRow,
  GithubCaseEntry,
  GithubDeveloperEntry,
  GitHubKpiMetadataRow,
  PeriodAccumulator,
  SlackActivityMetadataRow,
  SlackActivitySummaryEntry,
} from "./types";

/**
 * Parse the range string into a start and end date.
 * @param range - The range string to parse.
 * @returns The start and end date.
 */
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

/**
 * Convert the period key to a timestamp.
 * @param periodKey - The period key to convert.
 * @returns The timestamp.
 */
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

/**
 * Extract the email sent data from the email metadata.
 * @param emailMetadata - The email metadata to extract the data from.
 * @returns The email sent data.
 */
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

/**
 * Extract the GitHub KPI data from the GitHub KPI metadata.
 * @param githubKpi - The GitHub KPI metadata to extract the data from.
 * @returns The GitHub KPI data.
 */
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

/**
 * Normalize the Slack metadata.
 * @param metaRaw - The Slack metadata to normalize.
 * @returns The normalized Slack metadata.
 */
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

/**
 * Extract the Slack activity data from the Slack activity metadata.
 * @param slackActivity - The Slack activity metadata to extract the data from.
 * @returns The Slack activity data.
 */
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

type GithubSummaryPeriod = ReturnType<typeof extractGitHubKpiData>['perPeriod'][number];
type SlackSummaryPeriod = ReturnType<typeof extractSlackActivityData>['perPeriod'][number];

/**
 * Create the Slack channel activity data for chart.
 * @param perPeriod - The per period data from Slack activity.
 * @param weeks - The number of weeks to include (default: 8).
 * @returns The Slack channel activity data for chart.
 */
export function createSlackChannelActivityData(
  perPeriod: SlackSummaryPeriod[],
  weeks: number = 8,
) {
  if (perPeriod.length === 0) {
    return [] as Array<{ name: string; value: number; value2: number }>;
  }

  const periodsToUse = perPeriod.slice(0, weeks);
  const result: Array<{ name: string; value: number; value2: number }> = [];

  for (const period of periodsToUse) {
    const activities = Array.isArray(period?.activities) ? period.activities : [];
    
    // 주별로 messageCount와 reactionCount 합산
    let totalMessageCount = 0;
    let totalReactionCount = 0;
    
    for (const activity of activities) {
      if (activity && typeof activity === "object" && !Array.isArray(activity)) {
        const activityRecord = activity as Record<string, unknown>;
        
        const messageCount = typeof activityRecord.messageCount === 'number'
          ? activityRecord.messageCount
          : 0;
        
        const reactionCount = typeof activityRecord.reactionCount === 'number'
          ? activityRecord.reactionCount
          : 0;
        
        totalMessageCount += messageCount;
        totalReactionCount += reactionCount;
      }
    }

    // 주간 표시 이름 생성 (periodKey에서 주 번호 추출)
    const periodKey = period?.periodKey ?? '';
    const displayName = periodKey.includes('-W')
      ? `W${periodKey.split('-W')[1]}`
      : periodKey || 'Unknown';

    result.push({
      name: displayName,
      value: totalMessageCount,
      value2: totalReactionCount,
    });
  }

  if (result.length === 1) {
    result.unshift({ name: 'None', value: 0, value2: 0 });
  }

  return result.reverse();
}

/**
 * Create the Slack channel summary data aggregated by channel.
 * @param perPeriod - The per period data from Slack activity.
 * @param weeks - The number of weeks to aggregate (default: 8).
 * @returns The Slack channel summary data.
 */
export function createSlackChannelSummaryData(
  perPeriod: SlackSummaryPeriod[],
  weeks: number = 8,
) {
  if (perPeriod.length === 0) {
    return [] as Array<{ channel: string; messages: number; reactions: number; color: string }>;
  }

  const periodsToUse = perPeriod.slice(0, weeks);
  const channelMap = new Map<string, { messages: number; reactions: number }>();

  // 여러 주간의 데이터를 채널별로 합산
  for (const period of periodsToUse) {
    const activities = Array.isArray(period?.activities) ? period.activities : [];
    
    for (const activity of activities) {
      if (activity && typeof activity === "object" && !Array.isArray(activity)) {
        const activityRecord = activity as Record<string, unknown>;
        
        const rawChannelName = typeof activityRecord.channelName === 'string'
          ? activityRecord.channelName
          : null;
        
        if (rawChannelName) {
          // channelName에서 실제 채널명 추출 (예: 'CDR68RY0L:dev_lead' -> 'dev_lead')
          const channelName = rawChannelName.includes(':')
            ? rawChannelName.split(':').slice(1).join(':')
            : rawChannelName;
          
          const messageCount = typeof activityRecord.messageCount === 'number'
            ? activityRecord.messageCount
            : 0;
          
          const reactionCount = typeof activityRecord.reactionCount === 'number'
            ? activityRecord.reactionCount
            : 0;
          
          const currentStats = channelMap.get(channelName) ?? { messages: 0, reactions: 0 };
          channelMap.set(channelName, {
            messages: currentStats.messages + messageCount,
            reactions: currentStats.reactions + reactionCount,
          });
        }
      }
    }
  }

  // 색상 팔레트
  const colors = ['primary', 'success', 'warning', 'info', 'danger', 'secondary'];
  
  // Map을 배열로 변환하고 채널명 기준으로 정렬
  const result = Array.from(channelMap.entries())
    .map(([channelName, stats], index) => ({
      channel: `#${channelName}`,
      messages: stats.messages,
      reactions: stats.reactions,
      color: colors[index % colors.length] as 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'secondary',
    }))
    .sort((a, b) => a.channel.localeCompare(b.channel));

  return result;
}

/**
 * Create the GitHub commit raw data.
 * @param perPeriod - The per period data.
 * @param weeks - The number of weeks to include (default: 8).
 * @returns The GitHub commit raw data.
 */
export function createGithubCommitRaw(perPeriod: GithubSummaryPeriod[], weeks: number = 8) {
  const mapped = perPeriod
    .slice(0, weeks)
    .map((period) => {
      const periodKey = period?.periodKey ?? '';
      const displayName = periodKey.includes('-W')
        ? `W${periodKey.split('-W')[1]}`
        : periodKey || 'Unknown';
      const totalCommits = typeof period?.meta?.totalCommits === 'number'
        ? period.meta.totalCommits
        : 0;

      return {
        name: displayName,
        value: totalCommits,
        value2: 0,
      };
    });

  if (mapped.length === 1) {
    mapped.push({ name: 'None', value: 0, value2: 0 });
  }

  return mapped.reverse();
}

/**
 * Create the GitHub case commit data.
 * @param perPeriod - The per period data.
 * @param weeks - The number of weeks to aggregate (default: 1).
 * @returns The GitHub case commit data.
 */
export function createGithubCaseCommitData(
  perPeriod: GithubSummaryPeriod[],
  weeks: number = 1,
) {
  if (perPeriod.length === 0) {
    return [] as Array<{ name: string; value: number }>;
  }

  // 여러 주간의 데이터를 합산
  const periodsToAggregate = perPeriod.slice(0, weeks);
  const caseMap = new Map<string, number>();

  for (const period of periodsToAggregate) {
    const cases = Array.isArray(period?.meta?.commitsByCase)
      ? (period.meta?.commitsByCase as GithubCaseEntry[])
      : [];

    for (const entry of cases) {
      const rawName = typeof entry.case === 'string' && entry.case
        ? entry.case
        : 'Unknown';
      const rawCommits = entry.commits ?? entry.count;
      const commits = typeof rawCommits === 'number'
        ? rawCommits
        : typeof rawCommits === 'string'
          ? Number(rawCommits)
          : 0;

      if (Number.isFinite(commits) && commits > 0) {
        const currentCount = caseMap.get(rawName) ?? 0;
        caseMap.set(rawName, currentCount + commits);
      }
    }
  }

  // Map을 배열로 변환하고 정렬
  const mapped = Array.from(caseMap.entries()).map(([name, commits]) => ({
    name,
    value: commits,
  }));

  return mapped.sort((a, b) => b.value - a.value);
}

/**
 * Apply color palette to GitHub case commit data.
 * @param caseData - The case commit data to apply colors to.
 * @returns The case data with color property added.
 */
export function addColorToGithubCaseData(
  caseData: Array<{ name: string; value: number }>
) {
  
  const palette = DEFAULT_PALETTE;

  return caseData.map((item, index) => ({
    ...item,
    color: palette[index % palette.length],
  }));
}

/**
 * Create the GitHub developer commit data.
 * @param perPeriod - The per period data.
 * @param topN - The top N developers to return.
 * @param weeks - The number of weeks to aggregate (default: 4).
 * @returns The GitHub developer commit data.
 */
export function createGithubDeveloperCommitData(
  perPeriod: GithubSummaryPeriod[],
  topN: number = 5,
  weeks: number = 1,
) {
  if (perPeriod.length === 0) {
    return [] as Array<{ name: string; desktop: number; mobile: number }>;
  }

  // 여러 주간의 데이터를 합산
  const periodsToAggregate = perPeriod.slice(0, weeks);
  const developerMap = new Map<string, number>();

  for (const period of periodsToAggregate) {
    const developers = Array.isArray(period?.meta?.commitsByDeveloper)
      ? (period.meta?.commitsByDeveloper as GithubDeveloperEntry[])
      : [];

    for (const entry of developers) {
      const rawName = (typeof entry.name === 'string' && entry.name)
        || (typeof entry.developer === 'string' && entry.developer)
        || 'Unknown';
      const rawCommits = entry.commits ?? entry.count;
      const commits = typeof rawCommits === 'number'
        ? rawCommits
        : typeof rawCommits === 'string'
          ? Number(rawCommits)
          : 0;

      if (Number.isFinite(commits) && commits > 0) {
        const currentCount = developerMap.get(rawName) ?? 0;
        developerMap.set(rawName, currentCount + commits);
      }
    }
  }

  // Map을 배열로 변환
  const mapped = Array.from(developerMap.entries()).map(([name, commits]) => ({
    name,
    desktop: commits,
    mobile: 0,
  }));

  const othersEntry = mapped.find((item) => item.name === 'Others');
  const withoutOthers = mapped
    .filter((item) => item.name !== 'Others')
    .sort((a, b) => b.desktop - a.desktop);

  const topWithoutOthers = withoutOthers.slice(0, Math.max(topN - 1, 0));
  const result = [...topWithoutOthers];

  // topN에 들지 못한 개발자들의 커밋 수 합산
  const remainingDevelopers = withoutOthers.slice(Math.max(topN - 1, 0));
  const remainingCommits = remainingDevelopers.reduce((sum, dev) => sum + dev.desktop, 0);
  
  // Others 커밋 수 + 순위에 들지 못한 개발자들의 커밋 수
  const othersCommits = (othersEntry?.desktop ?? 0) + remainingCommits;
  
  if (othersCommits > 0) {
    result.push({ name: 'Others', desktop: othersCommits, mobile: 0 });
  }

  return result.slice(0, topN);
}

/**
 * Create weekly statistics card data.
 * @param stats - The statistics values.
 * @param icons - The icons for each statistic.
 * @param translations - The translations for labels and subLabels.
 * @returns The card data array.
 */
export function createWeeklyStatsCardData(
  stats: {
    commitCount: number | undefined;
    totalMessageCount: number;
    highlightsCount: number;
    emailSentCount: number;
    emailSentMemberCount: number;
  },
  icons: {
    gitCommit: React.ComponentType<{ className?: string }>;
    messageSquareDot: React.ComponentType<{ className?: string }>;
    sparkles: React.ComponentType<{ className?: string }>;
    mailCheck: React.ComponentType<{ className?: string }>;
  },
  translations: {
    githubCommit: { label: string; subLabel: string };
    slackMessage: { label: string; subLabel: string };
    slackHighlight: { label: string; subLabel: string };
    newsletterSent: { label: string; subLabel: string };
  },
) {
  return [
    {
      label: translations.githubCommit.label,
      value: stats.commitCount ?? 0,
      subLabel: translations.githubCommit.subLabel,
      icon: icons.gitCommit,
      iconBg: STATS_CARD_STYLE.githubCommit.iconBg,
      iconColor: STATS_CARD_STYLE.githubCommit.iconColor,
    },
    {
      label: translations.slackMessage.label,
      value: stats.totalMessageCount,
      subLabel: translations.slackMessage.subLabel,
      icon: icons.messageSquareDot,
      iconBg: STATS_CARD_STYLE.slackMessage.iconBg,
      iconColor: STATS_CARD_STYLE.slackMessage.iconColor,
    },
    {
      label: translations.slackHighlight.label,
      value: stats.highlightsCount,
      subLabel: translations.slackHighlight.subLabel,
      icon: icons.sparkles,
      iconBg: STATS_CARD_STYLE.slackHighlight.iconBg,
      iconColor: STATS_CARD_STYLE.slackHighlight.iconColor,
    },
    {
      label: translations.newsletterSent.label,
      value: stats.emailSentCount,
      subLabel: translations.newsletterSent.subLabel + ': ' + stats.emailSentMemberCount,
      icon: icons.mailCheck,
      iconBg: STATS_CARD_STYLE.newsletterSent.iconBg,
      iconColor: STATS_CARD_STYLE.newsletterSent.iconColor,
    },
  ];
}

/**
 * 발송 멤버 수의 평균값과 성장률을 계산합니다.
 * @param perPeriod - 기간별 발송 데이터 배열
 * @returns 평균 발송 멤버 수, 성장률, 성장 여부
 */
export function calculateMemberStats(perPeriod: Array<{ periodKey: string; count: number; memberCount: number; range: string }>) {
  // perPeriod는 이미 최신→과거 순으로 정렬되어 있음
  // 평균 발송 멤버 수 계산
  const averageMemberCount = perPeriod.length > 0
    ? Math.round(perPeriod.reduce((sum, period) => sum + period.memberCount, 0) / perPeriod.length)
    : 0;
  
  // 최신 주와 이전 주 데이터 가져오기 (perPeriod[0]이 최신, perPeriod[1]이 이전 주)
  const latestPeriod = perPeriod[0];
  const previousPeriod = perPeriod[1];
  
  let growthRate = 0;
  let isGrowth = true;
  let isNoChange = false;
  
  // 성장률 계산
  if (latestPeriod && previousPeriod && previousPeriod.memberCount > 0) {
    growthRate = ((latestPeriod.memberCount - previousPeriod.memberCount) / previousPeriod.memberCount) * 100;
    // 값이 같은 경우 (0% 변화)
    if (Math.abs(growthRate) < 0.01) {
      isNoChange = true;
      growthRate = 0;
    } else {
      isGrowth = growthRate >= 0;
    }
  } else if (latestPeriod && previousPeriod && previousPeriod.memberCount === 0 && latestPeriod.memberCount > 0) {
    // 이전 주가 0이고 이번 주가 0보다 큰 경우 100% 성장으로 표시
    growthRate = 100;
    isGrowth = true;
  } else if (latestPeriod && previousPeriod && previousPeriod.memberCount === 0 && latestPeriod.memberCount === 0) {
    // 둘 다 0인 경우 변화 없음
    isNoChange = true;
    growthRate = 0;
  } else if (latestPeriod && previousPeriod && latestPeriod.memberCount === previousPeriod.memberCount) {
    // 값이 정확히 같은 경우
    isNoChange = true;
    growthRate = 0;
  }
  
  return {
    averageMemberCount,
    growthRate,
    isGrowth,
    isNoChange,
  };
}