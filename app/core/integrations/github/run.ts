import dayjs from "dayjs";
import "dotenv/config";
import pLimit from "p-limit";
import { logger } from "../../lib/logger";
import { createOctokit } from "./client";
import { getGithubConfig } from "./config";
import { fetchClosedIssues, fetchClosedPullRequests, fetchCommits, fetchOpenedIssues } from "./fetchers";
import type { FetchedRepoData, Repo } from "./types";

export async function runGithubFetch(overrides?: {
  token?: string;
  days?: number;
  repos?: string;
  outDir?: string;
}) {
  const cfg = getGithubConfig(process.env, overrides);
  const octokit = createOctokit(cfg.token);

  const now = dayjs();
  const oldestTs = now.subtract(cfg.days, "day").unix().toString();

  const reposToFetch = cfg.targetRepos.length > 0 ? cfg.targetRepos : [
    { owner: "facebook", name: "react" }
  ];

  async function fetchRepoData(repo: Repo): Promise<FetchedRepoData> {
    const since = dayjs.unix(Number(oldestTs)).toISOString();
    const until = now.toISOString();
    const [commits, closedPRs, openedIssues, closedIssues] = await Promise.all([
      fetchCommits(octokit, repo, since, until),
      fetchClosedPullRequests(octokit, repo, since, until),
      fetchOpenedIssues(octokit, repo, since, until),
      fetchClosedIssues(octokit, repo, since, until)
    ]);
    return { repo, commits, closedPRs, openedIssues, closedIssues };
  }

  const result: Record<string, FetchedRepoData> = {};
  const limit = pLimit(3);
  await Promise.all(
    reposToFetch.map((repo) =>
      limit(async () => {
        logger.info("fetch repo", { repo: `${repo.owner}/${repo.name}` });
        const key = `${repo.owner}/${repo.name}`;
        result[key] = await fetchRepoData(repo);
      })
    )
  );

  /*
  const writer = new FileWriter<Record<string, FetchedRepoData>>(cfg.outDir, "github_raw.json");
  await writer.save(result);
  logger.info("saved github_raw.json", { path: `${cfg.outDir}/github_raw.json` });
  */
  return result;
}


