import { describe, it, expect, vi, beforeEach } from "vitest"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { GET, DELETE } from "@/app/api/clients/[id]/route"

vi.mocked(getServerSession).mockResolvedValue({
  user: { id: "user-1", email: "test@test.com", role: "user" },
  expires: "2099-01-01",
} as never)

const mockClient = {
  id: "c-1",
  userId: "user-1",
  name: "Juan",
  phoneNumber: "123",
  address: "Calle 1",
  payageImageUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe("GET /api/clients/:id", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never)
    const req = new Request("http://localhost/api/clients/c-1")
    const res = await GET(req as never, { params: Promise.resolve({ id: "c-1" }) })
    expect(res.status).toBe(401)
  })

  it("returns 404 when client not found", async () => {
    vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(null)
    const req = new Request("http://localhost/api/clients/c-1")
    const res = await GET(req as never, { params: Promise.resolve({ id: "c-1" }) })
    expect(res.status).toBe(404)
  })

  it("returns client detail with loans and stats", async () => {
    vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(mockClient as never)
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
        payments: [
          { wasPaid: true, interestEarned: 500000, paymentMonth: new Date() },
          { wasPaid: false, interestEarned: 500000, paymentMonth: new Date() },
        ],
      },
    ] as never)
    vi.mocked(prisma.payment.findMany).mockResolvedValueOnce([])

    const req = new Request("http://localhost/api/clients/c-1")
    const res = await GET(req as never, { params: Promise.resolve({ id: "c-1" }) })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.client.name).toBe("Juan")
    expect(data.loans).toHaveLength(1)
    expect(data.stats.activeLoansCount).toBe(1)
  })
})

describe("DELETE /api/clients/:id", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never)
    const req = new Request("http://localhost/api/clients/c-1", { method: "DELETE" })
    const res = await DELETE(req as never, { params: Promise.resolve({ id: "c-1" }) })
    expect(res.status).toBe(401)
  })

  it("returns 404 when client not found", async () => {
    vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(null)
    const req = new Request("http://localhost/api/clients/c-1", { method: "DELETE" })
    const res = await DELETE(req as never, { params: Promise.resolve({ id: "c-1" }) })
    expect(res.status).toBe(404)
  })

  it("deletes client", async () => {
    vi.mocked(prisma.client.findFirst).mockResolvedValueOnce(mockClient as never)
    vi.mocked(prisma.client.delete).mockResolvedValueOnce({} as never)

    const req = new Request("http://localhost/api/clients/c-1", { method: "DELETE" })
    const res = await DELETE(req as never, { params: Promise.resolve({ id: "c-1" }) })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })

  it("returns 500 on database error (GET)", async () => {
    vi.mocked(prisma.client.findFirst).mockRejectedValueOnce(new Error("DB error"))
    const req = new Request("http://localhost/api/clients/c-1")
    const res = await GET(req as never, { params: Promise.resolve({ id: "c-1" }) })
    expect(res.status).toBe(500)
  })

  it("returns 500 on database error (DELETE)", async () => {
    vi.mocked(prisma.client.findFirst).mockRejectedValueOnce(new Error("DB error"))
    const req = new Request("http://localhost/api/clients/c-1", { method: "DELETE" })
    const res = await DELETE(req as never, { params: Promise.resolve({ id: "c-1" }) })
    expect(res.status).toBe(500)
  })
})
