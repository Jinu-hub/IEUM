import type { Octokit } from "@octokit/rest";
import type { Repo, UserInfo, CommitInfo, PRInfo, IssueInfo } from "./types";
import { logger } from "../../lib/logger";
import pLimit from "p-limit";

const userCache = new Map<string, UserInfo>();
const userPendingCache = new Map<string, Promise<UserInfo | null>>();
const userFetchLimit = pLimit(5);

// throttling/retry 플러그인을 사용하므로 별도 sleep은 불필요

async function fetchUserInfo(octokit: Octokit, username: string): Promise<UserInfo | null> {
  if (userCache.has(username)) {
    return userCache.get(username)!;
  }

  // 중복 요청 합치기
  if (userPendingCache.has(username)) {
    return userPendingCache.get(username)!;
  }

  const pending = userFetchLimit(async () => {
    try {
      const res = await octokit.users.getByUsername({ username });
      if (res.data) {
        const userInfo: UserInfo = {
          login: res.data.login,
          name: res.data.name || undefined,
          email: res.data.email || undefined,
          avatar_url: res.data.avatar_url || undefined,
        };
        userCache.set(username, userInfo);
        return userInfo;
      }
    } catch (error) {
      logger.warn(`Failed to fetch user info for ${username}`, { error: String(error) });
    } finally {
      userPendingCache.delete(username);
    }
    return null;
  });

  userPendingCache.set(username, pending);
  return pending;
}

function getDateParts(sinceISO: string, untilISO: string) {
  const sDate = sinceISO.split("T")[0];
  const uDate = untilISO.split("T")[0];
  return { sDate, uDate };
}

export async function fetchCommits(
  octokit: Octokit,
  repo: Repo,
  sinceISO: string,
  untilISO: string
): Promise<CommitInfo[]> {
  const commitsApi = await octokit.paginate(octokit.repos.listCommits, {
    owner: repo.owner,
    repo: repo.name,
    since: sinceISO,
    until: untilISO,
    per_page: 100,
  });

  const commitInfos = await Promise.all(
    commitsApi.map(async (c: any): Promise<CommitInfo> => {
      const authorLogin = c.author?.login || c.commit?.author?.name || "unknown";
      const userInfo = authorLogin !== "unknown" ? await fetchUserInfo(octokit, authorLogin) : null;
      return {
        sha: c.sha!,
        message: (c.commit?.message || "").split("\n")[0],
        author: authorLogin,
        html_url: c.html_url!,
        date: c.commit?.author?.date || "",
        userInfo: userInfo || undefined,
      };
    })
  );

  return commitInfos;
}

export async function fetchMergedPullRequests(
  octokit: Octokit,
  repo: Repo,
  sinceISO: string,
  untilISO: string
): Promise<PRInfo[]> {
  const { sDate, uDate } = getDateParts(sinceISO, untilISO);
  const merged = await octokit.paginate(octokit.search.issuesAndPullRequests, {
    q: `repo:${repo.owner}/${repo.name} is:pr is:merged merged:${sDate}..${uDate}`,
    per_page: 100,
  });

  const mergedPRs = await Promise.all(
    merged.map(async (pr: any): Promise<PRInfo> => {
      const userLogin = pr.user?.login || "unknown";
      const userInfo = userLogin !== "unknown" ? await fetchUserInfo(octokit, userLogin) : null;
      return {
        number: pr.number!,
        title: pr.title!,
        user: userLogin,
        html_url: pr.html_url!,
        merged_at: pr.closed_at || "",
        userInfo: userInfo || undefined,
      };
    })
  );

  return mergedPRs;
}

export async function fetchOpenedIssues(
  octokit: Octokit,
  repo: Repo,
  sinceISO: string,
  untilISO: string
): Promise<IssueInfo[]> {
  const { sDate, uDate } = getDateParts(sinceISO, untilISO);
  const opened = await octokit.paginate(octokit.search.issuesAndPullRequests, {
    q: `repo:${repo.owner}/${repo.name} is:issue created:${sDate}..${uDate}`,
    per_page: 100,
  });

  const openedIssues = await Promise.all(
    opened.map(async (issue: any): Promise<IssueInfo> => {
      const userLogin = issue.user?.login || "unknown";
      const userInfo = userLogin !== "unknown" ? await fetchUserInfo(octokit, userLogin) : null;
      return {
        number: issue.number!,
        title: issue.title!,
        user: userLogin,
        html_url: issue.html_url!,
        state: "open",
        created_at: issue.created_at || "",
        closed_at: issue.closed_at || null,
        userInfo: userInfo || undefined,
      };
    })
  );

  return openedIssues;
}

export async function fetchClosedIssues(
  octokit: Octokit,
  repo: Repo,
  sinceISO: string,
  untilISO: string
): Promise<IssueInfo[]> {
  const { sDate, uDate } = getDateParts(sinceISO, untilISO);
  const closed = await octokit.paginate(octokit.search.issuesAndPullRequests, {
    q: `repo:${repo.owner}/${repo.name} is:issue is:closed closed:${sDate}..${uDate}`,
    per_page: 100,
  });

  const closedIssues = await Promise.all(
    closed.map(async (issue: any): Promise<IssueInfo> => {
      const userLogin = issue.user?.login || "unknown";
      const userInfo = userLogin !== "unknown" ? await fetchUserInfo(octokit, userLogin) : null;
      return {
        number: issue.number!,
        title: issue.title!,
        user: userLogin,
        html_url: issue.html_url!,
        state: "closed",
        created_at: issue.created_at || "",
        closed_at: issue.closed_at || null,
        userInfo: userInfo || undefined,
      };
    })
  );

  return closedIssues;
}


