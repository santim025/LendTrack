import { describe, it, expect, vi, beforeEach } from "vitest"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { GET, POST } from "@/app/api/loans/route"

vi.mock("@/lib/auto-generate-payments", () => ({
  generateMissingPayments: vi.fn().mockResolvedValue({ success: true, created: 0 }),
}))

vi.mocked(getServerSession).mockResolvedValue({
  user: { id: "user-1", email: "test@test.com", role: "user" },
  expires: "2099-01-01",
} as never)

describe("GET /api/loans", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("returns loans with payment progress", async () => {
    vi.mocked(prisma.loan.findMany).mockResolvedValueOnce([
      {
        id: "l-1",
        userId: "user-1",
        clientId: "c-1",
        principalAmount: 5000000,
        interestRate: 10,
        startDate: new Date(2025, 3, 1),
        paymentFrequencyDays: 30,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
        client: { name: "Juan", id: "c-1" },
        payments: [{ wasPaid: true }, { wasPaid: false }, { wasPaid: false }],
      },
    ] as never)

    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(1)
    expect(data[0].payments.total).toBe(3)
    expect(data[0].payments.paid).toBe(1)
    expect(data[0].payments.pending).toBe(2)
  })
})

describe("POST /api/loans", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never)
    const req = new Request("http://localhost/api/loans", {
      method: "POST",
      body: JSON.stringify({
        clientId: "c-1",
        principalAmount: 5000000,
        interestRate: 10,
        startDate: "2025-04-01",
        paymentFrequencyDays: "30",
      }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(401)
  })

  it("returns 400 when required fields are missing", async () => {
    const req = new Request("http://localhost/api/loans", {
      method: "POST",
      body: JSON.stringify({ clientId: "c-1" }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it("returns 400 when principalAmount is not positive", async () => {
    const req = new Request("http://localhost/api/loans", {
      method: "POST",
      body: JSON.stringify({
        clientId: "c-1",
        principalAmount: -100,
        interestRate: 10,
        startDate: "2025-04-01",
        paymentFrequencyDays: "30",
      }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it("returns 400 when interestRate is out of range", async () => {
    const req = new Request("http://localhost/api/loans", {
      method: "POST",
      body: JSON.stringify({
        clientId: "c-1",
        principalAmount: 5000000,
        interestRate: 150,
        startDate: "2025-04-01",
        paymentFrequencyDays: "30",
      }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it("returns 400 when startDate is invalid", async () => {
    const req = new Request("http://localhost/api/loans", {
      method: "POST",
      body: JSON.stringify({
        clientId: "c-1",
        principalAmount: 5000000,
        interestRate: 10,
        startDate: "not-a-date",
        paymentFrequencyDays: "30",
      }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it("creates loan and generates payments", async () => {
    vi.mocked(prisma.loan.create).mockResolvedValueOnce({
      id: "l-1",
      userId: "user-1",
      clientId: "c-1",
      principalAmount: 5000000,
      interestRate: 10,
      startDate: new Date(2025, 3, 1),
      paymentFrequencyDays: 30,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never)
    vi.mocked(prisma.payment.createMany).mockResolvedValueOnce({ count: 1 } as never)

    const req = new Request("http://localhost/api/loans", {
      method: "POST",
      body: JSON.stringify({
        clientId: "c-1",
        principalAmount: 5000000,
        interestRate: 10,
        startDate: "2025-04-01",
        paymentFrequencyDays: "30",
      }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(201)
    expect(prisma.payment.createMany).toHaveBeenCalled()
  })

  it("returns 500 on database error (GET)", async () => {
    vi.mocked(prisma.loan.findMany).mockRejectedValueOnce(new Error("DB error"))
    const res = await GET()
    expect(res.status).toBe(500)
  })

  it("returns 500 on database error (POST)", async () => {
    vi.mocked(prisma.loan.create).mockRejectedValueOnce(new Error("DB error"))
    const req = new Request("http://localhost/api/loans", {
      method: "POST",
      body: JSON.stringify({
        clientId: "c-1",
        principalAmount: 5000000,
        interestRate: 10,
        startDate: "2025-04-01",
        paymentFrequencyDays: "30",
      }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(500)
  })
})
