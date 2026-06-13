import { describe, it, expect, vi, beforeEach } from "vitest"
import { prisma } from "@/lib/prisma"
import { fetchConsolidatedData, buildConsolidatedPDF } from "@/lib/reports/consolidated-report"

describe("fetchConsolidatedData", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns empty data when no payments found", async () => {
    vi.mocked(prisma.payment.findMany).mockResolvedValueOnce([])

    const result = await fetchConsolidatedData("user-1", "2025-01", "2025-06")
    expect(result.rows).toEqual([])
    expect(result.summary.totalCollected).toBe(0)
    expect(result.summary.paymentsCount).toBe(0)
    expect(result.summary.uniqueClients).toBe(0)
  })

  it("returns rows and summary for paid payments", async () => {
    vi.mocked(prisma.payment.findMany).mockResolvedValueOnce([
      {
        id: "p-1",
        paymentMonth: new Date(2025, 0, 31),
        paymentDate: new Date(2025, 0, 28),
        interestEarned: 500000,
        loan: {
          principalAmount: 5000000,
          interestRate: 10,
          client: { name: "Juan" },
        },
      },
      {
        id: "p-2",
        paymentMonth: new Date(2025, 1, 28),
        paymentDate: new Date(2025, 1, 25),
        interestEarned: 500000,
        loan: {
          principalAmount: 5000000,
          interestRate: 10,
          client: { name: "Juan" },
        },
      },
      {
        id: "p-3",
        paymentMonth: new Date(2025, 2, 31),
        paymentDate: new Date(2025, 2, 28),
        interestEarned: 300000,
        loan: {
          principalAmount: 3000000,
          interestRate: 10,
          client: { name: "Maria" },
        },
      },
    ] as never)

    const result = await fetchConsolidatedData("user-1", "2025-01", "2025-03")
    expect(result.rows).toHaveLength(3)
    expect(result.summary.totalCollected).toBe(1300000)
    expect(result.summary.paymentsCount).toBe(3)
    expect(result.summary.uniqueClients).toBe(2)
  })

  it("handles payments with null paymentDate", async () => {
    vi.mocked(prisma.payment.findMany).mockResolvedValueOnce([
      {
        id: "p-1",
        paymentMonth: new Date(2025, 0, 31),
        paymentDate: null,
        interestEarned: 500000,
        loan: {
          principalAmount: 5000000,
          interestRate: 10,
          client: { name: "Juan" },
        },
      },
    ] as never)

    const result = await fetchConsolidatedData("user-1", "2025-01", "2025-01")
    expect(result.rows[0].paymentDate).toBeNull()
  })
})

describe("buildConsolidatedPDF", () => {
  it("generates a PDF buffer from empty data", async () => {
    const data = {
      rows: [],
      summary: {
        totalCollected: 0,
        paymentsCount: 0,
        uniqueClients: 0,
        periodFrom: new Date(2025, 0, 1),
        periodTo: new Date(2025, 5, 30),
      },
    }

    const pdf = await buildConsolidatedPDF(data, "test@test.com")
    expect(Buffer.isBuffer(pdf)).toBe(true)
    expect(pdf.length).toBeGreaterThan(0)
  })

  it("generates a PDF buffer with data rows", async () => {
    const data = {
      rows: [
        {
          clientName: "Juan",
          paymentMonth: new Date(2025, 0, 31),
          paymentDate: new Date(2025, 0, 28),
          interestRate: 10,
          principalAmount: 5000000,
          interestPaid: 500000,
        },
        {
          clientName: "Maria",
          paymentMonth: new Date(2025, 1, 28),
          paymentDate: new Date(2025, 1, 25),
          interestRate: 8,
          principalAmount: 3000000,
          interestPaid: 240000,
        },
      ],
      summary: {
        totalCollected: 740000,
        paymentsCount: 2,
        uniqueClients: 2,
        periodFrom: new Date(2025, 0, 1),
        periodTo: new Date(2025, 5, 30),
      },
    }

    const pdf = await buildConsolidatedPDF(data, "test@test.com")
    expect(Buffer.isBuffer(pdf)).toBe(true)
    expect(pdf.length).toBeGreaterThan(100)
  })

  it("generates PDF with many rows (multi-page)", async () => {
    const rows = Array.from({ length: 50 }, (_, i) => ({
      clientName: `Client ${i}`,
      paymentMonth: new Date(2025, i % 12, 28),
      paymentDate: new Date(2025, i % 12, 25),
      interestRate: 10,
      principalAmount: 1000000,
      interestPaid: 100000,
    }))

    const data = {
      rows,
      summary: {
        totalCollected: 5000000,
        paymentsCount: 50,
        uniqueClients: 50,
        periodFrom: new Date(2025, 0, 1),
        periodTo: new Date(2025, 11, 31),
      },
    }

    const pdf = await buildConsolidatedPDF(data)
    expect(Buffer.isBuffer(pdf)).toBe(true)
    expect(pdf.length).toBeGreaterThan(1000)
  })
})
