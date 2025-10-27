import type { Octokit } from "@octokit/rest";
import pLimit from "p-limit";
import { logger } from "../../lib/logger";
import type { CommitInfo, IssueInfo, PRInfo, Repo, UserInfo } from "./types";

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

export async function fetchClosedPullRequests(
  octokit: Octokit,
  repo: Repo,
  sinceISO: string,
  untilISO: string
): Promise<PRInfo[]> {
  const sinceDate = new Date(sinceISO);
  const untilDate = new Date(untilISO);
  
  // クローズされたPRを取得してclosed_atでフィルタリング
  const filteredPRs: any[] = [];
  const maxPages = 3; // 最大300件まで確認

  for (let page = 1; page <= maxPages; page++) {
    const { data: prs } = await octokit.rest.pulls.list({
      owner: repo.owner,
      repo: repo.name,
      state: 'closed',
      sort: 'updated',  // GitHub APIで利用可能な最も近いソート
      direction: 'desc',
      per_page: 100,
      page,
    });

    if (prs.length === 0) break;

    for (const pr of prs) {
      // closed_atが存在しない場合はスキップ
      if (!pr.closed_at) continue;

      const closedDate = new Date(pr.closed_at);

      // 期間内にクローズされたPRのみ追加
      if (closedDate >= sinceDate && closedDate <= untilDate) {
        filteredPRs.push(pr);
      }
    }
  }

  logger.info('closed pull requests', { 
    total: filteredPRs.length,
    period: `${sinceISO} ~ ${untilISO}`
  });

  const prInfos = await Promise.all(
    filteredPRs.map(async (pr: any): Promise<PRInfo> => {
      const userLogin = pr.user?.login || "unknown";
      const userInfo = userLogin !== "unknown" ? await fetchUserInfo(octokit, userLogin) : null;
      return {
        number: pr.number!,
        title: pr.title!,
        user: userLogin,
        html_url: pr.html_url!,
        merged_at: pr.merged_at || "",
        closed_at: pr.closed_at || null,
        userInfo: userInfo || undefined,
      };
    })
  );

  return prInfos;
}

export async function fetchOpenedIssues(
  octokit: Octokit,
  repo: Repo,
  sinceISO: string,
  untilISO: string
): Promise<IssueInfo[]> {
  const sinceDate = new Date(sinceISO);
  const untilDate = new Date(untilISO);
  
  // すべてのIssueを取得（PRを除く）
  const allIssues = await octokit.paginate(octokit.rest.issues.listForRepo, {
    owner: repo.owner,
    repo: repo.name,
    state: 'all',
    sort: 'created',
    direction: 'desc',
    per_page: 100,
  });

  // PRではなく、指定期間内に作成されたIssueのみフィルタリング
  const opened = allIssues.filter((issue: any) => {
    if (issue.pull_request) return false; // PRを除外
    const createdDate = new Date(issue.created_at);
    return createdDate >= sinceDate && createdDate <= untilDate;
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
  const sinceDate = new Date(sinceISO);
  const untilDate = new Date(untilISO);
  
  // クローズされたIssueを取得（PRを除く）
  const allIssues = await octokit.paginate(octokit.rest.issues.listForRepo, {
    owner: repo.owner,
    repo: repo.name,
    state: 'closed',
    sort: 'updated',
    direction: 'desc',
    per_page: 100,
  });

  // PRではなく、指定期間内にクローズされたIssueのみフィルタリング
  const closed = allIssues.filter((issue: any) => {
    if (issue.pull_request) return false; // PRを除外
    if (!issue.closed_at) return false;
    const closedDate = new Date(issue.closed_at);
    return closedDate >= sinceDate && closedDate <= untilDate;
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


