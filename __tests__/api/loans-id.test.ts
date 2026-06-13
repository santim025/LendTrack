import { describe, it, expect, vi, beforeEach } from "vitest"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { GET, PUT, DELETE } from "@/app/api/loans/[id]/route"

vi.mocked(getServerSession).mockResolvedValue({
  user: { id: "user-1", email: "test@test.com", role: "user" },
  expires: "2099-01-01",
} as never)

const mockLoan = {
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
  client: { id: "c-1", name: "Juan" },
  payments: [
    { id: "p-1", paymentMonth: new Date(2025, 4, 31), interestEarned: 500000, wasPaid: true, paymentDate: new Date(2025, 4, 28), createdAt: new Date(), updatedAt: new Date() },
    { id: "p-2", paymentMonth: new Date(2025, 5, 30), interestEarned: 500000, wasPaid: false, paymentDate: null, createdAt: new Date(), updatedAt: new Date() },
  ],
}

describe("GET /api/loans/:id", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never)
    const req = new Request("http://localhost/api/loans/l-1")
    const res = await GET(req as never, { params: Promise.resolve({ id: "l-1" }) })
    expect(res.status).toBe(401)
  })

  it("returns 404 when loan not found", async () => {
    vi.mocked(prisma.loan.findFirst).mockResolvedValueOnce(null)
    const req = new Request("http://localhost/api/loans/l-1")
    const res = await GET(req as never, { params: Promise.resolve({ id: "l-1" }) })
    expect(res.status).toBe(404)
  })

  it("returns loan detail with summary", async () => {
    vi.mocked(prisma.loan.findFirst).mockResolvedValueOnce(mockLoan as never)
    const req = new Request("http://localhost/api/loans/l-1")
    const res = await GET(req as never, { params: Promise.resolve({ id: "l-1" }) })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.loan.principalAmount).toBe(5000000)
    expect(data.loan.monthlyInterest).toBe(500000)
    expect(data.summary.totalPayments).toBe(2)
    expect(data.summary.paidPayments).toBe(1)
    expect(data.payments).toHaveLength(2)
  })
})

describe("PUT /api/loans/:id", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never)
    const req = new Request("http://localhost/api/loans/l-1", {
      method: "PUT",
      body: JSON.stringify({ interestRate: 12 }),
    })
    const res = await PUT(req as never, { params: Promise.resolve({ id: "l-1" }) })
    expect(res.status).toBe(401)
  })

  it("returns 404 when loan not found", async () => {
    vi.mocked(prisma.loan.findFirst).mockResolvedValueOnce(null)
    const req = new Request("http://localhost/api/loans/l-1", {
      method: "PUT",
      body: JSON.stringify({ interestRate: 12 }),
    })
    const res = await PUT(req as never, { params: Promise.resolve({ id: "l-1" }) })
    expect(res.status).toBe(404)
  })

  it("returns 400 when interestRate is out of range", async () => {
    vi.mocked(prisma.loan.findFirst).mockResolvedValueOnce(mockLoan as never)
    const req = new Request("http://localhost/api/loans/l-1", {
      method: "PUT",
      body: JSON.stringify({ interestRate: 200 }),
    })
    const res = await PUT(req as never, { params: Promise.resolve({ id: "l-1" }) })
    expect(res.status).toBe(400)
  })

  it("returns 400 when no valid fields to update", async () => {
    vi.mocked(prisma.loan.findFirst).mockResolvedValueOnce(mockLoan as never)
    const req = new Request("http://localhost/api/loans/l-1", {
      method: "PUT",
      body: JSON.stringify({}),
    })
    const res = await PUT(req as never, { params: Promise.resolve({ id: "l-1" }) })
    expect(res.status).toBe(400)
  })

  it("updates interest rate and recalculates pending payments", async () => {
    vi.mocked(prisma.loan.findFirst).mockResolvedValueOnce({
      ...mockLoan,
      payments: [mockLoan.payments[1]],
    } as never)
    vi.mocked(prisma.loan.update).mockResolvedValueOnce({
      ...mockLoan,
      interestRate: 12,
    } as never)
    vi.mocked(prisma.payment.updateMany).mockResolvedValueOnce({ count: 1 } as never)

    const req = new Request("http://localhost/api/loans/l-1", {
      method: "PUT",
      body: JSON.stringify({ interestRate: 12 }),
    })
    const res = await PUT(req as never, { params: Promise.resolve({ id: "l-1" }) })
    expect(res.status).toBe(200)
    expect(prisma.payment.updateMany).toHaveBeenCalledWith({
      where: { loanId: "l-1", wasPaid: false },
      data: { interestEarned: 600000 },
    })
  })

  it("adds additional capital to principal", async () => {
    vi.mocked(prisma.loan.findFirst).mockResolvedValueOnce({
      ...mockLoan,
      payments: [mockLoan.payments[1]],
    } as never)
    vi.mocked(prisma.loan.update).mockResolvedValueOnce({
      ...mockLoan,
      principalAmount: 6000000,
    } as never)
    vi.mocked(prisma.payment.updateMany).mockResolvedValueOnce({ count: 1 } as never)

    const req = new Request("http://localhost/api/loans/l-1", {
      method: "PUT",
      body: JSON.stringify({ additionalCapital: 1000000 }),
    })
    const res = await PUT(req as never, { params: Promise.resolve({ id: "l-1" }) })
    expect(res.status).toBe(200)
    expect(prisma.loan.update).toHaveBeenCalledWith({
      where: { id: "l-1" },
      data: { principalAmount: { increment: 1000000 } },
    })
  })
})

describe("DELETE /api/loans/:id", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never)
    const req = new Request("http://localhost/api/loans/l-1", { method: "DELETE" })
    const res = await DELETE(req as never, { params: Promise.resolve({ id: "l-1" }) })
    expect(res.status).toBe(401)
  })

  it("returns 404 when loan not found", async () => {
    vi.mocked(prisma.loan.findFirst).mockResolvedValueOnce(null)
    const req = new Request("http://localhost/api/loans/l-1", { method: "DELETE" })
    const res = await DELETE(req as never, { params: Promise.resolve({ id: "l-1" }) })
    expect(res.status).toBe(404)
  })

  it("deletes loan and its payments", async () => {
    vi.mocked(prisma.loan.findFirst).mockResolvedValueOnce(mockLoan as never)
    vi.mocked(prisma.payment.deleteMany).mockResolvedValueOnce({ count: 2 } as never)
    vi.mocked(prisma.loan.delete).mockResolvedValueOnce({} as never)

    const req = new Request("http://localhost/api/loans/l-1", { method: "DELETE" })
    const res = await DELETE(req as never, { params: Promise.resolve({ id: "l-1" }) })
    expect(res.status).toBe(200)
    expect(prisma.payment.deleteMany).toHaveBeenCalledWith({ where: { loanId: "l-1" } })
    expect(prisma.loan.delete).toHaveBeenCalledWith({ where: { id: "l-1" } })
  })

  it("returns 500 on database error (GET)", async () => {
    vi.mocked(prisma.loan.findFirst).mockRejectedValueOnce(new Error("DB error"))
    const req = new Request("http://localhost/api/loans/l-1")
    const res = await GET(req as never, { params: Promise.resolve({ id: "l-1" }) })
    expect(res.status).toBe(500)
  })

  it("returns 500 on database error (PUT)", async () => {
    vi.mocked(prisma.loan.findFirst).mockRejectedValueOnce(new Error("DB error"))
    const req = new Request("http://localhost/api/loans/l-1", {
      method: "PUT",
      body: JSON.stringify({ interestRate: 12 }),
    })
    const res = await PUT(req as never, { params: Promise.resolve({ id: "l-1" }) })
    expect(res.status).toBe(500)
  })

  it("returns 500 on database error (DELETE)", async () => {
    vi.mocked(prisma.loan.findFirst).mockRejectedValueOnce(new Error("DB error"))
    const req = new Request("http://localhost/api/loans/l-1", { method: "DELETE" })
    const res = await DELETE(req as never, { params: Promise.resolve({ id: "l-1" }) })
    expect(res.status).toBe(500)
  })
})
