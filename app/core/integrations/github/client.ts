import { retry } from "@octokit/plugin-retry";
import { throttling } from "@octokit/plugin-throttling";
import { Octokit } from "@octokit/rest";
import { logger } from "../../lib/logger";

import { App } from "octokit";

const APP_ID = Number(process.env.GITHUB_APP_ID);
const APP_SLUG = process.env.GITHUB_APP_SLUG!;

export const GITHUB_APP_SLUG = APP_SLUG;

let _app: App | null = null;
export function getGitHubApp() {
  if (_app) return _app;
  
  const raw = process.env.GITHUB_APP_PRIVATE_KEY;

  if (!raw) {
    throw new Error("GITHUB_APP_PRIVATE_KEY is not set");
  }
  
  const privateKey = raw
    .replace(/\\n/g, "\n")
    .trim();

  _app = new App({ appId: APP_ID, privateKey: privateKey });
  return _app;
}

/** 설치(installation)별로 인증된 Octokit 인스턴스 반환 */
export async function getInstallationOctokit(installationId: number) {
  const app = getGitHubApp();
  return await app.getInstallationOctokit(installationId);
}

/** (원한다면) 순수 토큰 값만 받고 싶을 때 
export async function getInstallationAccessToken(installationId: number) {
  const app = getGitHubApp();
  return await app.getInstallationAccessToken({ installationId });
}
*/


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


