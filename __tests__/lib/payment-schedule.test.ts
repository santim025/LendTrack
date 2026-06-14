import { describe, it, expect } from "vitest"
import { getPaymentsNeeded, getPaymentDate } from "@/lib/payment-schedule"

// The scheduling logic operates entirely in UTC (real start dates come from
// "YYYY-MM-DD" strings parsed as UTC midnight, and Prisma stores DateTime in
// UTC). Tests build dates with Date.UTC(...) and read results with UTC getters
// so they stay deterministic regardless of the runner's local timezone.

describe("getPaymentsNeeded", () => {
  it("returns 0 when reference is the same month as start", () => {
    const start = new Date(Date.UTC(2025, 3, 15)) // April 2025
    const ref = new Date(Date.UTC(2025, 3, 20)) // April 2025
    expect(getPaymentsNeeded(start, ref)).toBe(0)
  })

  it("returns 1 when reference is one month after start", () => {
    const start = new Date(Date.UTC(2025, 3, 15)) // April 2025
    const ref = new Date(Date.UTC(2025, 4, 10)) // May 2025
    expect(getPaymentsNeeded(start, ref)).toBe(1)
  })

  it("returns correct count across year boundary", () => {
    const start = new Date(Date.UTC(2024, 10, 1)) // November 2024
    const ref = new Date(Date.UTC(2025, 1, 15)) // February 2025
    expect(getPaymentsNeeded(start, ref)).toBe(3) // Dec, Jan, Feb
  })

  it("returns 0 when reference is before start", () => {
    const start = new Date(Date.UTC(2025, 5, 1)) // June 2025
    const ref = new Date(Date.UTC(2025, 3, 1)) // April 2025
    expect(getPaymentsNeeded(start, ref)).toBe(0)
  })

  it("returns correct count for many months", () => {
    const start = new Date(Date.UTC(2024, 8, 1)) // September 2024
    const ref = new Date(Date.UTC(2026, 5, 12)) // June 2026
    expect(getPaymentsNeeded(start, ref)).toBe(21)
  })
})

describe("getPaymentDate", () => {
  it("payment 1 from April 2025 returns last day of May 2025", () => {
    const start = new Date(Date.UTC(2025, 3, 15)) // April 15, 2025
    const date = getPaymentDate(start, 1)
    expect(date.getUTCFullYear()).toBe(2025)
    expect(date.getUTCMonth()).toBe(4) // May
    expect(date.getUTCDate()).toBe(31)
  })

  it("payment 2 from April 2025 returns last day of June 2025", () => {
    const start = new Date(Date.UTC(2025, 3, 15)) // April 15, 2025
    const date = getPaymentDate(start, 2)
    expect(date.getUTCFullYear()).toBe(2025)
    expect(date.getUTCMonth()).toBe(5) // June
    expect(date.getUTCDate()).toBe(30)
  })

  it("payment 14 from April 2025 returns last day of June 2026", () => {
    const start = new Date(Date.UTC(2025, 3, 1)) // April 2025
    const date = getPaymentDate(start, 14)
    expect(date.getUTCFullYear()).toBe(2026)
    expect(date.getUTCMonth()).toBe(5) // June
    expect(date.getUTCDate()).toBe(30)
  })

  it("handles February in leap year", () => {
    const start = new Date(Date.UTC(2023, 11, 15)) // December 2023
    const date = getPaymentDate(start, 2) // February 2024
    expect(date.getUTCFullYear()).toBe(2024)
    expect(date.getUTCMonth()).toBe(1) // February
    expect(date.getUTCDate()).toBe(29) // 2024 is a leap year
  })

  it("handles February in non-leap year", () => {
    const start = new Date(Date.UTC(2024, 11, 15)) // December 2024
    const date = getPaymentDate(start, 2) // February 2025
    expect(date.getUTCFullYear()).toBe(2025)
    expect(date.getUTCMonth()).toBe(1) // February
    expect(date.getUTCDate()).toBe(28)
  })

  it("payment from end-of-month start date", () => {
    const start = new Date(Date.UTC(2025, 3, 30)) // April 30, 2025
    const date = getPaymentDate(start, 1)
    expect(date.getUTCFullYear()).toBe(2025)
    expect(date.getUTCMonth()).toBe(4) // May
    expect(date.getUTCDate()).toBe(31)
  })
})
