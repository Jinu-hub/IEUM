/**
 * Cron Actions API 타입 정의
 */

import type { Database } from "database.types";
import type { EnableCreateContents } from "~/core/lib/types";

/**
 * 타겟 정보 타입 (데이터베이스 타입 기반)
 */
export type Target = {
  target_id: string;
  schedule_cron: string | null;
  is_active: boolean;
  display_name: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
  timezone?: string;
  mailing_list_id?: string | null;
  [key: string]: any;
};

/**
 * Cron 액션 응답 타입
 */
export type CronActionResponse = {
  status: 'success' | 'error';
  data?: {
    targets: Target[];
    totalTargets: number;
    scheduledTargets: number;
    enqueuedJobs?: number;
  };
  error?: string;
};

/**
 * Run 매핑 타입
 */
export type RunMapping = Record<string, { runId: string; runStepId: string }>;

/**
 * 매칭된 소스 정보
 */
export type MatchedSources = {
  matchedRepos: string[];
  matchedChannels: string[];
  sourcesWithType: Array<any>;
};

/**
 * 통합 데이터 정보
 */
export type IntegrationData = {
  githubData: any;
  slackData: any;
  githubCredentialRef: string | undefined;
  slackCredentialRef: string | undefined;
};

/**
 * 페칭된 데이터 결과
 */
export type FetchedData = {
  githubResult: any;
  slackResult: any;
  enableCreateContents: EnableCreateContents;
};

/**
 * 이메일 제한 확인 결과
 */
export type EmailLimitCheck = {
  allowed: boolean;
  usageCounter: any;
  planLimit: any;
  planType: Database["public"]["Enums"]["plan_type"] | null;
  maxMembers: number;
};

