import "dotenv/config";
import dayjs from "dayjs";
import { getGithubConfig } from "./config";
import { createOctokit } from "./client";
import { fetchCommits, fetchMergedPullRequests, fetchOpenedIssues, fetchClosedIssues } from "./fetchers";
import type { FetchedRepoData, Repo } from "./types";
import { FileWriter } from "../../lib/writer";
import { logger } from "../../lib/logger";
import pLimit from "p-limit";

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
    const [commits, mergedPRs, openedIssues, closedIssues] = await Promise.all([
      fetchCommits(octokit, repo, since, until),
      fetchMergedPullRequests(octokit, repo, since, until),
      fetchOpenedIssues(octokit, repo, since, until),
      fetchClosedIssues(octokit, repo, since, until),
    ]);
    return { repo, commits, mergedPRs, openedIssues, closedIssues };
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

  const writer = new FileWriter<Record<string, FetchedRepoData>>(cfg.outDir, "github_raw.json");
  await writer.save(result);
  logger.info("saved github_raw.json", { path: `${cfg.outDir}/github_raw.json` });
}


