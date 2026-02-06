import { LogLevel, WebClient } from "@slack/web-api";

//  ,"files:read"
export const SCOPES = [
  "channels:read","channels:history","groups:read","groups:history",
  "users:read","team:read","reactions:read",
  "channels:join","users:read.email","chat:write"
].join(",");

/**
 * Slack 권고: identity.* 레거시 스코프 대신 OpenID 스코프 사용
 * @see https://api.slack.com/authentication/sign-in-with-slack#migrate
 * - identity.basic → openid (연결 화면 복귀용으로 최소만 사용)
 */
export const USER_SCOPES = ["openid"].join(",");

// 서버 사이드에서만 사용되는 환경변수들
export const SLACK_CLIENT_ID = typeof process !== 'undefined' ? process.env.SLACK_CLIENT_ID! : '';
export const SLACK_CLIENT_SECRET = typeof process !== 'undefined' ? process.env.SLACK_CLIENT_SECRET! : '';
export const SLACK_REDIRECT_URI = typeof process !== 'undefined' 
  ? (process.env.SLACK_REDIRECT_URI || `${process.env.APP_URL || 'http://localhost:5173'}/api/settings/slack-callback`)
  : '';


export function createSlackClient(token: string): WebClient {
  return new WebClient(token, { logLevel: LogLevel.ERROR });
}


