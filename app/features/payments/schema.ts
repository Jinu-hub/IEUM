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
