import type { Repo } from "./types";

export type GithubConfig = {
  token: string;
  days: number;
  targetRepos: Repo[];
  outDir: string;
};

export function parseRepos(envValue: string | undefined): Repo[] {
  const list = (envValue || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return list
    .map((repo) => {
      const [owner, name] = repo.split("/");
      return { owner, name } as Repo;
    })
    .filter((r) => Boolean(r.owner) && Boolean(r.name));
}

type ConfigOverrides = Partial<{
  token: string;
  days: number;
  outDir: string;
  repos: string; // comma separated owner/name
  targetRepos: Repo[];
}>;

export function getGithubConfig(
  env: NodeJS.ProcessEnv = process.env,
  overrides: ConfigOverrides = {}
): GithubConfig {
  const token = overrides.token ?? env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("Missing GITHUB_TOKEN");
  }

  const daysRaw = overrides.days ?? env.FETCH_DAYS ?? "7";
  const days = Number(daysRaw);
  if (!Number.isFinite(days) || days < 0) {
    throw new Error(`Invalid FETCH_DAYS: ${daysRaw}`);
  }

  const targetRepos = overrides.targetRepos
    ? overrides.targetRepos
    : parseRepos(overrides.repos ?? env.GITHUB_REPOS);
  const outDir = overrides.outDir ?? (env.OUT_DIR || "output");

  return { token, days, targetRepos, outDir };
}


