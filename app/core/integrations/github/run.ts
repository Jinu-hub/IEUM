import dayjs from "dayjs";
import "dotenv/config";
import pLimit from "p-limit";
import { logger } from "../../lib/logger";
import { createOctokit, getInstallationOctokit } from "./client";
import { getGithubConfig } from "./config";
import { fetchClosedIssues, fetchClosedPullRequests, fetchCommits, fetchOpenedIssues } from "./fetchers";
import type { FetchedRepoData, Repo } from "./types";

export async function runGithubFetch(overrides?: {
  token?: string;
  installationId?: string;
  days?: number;
  repos?: string;
  outDir?: string;
}) {
  const cfg = getGithubConfig(process.env, overrides);
  let octokit: any = null;
  let useRestApi = false;
  if (overrides?.token && overrides.token !== '' && cfg.token) {
    console.log('createOctokit with token', cfg.token);
    octokit = createOctokit(cfg.token);
    useRestApi = false; // tokenの場合は元のAPIを使用
  } else if (cfg.installationId) {
    console.log('createOctokit with installationId', cfg.installationId);
    octokit = await getInstallationOctokit(Number(cfg.installationId));
    useRestApi = true; // installationIdの場合はrest APIを使用
  } else {
    throw new Error("Missing token or installationId");
  }

  const now = dayjs();
  const oldestTs = now.subtract(cfg.days, "day").unix().toString();

  const reposToFetch = cfg.targetRepos.length > 0 ? cfg.targetRepos : [
    { owner: "facebook", name: "react" }
  ];

  async function fetchRepoData(repo: Repo): Promise<FetchedRepoData> {
    const since = dayjs.unix(Number(oldestTs)).toISOString();
    const until = now.toISOString();
    try {
      const [commits, closedPRs, openedIssues, closedIssues] = await Promise.all([
        fetchCommits(octokit, repo, since, until, useRestApi).catch((error) => {
          logger.error(`Failed to fetch commits for ${repo.owner}/${repo.name}`, { 
            error: error.message || String(error),
            status: error.status,
            response: error.response?.data 
          });
          return [];
        }),
        fetchClosedPullRequests(octokit, repo, since, until, useRestApi).catch((error) => {
          logger.error(`Failed to fetch closed PRs for ${repo.owner}/${repo.name}`, { 
            error: error.message || String(error),
            status: error.status,
            response: error.response?.data 
          });
          return [];
        }),
        fetchOpenedIssues(octokit, repo, since, until, useRestApi).catch((error) => {
          logger.error(`Failed to fetch opened issues for ${repo.owner}/${repo.name}`, { 
            error: error.message || String(error),
            status: error.status,
            response: error.response?.data 
          });
          return [];
        }),
        fetchClosedIssues(octokit, repo, since, until, useRestApi).catch((error) => {
          logger.error(`Failed to fetch closed issues for ${repo.owner}/${repo.name}`, { 
            error: error.message || String(error),
            status: error.status,
            response: error.response?.data 
          });
          return [];
        })
      ]);
      return { repo, commits, closedPRs, openedIssues, closedIssues };
    } catch (error: any) {
      logger.error(`Failed to fetch repo data for ${repo.owner}/${repo.name}`, {
        error: error.message || String(error),
        status: error.status,
        response: error.response?.data
      });
      throw error;
    }
  }

  const result: Record<string, FetchedRepoData> = {};
  const limit = pLimit(3);
  await Promise.all(
    reposToFetch.map((repo) =>
      limit(async () => {
        logger.info("fetch repo", { repo: `${repo.owner}/${repo.name}` });
        const key = `${repo.owner}/${repo.name}`;
        try {
          result[key] = await fetchRepoData(repo);
        } catch (error: any) {
          logger.error(`Failed to fetch repository ${key}`, {
            error: error.message || String(error),
            status: error.status,
            response: error.response?.data
          });
          // エラーが発生しても処理を続行（空のデータで続行）
          result[key] = {
            repo,
            commits: [],
            closedPRs: [],
            openedIssues: [],
            closedIssues: []
          };
        }
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


