import { parseRepos, getGithubConfig } from "../config";

export function registerConfigTests({ test, assert }: { test: (n: string, f: () => any) => void; assert: (c: unknown, m: string) => void; }) {
  test("parseRepos: empty returns []", () => {
    const r = parseRepos(undefined);
    assert(Array.isArray(r) && r.length === 0, "should be empty array");
  });

  test("parseRepos: valid comma list", () => {
    const r = parseRepos("foo/bar, alice/wonder");
    assert(r.length === 2, "two repos");
    assert(r[0].owner === "foo" && r[0].name === "bar", "first repo parsed");
    assert(r[1].owner === "alice" && r[1].name === "wonder", "second repo parsed");
  });

  test("getGithubConfig: prefers overrides", () => {
    const cfg = getGithubConfig({}, { token: "t", days: 3, repos: "a/b", outDir: "out" });
    assert(cfg.token === "t", "token");
    assert(cfg.days === 3, "days");
    assert(cfg.outDir === "out", "outDir");
    assert(cfg.targetRepos.length === 1 && cfg.targetRepos[0].owner === "a", "repos parsed");
  });

  test("getGithubConfig: env fallback", () => {
    const cfg = getGithubConfig({ GITHUB_TOKEN: "t", FETCH_DAYS: "2", GITHUB_REPOS: "x/y", OUT_DIR: "o" } as any);
    assert(cfg.token === "t", "token");
    assert(cfg.days === 2, "days");
    assert(cfg.outDir === "o", "outDir");
    assert(cfg.targetRepos.length === 1 && cfg.targetRepos[0].name === "y", "repos parsed");
  });
}


