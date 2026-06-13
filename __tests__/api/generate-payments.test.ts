import { describe, it, expect, vi, beforeEach } from "vitest"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { POST } from "@/app/api/loans/[id]/generate-payments/route"

vi.mocked(getServerSession).mockResolvedValue({
  user: { id: "user-1", email: "test@test.com", role: "user" },
  expires: "2099-01-01",
} as never)

describe("POST /api/loans/:id/generate-payments", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never)
    const req = new Request("http://localhost/api/loans/l-1/generate-payments", {
      method: "POST",
    })
    const res = await POST(req as never, { params: Promise.resolve({ id: "l-1" }) })
    expect(res.status).toBe(401)
  })

  it("returns 404 when loan not found", async () => {
    vi.mocked(prisma.loan.findFirst).mockResolvedValueOnce(null)
    const req = new Request("http://localhost/api/loans/l-1/generate-payments", {
      method: "POST",
    })
    const res = await POST(req as never, { params: Promise.resolve({ id: "l-1" }) })
    expect(res.status).toBe(404)
  })

  it("returns success with 0 when no payments are missing", async () => {
    vi.mocked(prisma.loan.findFirst).mockResolvedValueOnce({
      id: "l-1",
      userId: "user-1",
      principalAmount: 5000000,
      interestRate: 10,
      startDate: new Date(2020, 0, 1),
      payments: Array.from({ length: 100 }, (_, i) => ({ id: `p-${i}` })),
    } as never)

    const req = new Request("http://localhost/api/loans/l-1/generate-payments", {
      method: "POST",
    })
    const res = await POST(req as never, { params: Promise.resolve({ id: "l-1" }) })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.created).toBe(0)
  })

  it("generates missing payments", async () => {
    vi.mocked(prisma.loan.findFirst).mockResolvedValueOnce({
      id: "l-1",
      userId: "user-1",
      principalAmount: 5000000,
      interestRate: 10,
      startDate: new Date(2025, 3, 1),
      payments: [],
    } as never)
    vi.mocked(prisma.payment.createMany).mockResolvedValueOnce({ count: 1 } as never)

    const req = new Request("http://localhost/api/loans/l-1/generate-payments", {
      method: "POST",
    })
    const res = await POST(req as never, { params: Promise.resolve({ id: "l-1" }) })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.created).toBeGreaterThan(0)
  })

  it("returns 500 on database error", async () => {
    vi.mocked(prisma.loan.findFirst).mockRejectedValueOnce(new Error("DB error"))
    const req = new Request("http://localhost/api/loans/l-1/generate-payments", {
      method: "POST",
    })
    const res = await POST(req as never, { params: Promise.resolve({ id: "l-1" }) })
    expect(res.status).toBe(500)
  })
})
