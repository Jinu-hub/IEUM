/**
 * Payment Utilities
 *
 * Common utility functions for payment and subscription calculations.
 * These functions are shared between server-side API and client-side components.
 */

import type { Currency, PlanType } from "~/core/lib/constants";
import { EXCHANGE_RATES, PLAN_PRICES } from "~/core/lib/constants";

/**
 * Refund calculation result
 */
export interface RefundCalculation {
  yearlyAmount: number;
  monthlyPrice: number;
  usedMonths: number;
  deduction: number;
  refundAmount: number;
}

/**
 * Calculate the number of used months from a start date
 * Uses ceiling calculation (partial month = 1 month)
 *
 * @param startedAt - ISO date string of subscription start date
 * @returns Number of months used (minimum 1)
 */
export function calculateUsedMonths(startedAt: string): number {
  const startDate = new Date(startedAt);
  const now = new Date();
  const diffTime = now.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.ceil(diffDays / 30));
}

/**
 * Calculate the new ends_at date for yearly subscription cancellation
 * Based on the number of months actually used
 *
 * @param startedAt - ISO date string of subscription start date
 * @returns New ends_at date (minimum is current date)
 */
export function calculateNewEndsAt(startedAt: string): Date {
  const startDate = new Date(startedAt);
  const now = new Date();
  const usedMonths = calculateUsedMonths(startedAt);

  // New ends_at = started_at + used months
  const calculatedEndsAt = new Date(startDate);
  calculatedEndsAt.setMonth(calculatedEndsAt.getMonth() + usedMonths);

  // Ensure ends_at is not in the past
  return calculatedEndsAt > now ? calculatedEndsAt : now;
}

/**
 * Calculate the new ends_at date as ISO string
 *
 * @param startedAt - ISO date string of subscription start date
 * @returns New ends_at as ISO string
 */
export function calculateNewEndsAtISO(startedAt: string): string {
  return calculateNewEndsAt(startedAt).toISOString();
}

/**
 * Calculate refund amount for yearly subscriptions
 * Uses actual paid amount from DB if available, otherwise falls back to price constants
 *
 * @param planType - The subscription plan type
 * @param currency - The billing currency
 * @param startedAt - ISO date string of subscription start date
 * @param paidAmount - Actual paid amount from DB (optional)
 * @returns Refund calculation details
 */
export function calculateRefund(
  planType: PlanType,
  currency: Currency,
  startedAt: string,
  paidAmount: number | null
): RefundCalculation {
  // Only starter, pro, enterprise have prices - trial/free return 0
  const priceablePlan = planType as keyof typeof PLAN_PRICES;
  const monthlyPrice = Math.round(
    (PLAN_PRICES[priceablePlan]?.monthly ?? 0) * EXCHANGE_RATES[currency]
  );

  // Use actual paid amount from DB if available, otherwise calculate from constants
  const yearlyAmount =
    paidAmount ??
    Math.round(
      (PLAN_PRICES[priceablePlan]?.yearly ?? 0) * EXCHANGE_RATES[currency]
    );

  // Calculate used months using shared utility
  const usedMonths = calculateUsedMonths(startedAt);

  // Calculate deduction and refund
  const deduction = monthlyPrice * usedMonths;
  const refundAmount = Math.max(0, yearlyAmount - deduction);

  return {
    yearlyAmount,
    monthlyPrice,
    usedMonths,
    deduction,
    refundAmount,
  };
}
