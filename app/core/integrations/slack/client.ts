import { LogLevel, WebClient } from "@slack/web-api";

export const SCOPES = [
  "channels:read","channels:history","groups:read","groups:history",
  "users:read","users:read.email","team:read","reactions:read","files:read",
  "channels:join"
].join(",");

export const USER_SCOPES = [
  "identity.basic","identity.email","identity.team"
].join(",");

// 서버 사이드에서만 사용되는 환경변수들
export const SLACK_CLIENT_ID = typeof process !== 'undefined' ? process.env.SLACK_CLIENT_ID! : '';
export const SLACK_CLIENT_SECRET = typeof process !== 'undefined' ? process.env.SLACK_CLIENT_SECRET! : '';
export const SLACK_REDIRECT_URI = typeof process !== 'undefined' 
  ? (process.env.SLACK_REDIRECT_URI || `${process.env.APP_URL || 'http://localhost:5173'}/api/settings/slack-callback`)
  : '';


export function createSlackClient(token: string): WebClient {
  return new WebClient(token, { logLevel: LogLevel.ERROR });
}


