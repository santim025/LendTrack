import { describe, it, expect, vi, beforeEach } from "vitest"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { POST } from "@/app/api/admin/generate-all-payments/route"

const adminSession = {
  user: { id: "admin-1", email: "admin@test.com", role: "admin" },
  expires: "2099-01-01",
}

const userSession = {
  user: { id: "user-1", email: "user@test.com", role: "user" },
  expires: "2099-01-01",
}

describe("POST /api/admin/generate-all-payments", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getServerSession).mockResolvedValue(adminSession as never)
  })

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never)
    const res = await POST()
    expect(res.status).toBe(401)
  })

  it("returns 403 when not admin", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(userSession as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ role: "user" } as never)
    const res = await POST()
    expect(res.status).toBe(403)
  })

  it("generates payments for all loans", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ role: "admin" } as never)
    vi.mocked(prisma.loan.findMany).mockResolvedValueOnce([
      {
        id: "l-1",
        userId: "admin-1",
        principalAmount: 5000000,
        interestRate: 10,
        startDate: new Date(2025, 3, 1),
        payments: [],
      },
    ] as never)
    vi.mocked(prisma.payment.createMany).mockResolvedValue({ count: 1 } as never)

    const res = await POST()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.totalCreated).toBeGreaterThan(0)
  })

  it("returns 500 on database error", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ role: "admin" } as never)
    vi.mocked(prisma.loan.findMany).mockRejectedValueOnce(new Error("DB error"))
    const res = await POST()
    expect(res.status).toBe(500)
  })
})
