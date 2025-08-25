import { Octokit } from "@octokit/rest";
import { retry } from "@octokit/plugin-retry";
import { throttling } from "@octokit/plugin-throttling";
import { logger } from "../../lib/logger";

const OctokitWithPlugins = Octokit.plugin(retry, throttling);

export function createOctokit(token: string): Octokit {
  return new OctokitWithPlugins({
    auth: token,
    request: { retries: 3 },
    throttle: {
      onRateLimit: (retryAfter: number, options: any, octokit: any, retryCount: number) => {
        logger.warn("GitHub rate limit encountered", {
          retryAfter,
          method: options?.method,
          url: options?.url,
          retryCount,
        });
        return true; // 자동 재시도
      },
      onSecondaryRateLimit: (retryAfter: number, options: any, octokit: any) => {
        logger.error("GitHub secondary rate limit encountered", {
          retryAfter,
          method: options?.method,
          url: options?.url,
        });
        return true; // 자동 재시도
      },
    },
  });
}


