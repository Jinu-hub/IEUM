/**
 * Payment System Schema
 * 
 * This file defines the database schema for payment records and sets up
 * Supabase Row Level Security (RLS) policies to control data access.
 * The schema is designed to work with payment processors like Toss Payments
 * (as indicated by the imports in package.json).
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authUsers, authenticatedRole, serviceRole } from "drizzle-orm/supabase";
import { timestamps } from "~/core/db/helpers.server";
import {
  BILLING_INTERVAL,
  PAYMENT_METHOD_STATUS,
  PAYMENT_METHOD_TYPE,
  PERIOD_TYPE,
  PLAN_TYPE,
  SOURCE_TYPE,
  SUBSCRIPTION_MODE,
  SUBSCRIPTION_STATUS,
} from "~/core/lib/constants";

/**
 * Database Enums
 */
export const planType = pgEnum("plan_type", PLAN_TYPE);
export const subscriptionStatus = pgEnum("subscription_status", SUBSCRIPTION_STATUS);
export const subscriptionMode = pgEnum("subscription_mode", SUBSCRIPTION_MODE);
export const sourceType = pgEnum("source_type", SOURCE_TYPE);
export const periodType = pgEnum("period_type", PERIOD_TYPE);
export const billingInterval = pgEnum("billing_interval", BILLING_INTERVAL);
export const paymentMethodType = pgEnum("payment_method_type", PAYMENT_METHOD_TYPE);
export const paymentMethodStatus = pgEnum("payment_method_status", PAYMENT_METHOD_STATUS); 


/**
 * Payments Table
 * 
 * Stores payment transaction records with details from the payment processor.
 * Links to Supabase auth.users table via user_id foreign key.
 * 
 * Includes Row Level Security (RLS) policies to ensure users can only
 * view their own payment records. Payment records are typically created
 * and managed by the backend service (service role) for security.
 */
export const payments = pgTable(
  "payments",
  {
    // Auto-incrementing primary key for payment records
    payment_id: bigint({ mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    // Payment processor's unique identifier for the transaction
    payment_key: text().notNull(),
    // Unique identifier for the order in your system
    order_id: text().notNull(),
    // Human-readable name for the order
    order_name: text().notNull(),
    // Total amount of the payment transaction
    total_amount: doublePrecision().notNull(),
    // Custom metadata about the payment (product details, etc.)
    metadata: jsonb().notNull(),
    // Complete raw response from the payment processor
    raw_data: jsonb().notNull(),
    // URL to the payment receipt provided by the processor
    receipt_url: text().notNull(),
    // Current status of the payment (e.g., "approved", "failed")
    status: text().notNull(),
    // Foreign key to the user who made the payment
    // Using CASCADE ensures payment records are deleted when user is deleted
    user_id: uuid().references(() => authUsers.id, {
      onDelete: "cascade",
    }),
    // When the payment was approved by the processor
    approved_at: timestamp().notNull(),
    // When the payment was initially requested
    requested_at: timestamp().notNull(),
    // Adds created_at and updated_at timestamp columns
    ...timestamps,
  },
  (table) => [
    pgPolicy("pay_select", { for: "select", to: authenticatedRole, using: sql`${authUid} = ${table.user_id}` }),
    pgPolicy("pay_insert", { for: "insert", to: serviceRole, withCheck: sql`true` }),
    pgPolicy("pay_update", { for: "update", to: serviceRole, using: sql`true`, withCheck: sql`true` }),
    pgPolicy("pay_delete", { for: "delete", to: serviceRole, using: sql`true` }),
  ],
);

/**
 * Payment Methods Table
 * 
 * Stores payment method records for recurring billing (subscriptions).
 * Securely stores billing keys (tokens) issued by payment gateways instead of
 * storing sensitive card/account information directly.
 * 
 * Key Features:
 * - Stores billing_key (token) from payment gateway, not actual card/account data
 * - Supports multiple payment methods per user (card, bank, wallet)
 * - Tracks payment method status (active, suspended, expired, revoked)
 * - Allows users to set a default payment method
 * - Stores display information (brand, last 4 digits) for UI purposes
 * 
 * Links to Supabase auth.users table via user_id foreign key.
 * 
 * Includes Row Level Security (RLS) policies to ensure users can only
 * view their own payment method records. Payment method records are typically
 * created and managed by the backend service (service role) for security.
 */
export const paymentMethods = pgTable(
  "payment_methods",
  {
    // Primary key for payment method records
    method_id: uuid().defaultRandom().primaryKey(),
    // Foreign key to the user who owns the payment method
    // Using CASCADE ensures payment method records are deleted when user is deleted
    user_id: uuid()
      .notNull()
      .references(() => authUsers.id, {
        onDelete: "cascade",
      }),
    // Payment gateway provider identifier (e.g., "toss")
    pg_provider: text().notNull(),
    // Payment method type: card, bank, wallet
    method_type: paymentMethodType().notNull(),
    // Payment gateway customer identification key
    customer_key: text(),
    // Payment gateway region (e.g., "KR", "JP", "OTHER(Global)")
    region: text(),
    // Payment gateway currency (e.g., "KRW", "USD", "JPY")
    currency: text(),
    // Billing key (token) issued by payment gateway
    billing_key: text().notNull(),
    // Payment method status: active, suspended, expired, revoked
    status: paymentMethodStatus().notNull(),
    // Whether this is the user's default payment method
    is_default: boolean().notNull(),
    // Display brand (e.g., card brand for display purposes)
    display_brand: text(),
    // Last 4 digits for display purposes
    display_last4: text(),
    // Additional metadata about the payment method
    metadata: jsonb(),
    // Raw response from payment gateway (minimal, sensitive info removed)
    raw_data: jsonb(),
    // When the billing key was issued
    issued_at: timestamp({ withTimezone: true }),
    // When the billing key was revoked
    revoked_at: timestamp({ withTimezone: true }),
    // Adds created_at and updated_at timestamp columns
    ...timestamps,
  },
  (table) => [
    pgPolicy("pm_select", { for: "select", to: authenticatedRole, using: sql`${authUid} = ${table.user_id}` }),
    pgPolicy("pm_insert", { for: "insert", to: serviceRole, withCheck: sql`true` }),
    pgPolicy("pm_update", { for: "update", to: serviceRole, using: sql`true`, withCheck: sql`true` }),
    pgPolicy("pm_delete", { for: "delete", to: serviceRole, using: sql`true` }),
  ],
);

/**
 * Subscriptions Table
 * 
 * Single Source of Truth for user's current plan status.
 * Links to Supabase auth.users table via user_id foreign key.
 * 
 * Includes Row Level Security (RLS) policies to ensure users can only
 * view their own subscription records. Subscription records are typically
 * created and managed by the backend service (service role) for security.
 */
export const subscriptions = pgTable(
  "subscriptions",
  {
    // Primary key for subscription records
    subscription_id: uuid().defaultRandom().primaryKey(),
    // Foreign key to the user who owns the subscription
    // Using CASCADE ensures subscription records are deleted when user is deleted
    user_id: uuid()
      .notNull()
      .references(() => authUsers.id, {
        onDelete: "cascade",
      }),
    // Plan type: trial, free, starter, pro, enterprise
    plan_type: planType().notNull(),
    // Subscription status: trialing, active, paused, expired, canceled
    status: subscriptionStatus().notNull(),
    // Subscription mode: experiment, free, paid
    mode: subscriptionMode().notNull(),
    // Foreign key to the payment method used for this subscription
    // References payment_methods.method_id
    payment_method_id: uuid().references(() => paymentMethods.method_id, {
      onDelete: "set null",
    }),
    // Billing interval: weekly, monthly, yearly
    billing_interval: billingInterval().notNull().default("monthly"),
    // Billing region (e.g., "KR", "JP", "OTHER(Global)")
    billing_region: text().notNull().default("KR"),
    // Billing currency (e.g., "KRW", "JPY", "USD")
    billing_currency: text().notNull().default("KRW"),
    // When the plan started
    started_at: timestamp({ withTimezone: true }).notNull(),
    // When the plan ends (null if ongoing)
    ends_at: timestamp({ withTimezone: true }),
    // When the trial period ends (null if not in trial)
    trial_ends_at: timestamp({ withTimezone: true }),
    // Foreign key to the latest payment for this subscription
    // References payments.payment_id (bigint)
    latest_payment_id: bigint({ mode: "number" }).references(
      () => payments.payment_id,
      {
        onDelete: "set null",
      }
    ),
    // Adds created_at and updated_at timestamp columns
    ...timestamps,
  },
  (table) => [
    pgPolicy("subsc_select", { for: "select", to: authenticatedRole, using: sql`${authUid} = ${table.user_id}` }),
    pgPolicy("subsc_insert", { for: "insert", to: serviceRole, withCheck: sql`true` }),
    pgPolicy("subsc_update", { for: "update", to: serviceRole, using: sql`true`, withCheck: sql`true` }),
    pgPolicy("subsc_delete", { for: "delete", to: serviceRole, using: sql`true` }),
  ],
);

/**
 * Plan Limits Table
 * 
 * Defines the upper limits for each plan type.
 * Defines "how much can be created" for each plan.
 * 
 * Includes Row Level Security (RLS) policies:
 * - All authenticated users can read plan limits (needed to check plan restrictions)
 * - Only service role can modify plan limits (admin-only configuration)
 */
export const planLimits = pgTable(
  "plan_limits",
  {
    // Plan type as primary key
    plan_type: planType().primaryKey(),
    // Maximum number of workspaces (null = unlimited)
    max_workspaces: integer(),
    // Maximum number of targets (null = unlimited)
    max_targets: integer(),
    // Maximum number of daily emails sent per week
    max_daily_emails_per_week: integer(),
    // Maximum number of weekly emails sent per month
    max_weekly_emails_per_month: integer(),
    // Maximum number of monthly emails sent per month
    max_monthly_emails_per_month: integer(),
    // Maximum number of members per target
    max_members_per_target: integer(),
  },
  (table) => [
    pgPolicy("plan_select", { for: "select", to: authenticatedRole, using: sql`true` }),
    pgPolicy("plan_insert", { for: "insert", to: serviceRole, withCheck: sql`true` }),
    pgPolicy("plan_update", { for: "update", to: serviceRole, using: sql`true`, withCheck: sql`true` }),
    pgPolicy("plan_delete", { for: "delete", to: serviceRole, using: sql`true` }),
  ],
);

/**
 * Target Source Policy Table
 * 
 * Defines plan-based restrictions on source type combinations within targets.
 * Defines "how many Slack channels? how many GitHub repos?" per target for each plan.
 * 
 * Includes Row Level Security (RLS) policies:
 * - All authenticated users can read policies (needed to check plan restrictions)
 * - Only service role can modify policies (admin-only configuration)
 */
export const targetSourcePolicy = pgTable(
  "target_source_policy",
  {
    // Primary key for policy records
    policy_id: uuid().defaultRandom().primaryKey(),
    // Plan type this policy applies to
    plan_type: planType().notNull(),
    // Source type: slack_channel, slack_thread, github_repo, github_search
    source_type: sourceType().notNull(),
    // Maximum count of this source type per target (null = unlimited)
    max_count: integer(),
  },
  (table) => [
    pgPolicy("tsp_select", { for: "select", to: authenticatedRole, using: sql`true` }),
    pgPolicy("tsp_insert", { for: "insert", to: serviceRole, withCheck: sql`true` }),
    pgPolicy("tsp_update", { for: "update", to: serviceRole, using: sql`true`, withCheck: sql`true` }),
    pgPolicy("tsp_delete", { for: "delete", to: serviceRole, using: sql`true` }),
  ],
);

/**
 * Usage Counters Table
 * 
 * Tracks usage metrics for users by subscription mode and time period.
 * Records process pipeline counts and email sent counts for billing and quota management.
 * 
 * Includes Row Level Security (RLS) policies:
 * - Users can only view their own usage counter records
 * - Only service role can modify usage counters (backend service manages these)
 */
export const usageCounters = pgTable(
  "usage_counters",
  {
    // Primary key for counter records
    counter_id: uuid().defaultRandom().primaryKey(),
    // Foreign key to the user who owns the usage counter
    // Using CASCADE ensures counter records are deleted when user is deleted
    user_id: uuid()
      .notNull()
      .references(() => authUsers.id, {
        onDelete: "cascade",
      }),
    // Subscription mode: experiment, free, paid
    mode: subscriptionMode().notNull(),
    // Period type: hourly, daily, weekly, monthly
    period_type: periodType().notNull(),
    // When the measurement period started
    period_start: timestamp({ withTimezone: true }).notNull(),
    // When the measurement period ended
    period_end: timestamp({ withTimezone: true }).notNull(),
    // Number of processing pipelines executed
    process_count: integer().notNull(),
    // Number of emails sent
    email_sent_count: integer().notNull(),
    // When the counter record was created
    created_at: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    pgPolicy("uc_select", { for: "select", to: authenticatedRole, using: sql`${authUid} = ${table.user_id}` }),
    pgPolicy("uc_insert", { for: "insert", to: serviceRole, withCheck: sql`true` }),
    pgPolicy("uc_update", { for: "update", to: serviceRole, using: sql`true`, withCheck: sql`true` }),
    pgPolicy("uc_delete", { for: "delete", to: serviceRole, using: sql`true` }),
  ],
);
