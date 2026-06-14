import { describe, it, expect } from "vitest"
import { getPaymentsNeeded, getPaymentDate } from "@/lib/payment-schedule"

// See payment-schedule.test.ts: all dates are built and read in UTC so the
// suite is independent of the runner's local timezone.

describe("getPaymentsNeeded - edge cases", () => {
  it("handles same day of month", () => {
    const start = new Date(Date.UTC(2025, 3, 15))
    const ref = new Date(Date.UTC(2025, 4, 15))
    expect(getPaymentsNeeded(start, ref)).toBe(1)
  })

  it("handles end of month to end of month", () => {
    const start = new Date(Date.UTC(2025, 0, 31)) // Jan 31
    const ref = new Date(Date.UTC(2025, 1, 28)) // Feb 28
    expect(getPaymentsNeeded(start, ref)).toBe(1)
  })

  it("handles multiple years", () => {
    const start = new Date(Date.UTC(2020, 0, 1))
    const ref = new Date(Date.UTC(2025, 11, 31))
    expect(getPaymentsNeeded(start, ref)).toBe(71) // 5 years * 12 - 1
  })
})

describe("getPaymentDate - edge cases", () => {
  it("handles payment 100 (far future)", () => {
    const start = new Date(Date.UTC(2025, 0, 1))
    const date = getPaymentDate(start, 100)
    expect(date.getUTCFullYear()).toBe(2033)
    expect(date.getUTCMonth()).toBe(4) // May
  })

  it("handles start in December", () => {
    const start = new Date(Date.UTC(2025, 11, 15)) // December 2025
    const date = getPaymentDate(start, 1)
    expect(date.getUTCFullYear()).toBe(2026)
    expect(date.getUTCMonth()).toBe(0) // January
    expect(date.getUTCDate()).toBe(31)
  })

  it("handles start in February", () => {
    const start = new Date(Date.UTC(2025, 1, 15)) // February 2025
    const date = getPaymentDate(start, 1)
    expect(date.getUTCFullYear()).toBe(2025)
    expect(date.getUTCMonth()).toBe(2) // March
    expect(date.getUTCDate()).toBe(31)
  })
})
