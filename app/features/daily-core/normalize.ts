import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import type { FetchedRepoData } from "~/core/integrations/github/types";
import type { FetchedMessage } from "~/core/integrations/slack/types";
import type { NormalizedSourceItem } from "./contracts";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const DAY_MS = 86_400_000;

/** Local date in `timezone` → UTC `[start, end)`. */
export function resolveDailyWindow(coreDate: string, timezone: string) {
  const nextDate = new Date(Date.parse(`${coreDate}T00:00:00Z`) + DAY_MS).toISOString().slice(0, 10);
  return {
    windowStartAt: dayjs.tz(coreDate, timezone).toISOString(),
    windowEndAt: dayjs.tz(nextDate, timezone).toISOString(),
  };
}

/** Existing fetchers look back N days from now; this N reaches the window start. */
export function fetchDaysFor(coreDate: string, timezone: string, now = Date.now()) {
  const { windowStartAt } = resolveDailyWindow(coreDate, timezone);
  return Math.max(1, Math.ceil((now - Date.parse(windowStartAt)) / DAY_MS));
}

export type Unreffed = Omit<NormalizedSourceItem, "source_ref">;

export function normalizeSlackMessages(sourceIdent: string, channelId: string, messages: FetchedMessage[]): Unreffed[] {
  return messages.map((m) => ({
    source_type: "slack_channel",
    source_ident: sourceIdent,
    source_item_id: m.ts,
    occurred_at: new Date(Number(m.ts) * 1000).toISOString(),
    author: {
      id: m.user,
      name: m.userInfo?.profile?.display_name || m.userInfo?.real_name || m.author,
    },
    content: m.text ?? "",
    url: m.permalink ?? null,
    thread_ref: m.thread_ts && m.thread_ts !== m.ts ? m.thread_ts : null,
    meta: { channel_id: channelId, ...(m.reply_count ? { reply_count: m.reply_count } : {}) },
  }));
}

export function normalizeGithubRepo(sourceIdent: string, repo: FetchedRepoData): Unreffed[] {
  const base = { source_type: "github_repo" as const, source_ident: sourceIdent };
  const person = (login: string, name?: string) => ({ id: login, name: name || login });

  return [
    ...repo.commits.map((c) => ({
      ...base,
      source_item_id: c.sha,
      occurred_at: c.date,
      author: person(c.author, c.userInfo?.name),
      title: c.message.split("\n")[0],
      content: c.message,
      url: c.html_url,
      meta: { kind: "commit" },
    })),
    ...repo.closedPRs.map((pr) => ({
      ...base,
      source_item_id: `pr#${pr.number}`,
      occurred_at: pr.merged_at || pr.closed_at || "",
      author: person(pr.user, pr.userInfo?.name),
      title: pr.title,
      content: `PR #${pr.number} ${pr.merged_at ? "merged" : "closed"}: ${pr.title}`,
      url: pr.html_url,
      meta: { kind: "pull_request", merged: Boolean(pr.merged_at), closes: pr.closes ?? [] },
    })),
    ...repo.openedIssues.map((issue) => ({
      ...base,
      source_item_id: `issue#${issue.number}:opened`,
      occurred_at: issue.created_at,
      author: person(issue.user, issue.userInfo?.name),
      title: issue.title,
      content: `Issue #${issue.number} opened: ${issue.title}`,
      url: issue.html_url,
      meta: { kind: "issue_opened" },
    })),
    ...repo.closedIssues.map((issue) => ({
      ...base,
      source_item_id: `issue#${issue.number}:closed`,
      occurred_at: issue.closed_at || "",
      author: person(issue.user, issue.userInfo?.name),
      title: issue.title,
      content: `Issue #${issue.number} closed: ${issue.title}`,
      url: issue.html_url,
      meta: { kind: "issue_closed" },
    })),
  ];
}

/** Thread roots that replies point to but `items` does not contain. */
export function missingThreadParents(items: Unreffed[]) {
  const have = new Set(items.map((item) => item.source_item_id));
  return [...new Set(items.flatMap((item) => (item.thread_ref && !have.has(item.thread_ref) ? [item.thread_ref] : [])))];
}

export function keepInWindow(items: Unreffed[], windowStartAt: string, windowEndAt: string) {
  const start = Date.parse(windowStartAt);
  const end = Date.parse(windowEndAt);
  return items
    .filter((item) => {
      const at = Date.parse(item.occurred_at);
      return at >= start && at < end;
    })
    .sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));
}
