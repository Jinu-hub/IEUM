/**
 * Payment Utilities
 *
 * Common utility functions for payment and subscription calculations.
 * These functions are shared between server-side API and client-side components.
 */

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
