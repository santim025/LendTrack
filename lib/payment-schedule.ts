/**
 * Payment scheduling logic for interest-only loans.
 *
 * Convention:
 * - Payment #1 is due on the last day of the month following the start month.
 * - Each subsequent payment is due on the last day of the next month.
 *
 * Example: start 29-Apr -> payment 1 = 31-May, payment 2 = 30-Jun, ...
 *
 * All month math uses UTC. Start dates come from "YYYY-MM-DD" strings parsed as
 * UTC midnight, so reading the month with local getters (getMonth) in negative
 * timezones could shift the schedule a month for day-1 start dates. UTC getters
 * keep the schedule aligned with the calendar date the user actually entered.
 */

/** Number of payments that should exist from start date up to reference date (inclusive). */
export function getPaymentsNeeded(startDate: Date, reference: Date = new Date()): number {
  const monthsDiff =
    (reference.getUTCFullYear() - startDate.getUTCFullYear()) * 12 +
    (reference.getUTCMonth() - startDate.getUTCMonth())
  return Math.max(monthsDiff, 0)
}

/**
 * Due date for payment `paymentNumber` (1-indexed).
 * Always the last day of the corresponding month, calculated from start
 * to avoid accumulated errors when chaining payments.
 *
 * Formula: Date.UTC(year, month + paymentNumber + 1, 0)
 * Day 0 of month N = last day of month N-1.
 * So day 0 of (startMonth + paymentNumber + 1) = last day of (startMonth + paymentNumber).
 *
 * Example: start April (month 3), payment 1:
 *   Date.UTC(2025, 3 + 1 + 1, 0) = new Date(2025, 5, 0) = May 31, 2025
 */
export function getPaymentDate(startDate: Date, paymentNumber: number): Date {
  return new Date(
    Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + paymentNumber + 1, 0)
  )
}
