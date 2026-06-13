import { describe, it, expect, vi, beforeEach } from "vitest"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { generateMissingPayments } from "@/lib/auto-generate-payments"

describe("generateMissingPayments", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns { success: false, created: 0 } when not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never)
    const result = await generateMissingPayments()
    expect(result).toEqual({ success: false, created: 0 })
  })

  it("returns { success: true, created: 0 } when no active loans", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-1", email: "test@test.com" },
      expires: "2099-01-01",
    } as never)
    vi.mocked(prisma.loan.findMany).mockResolvedValueOnce([])

    const result = await generateMissingPayments()
    expect(result).toEqual({ success: true, created: 0 })
  })

  it("returns { success: true, created: 0 } when all payments exist", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-1", email: "test@test.com" },
      expires: "2099-01-01",
    } as never)
    vi.mocked(prisma.loan.findMany).mockResolvedValueOnce([
      {
        id: "l-1",
        userId: "user-1",
        principalAmount: 5000000,
        interestRate: 10,
        startDate: new Date(2020, 0, 1),
        status: "active",
        payments: Array.from({ length: 100 }, (_, i) => ({ id: `p-${i}` })),
      },
    ] as never)

    const result = await generateMissingPayments()
    expect(result.success).toBe(true)
    expect(result.created).toBe(0)
  })

  it("creates missing payments for active loans", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-1", email: "test@test.com" },
      expires: "2099-01-01",
    } as never)
    vi.mocked(prisma.loan.findMany).mockResolvedValueOnce([
      {
        id: "l-1",
        userId: "user-1",
        principalAmount: 5000000,
        interestRate: 10,
        startDate: new Date(2025, 3, 1),
        status: "active",
        payments: [],
      },
    ] as never)
    vi.mocked(prisma.payment.createMany).mockResolvedValueOnce({ count: 1 } as never)

    const result = await generateMissingPayments()
    expect(result.success).toBe(true)
    expect(result.created).toBeGreaterThan(0)
    expect(prisma.payment.createMany).toHaveBeenCalled()
  })

  it("skips loans that already have all payments", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-1", email: "test@test.com" },
      expires: "2099-01-01",
    } as never)

    const manyPayments = Array.from({ length: 200 }, (_, i) => ({ id: `p-${i}` }))
    vi.mocked(prisma.loan.findMany).mockResolvedValueOnce([
      {
        id: "l-1",
        userId: "user-1",
        principalAmount: 5000000,
        interestRate: 10,
        startDate: new Date(2020, 0, 1),
        status: "active",
        payments: manyPayments,
      },
    ] as never)

    const result = await generateMissingPayments()
    expect(result.success).toBe(true)
    expect(result.created).toBe(0)
    expect(prisma.payment.createMany).not.toHaveBeenCalled()
  })

  it("handles errors gracefully", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: "user-1", email: "test@test.com" },
      expires: "2099-01-01",
    } as never)
    vi.mocked(prisma.loan.findMany).mockRejectedValueOnce(new Error("DB error"))

    const result = await generateMissingPayments()
    expect(result).toEqual({ success: false, created: 0 })
  })
})
