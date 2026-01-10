// constants.ts — NexLetter v0.1
// 앱 전체에서 사용되는 상수들

/* =========================================================
   Database Enums
   ========================================================= */
export const LANGUAGE = [
  "en", "ja", "ko",
] as const;

export const WORKSPACE_KIND = [
  "org", "team", "personal", "community", "company",
  "school", "government", "club", "nexletter", "app_review", "other",
] as const;

export const USER_TYPE = [
  "normal", "nexletter", "app_review",
] as const;

export const RUN_STATUS = [
  "queued", "running", "success", "failed", "canceled",
] as const;

export const STEP_NAME = [
  "queued", "collect_data", "summarize_data", "assemble_data", "finalize_data", "send_email"
] as const;

export const STEP_STATUS = [
  "queued", "running", "success", "failed", "canceled",
] as const;

export const MAIL_STATUS = [
  "sending", "delivered", "partial", "failed",
] as const;

export const INTEGRATION_TYPE = [
  "slack", "github", "discord", "lineworks", "slack_user",
] as const;

export const RULE_TYPE = [
  "agents", "tasks",
] as const;

export const DELIVERY_EVENT_TYPE_EMAIL = [
  "delivered", "opened", "clicked", "bounced", "complained", "dropped",
] as const;

export const AUDIT_ACTION = [
  "insert", "update", "delete",
] as const;

export const CONNECTION_STATUS = [
  "connected", "expired", "revoked", "unauthorized", "error", "never", "disconnected",
] as const;

export const PERIOD = [
  "daily", "weekly", "monthly", "yearly",
] as const;

export const CATEGORY_TYPE = [
  'development',     // 개발
  'infrastructure',  // 인프라/DevOps
  'qa',              // QA/테스트
  'data_ai',         // 데이터/AI
  'product',         // 기획/PM
  'design',          // UX/UI
  'operations',      // 운영
  'communication',   // 커뮤니케이션/공지
  'community',       // 친목/문화
  'learning',        // 학습/교육
  'business',        // 영업/마케팅
  'finance',         // 재무
  'hr',              // 인사
  'okr',             // 전략/성과
  'personal',        // 개인 요약
  'fun',             // Fun Corner
] as const;

export const ONBOARDING_TYPE = [
  "default",
  "slack_review",
] as const;

export const ONBOARDING_STEP = [
  "welcome",
  "setup_integrations",
  "setup_mailing_list",
  "setup_targets",
  'first_mail_sending',
  'completed'
] as const;


export const SETUP_INTEGRATIONS = [
  "start",
  "connect_github",
  "connect_slack",
  "setup_slack_channel",
  "end",
] as const;

export const SETUP_MAILING_LIST = [
  "start",
  "regist_basic",
  "regist_address",
  "end",
] as const;

export const SETUP_TARGETS = [
  "start",
  "regist_basic",
  "regist_schedule",
  "regist_sourses",
  "end",
] as const;

export const REVIEW_STEP = [
  'review_start',
  'review_connect',
  'review_setup_channel',
  'review_collecting_data',
  'review_completed'
] as const;

export const FIRST_MAIL_SEND = [
  'waiting_choice',
  'yes',
  'no',
] as const;

/* =========================================================
   Type Definitions
   ========================================================= */

export type RunStatus = typeof RUN_STATUS[number];
export type StepName = typeof STEP_NAME[number];
export type StepStatus = typeof STEP_STATUS[number];
export type IntegrationType = typeof INTEGRATION_TYPE[number];
export type RuleType = typeof RULE_TYPE[number];
export type DeliveryEventTypeEmail = typeof DELIVERY_EVENT_TYPE_EMAIL[number];
export type AuditAction = typeof AUDIT_ACTION[number];
export type ConnectionStatus = typeof CONNECTION_STATUS[number];
export type CategoryType = typeof CATEGORY_TYPE[number];


/* =========================================================
   Topic Ranker Constants
========================================================= */
export const IMPACT_MAP = { critical: 1.0, high: 0.9, medium: 0.6, low: 0.3 } as const;
export type ImpactKey = keyof typeof IMPACT_MAP;
export const CFG_RANKER = {
  weights: {
    // Base = 토픽 기반 점수
    impact: 0.5,
    engagement: 0.25,  // signals.count & participants
    recency: 0.15,     // signals.recencyScore (0~1)
    confidence: 0.10,  // signals.crossLinkScore (0~1)
  },
  bonuses: {
    audienceFit: 0.02,     // 뉴스레터 대상과 일치하면 +0.02
    incidentCritical: 0.08,// Incident + critical 이면 +0.08
    orgWideRelease: 0.06,  // Release + audience=all 이면 +0.06
  },
  penalties: {
    repetition: 0.03,      // (옵션) 반복 공지 감점—지금은 0으로 둬도 됨
  },
  thresholds: {
    topK: 7,
    minScore: 0.5,         // 이하는 컷
    maxPerTopic: 3,
  },
};


export const PLAN_TYPE = [
  "trial",
  "free",
  "starter",
  "pro",
  "enterprise",
] as const;

export type PlanType = typeof PLAN_TYPE[number];

export const PLAN_TYPE_LABEL = {
  trial: "Trial",
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

export const SUBSCRIPTION_STATUS = [
  "trialing",
  "active",
  "paused",
  "expired",
  "canceled",
] as const;

export type SubscriptionStatus = typeof SUBSCRIPTION_STATUS[number];

export const SUBSCRIPTION_MODE = [
  "experiment",
  "free",
  "paid",
] as const;

export type SubscriptionMode = typeof SUBSCRIPTION_MODE[number];

export const SOURCE_TYPE = [
  "slack_channel",
  "slack_thread",
  "github_repo",
  "github_search",
] as const;

export type SourceType = typeof SOURCE_TYPE[number];

export const PERIOD_TYPE = [
  "hourly",
  "daily",
  "weekly",
  "monthly",
] as const;

export type PeriodType = typeof PERIOD_TYPE[number];