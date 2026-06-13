import { describe, it, expect, vi, beforeEach } from "vitest"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { GET } from "@/app/api/payments/route"

vi.mock("@/lib/auto-generate-payments", () => ({
  generateMissingPayments: vi.fn().mockResolvedValue({ success: true, created: 0 }),
}))

vi.mocked(getServerSession).mockResolvedValue({
  user: { id: "user-1", email: "test@test.com", role: "user" },
  expires: "2099-01-01",
} as never)

describe("GET /api/payments", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("returns payments with overdue status", async () => {
    const pastDate = new Date()
    pastDate.setMonth(pastDate.getMonth() - 1)

    vi.mocked(prisma.payment.findMany).mockResolvedValueOnce([
      {
        id: "p-1",
        userId: "user-1",
        loanId: "l-1",
        paymentMonth: pastDate,
        interestEarned: 500000,
        wasPaid: false,
        paymentDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        loan: {
          id: "l-1",
          client: { id: "c-1", name: "Juan" },
        },
      },
      {
        id: "p-2",
        userId: "user-1",
        loanId: "l-1",
        paymentMonth: new Date(),
        interestEarned: 500000,
        wasPaid: true,
        paymentDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        loan: {
          id: "l-1",
          client: { id: "c-1", name: "Juan" },
        },
      },
    ] as never)

    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(2)
    expect(data[0].is_overdue).toBe(true)
    expect(data[1].is_overdue).toBe(false)
    expect(data[1].was_paid).toBe(true)
  })

  it("returns 500 on database error", async () => {
    vi.mocked(prisma.payment.findMany).mockRejectedValueOnce(new Error("DB error"))
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
