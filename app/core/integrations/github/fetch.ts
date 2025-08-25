// apps/integrations/github/githubFetch.ts
import { runGithubFetch } from "./run";

// 간단한 CLI 오버라이드 처리 (--repos, --days, --out, --token)
const argv = process.argv.slice(2);
const args: Record<string, string> = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith("--")) {
    const key = a.replace(/^--/, "");
    const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : "";
    if (val) i++;
    args[key] = val;
  }
}

runGithubFetch({
  repos: args.repos,
  outDir: args.out,
  token: args.token,
  days: args.days ? Number(args.days) : undefined,
}).catch(() => {
  process.exit(1);
});
