// constants.ts — NexLetter v0.1
// 앱 전체에서 사용되는 상수들

/* =========================================================
   Database Enums
   ========================================================= */

export const RUN_STATUS = [
  "queued", "running", "success", "failed", "canceled",
] as const;

export const STEP_NAME = [
  "collector_slack", "collector_github", "summarizer", "assembler", "sender_email"
] as const;

export const STEP_STATUS = [
  "queued", "running", "success", "failed", "skipped",
] as const;

export const INTEGRATION_TYPE = [
  "slack", "github", "discord", "lineworks",
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
  "connected", "expired", "revoked", "unauthorized", "error", "never",
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