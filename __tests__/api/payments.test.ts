import { describe, it, expect, vi, beforeEach } from "vitest"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { PUT } from "@/app/api/payments/[id]/route"

vi.mocked(getServerSession).mockResolvedValue({
  user: { id: "user-1", email: "test@test.com", role: "user" },
  expires: "2099-01-01",
} as never)

const mockPayment = {
  id: "pay-1",
  userId: "user-1",
  loanId: "l-1",
  paymentMonth: new Date(2025, 4, 31),
  interestEarned: 500000,
  wasPaid: false,
  paymentDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  loan: {
    id: "l-1",
    principalAmount: 5000000,
    interestRate: 10,
    startDate: new Date(2025, 3, 1),
  },
}

describe("PUT /api/payments/:id", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null as never)
    const req = new Request("http://localhost/api/payments/pay-1", {
      method: "PUT",
      body: JSON.stringify({ wasPaid: true }),
    })
    const res = await PUT(req as never, { params: Promise.resolve({ id: "pay-1" }) })
    expect(res.status).toBe(401)
  })

  it("returns 400 when wasPaid is not a boolean", async () => {
    const req = new Request("http://localhost/api/payments/pay-1", {
      method: "PUT",
      body: JSON.stringify({}),
    })
    const res = await PUT(req as never, { params: Promise.resolve({ id: "pay-1" }) })
    expect(res.status).toBe(400)
  })

  it("returns 404 when payment not found", async () => {
    vi.mocked(prisma.payment.findFirst).mockResolvedValueOnce(null)
    const req = new Request("http://localhost/api/payments/pay-1", {
      method: "PUT",
      body: JSON.stringify({ wasPaid: true }),
    })
    const res = await PUT(req as never, { params: Promise.resolve({ id: "pay-1" }) })
    expect(res.status).toBe(404)
  })

  it("marks payment as paid", async () => {
    vi.mocked(prisma.payment.findFirst).mockResolvedValueOnce(mockPayment as never)
    vi.mocked(prisma.payment.update).mockResolvedValueOnce({
      ...mockPayment,
      wasPaid: true,
      paymentDate: new Date(),
    } as never)
    vi.mocked(prisma.payment.findFirst).mockResolvedValueOnce(null)
    vi.mocked(prisma.payment.create).mockResolvedValueOnce({} as never)

    const req = new Request("http://localhost/api/payments/pay-1", {
      method: "PUT",
      body: JSON.stringify({ wasPaid: true }),
    })
    const res = await PUT(req as never, { params: Promise.resolve({ id: "pay-1" }) })
    expect(res.status).toBe(200)
    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: "pay-1" },
      data: { wasPaid: true, paymentDate: expect.any(Date) },
    })
  })

  it("marks payment as unpaid", async () => {
    const paidPayment = { ...mockPayment, wasPaid: true, paymentDate: new Date() }
    vi.mocked(prisma.payment.findFirst).mockResolvedValueOnce(paidPayment as never)
    vi.mocked(prisma.payment.update).mockResolvedValueOnce({
      ...mockPayment,
      wasPaid: false,
      paymentDate: null,
    } as never)

    const req = new Request("http://localhost/api/payments/pay-1", {
      method: "PUT",
      body: JSON.stringify({ wasPaid: false }),
    })
    const res = await PUT(req as never, { params: Promise.resolve({ id: "pay-1" }) })
    expect(res.status).toBe(200)
  })

  it("creates next month payment when marking as paid and next doesn't exist", async () => {
    vi.mocked(prisma.payment.findFirst)
      .mockResolvedValueOnce(mockPayment as never)
      .mockResolvedValueOnce(null)
    vi.mocked(prisma.payment.update).mockResolvedValueOnce({
      ...mockPayment,
      wasPaid: true,
      paymentDate: new Date(),
    } as never)
    vi.mocked(prisma.payment.create).mockResolvedValueOnce({} as never)

    const req = new Request("http://localhost/api/payments/pay-1", {
      method: "PUT",
      body: JSON.stringify({ wasPaid: true }),
    })
    await PUT(req as never, { params: Promise.resolve({ id: "pay-1" }) })
    expect(prisma.payment.create).toHaveBeenCalled()
  })

  it("does not create next month payment when it already exists", async () => {
    vi.mocked(prisma.payment.findFirst)
      .mockResolvedValueOnce(mockPayment as never)
      .mockResolvedValueOnce({ id: "pay-next" } as never)
    vi.mocked(prisma.payment.update).mockResolvedValueOnce({
      ...mockPayment,
      wasPaid: true,
      paymentDate: new Date(),
    } as never)

    const req = new Request("http://localhost/api/payments/pay-1", {
      method: "PUT",
      body: JSON.stringify({ wasPaid: true }),
    })
    await PUT(req as never, { params: Promise.resolve({ id: "pay-1" }) })
    expect(prisma.payment.create).not.toHaveBeenCalled()
  })

  it("returns 500 on database error", async () => {
    vi.mocked(prisma.payment.findFirst).mockRejectedValueOnce(new Error("DB error"))
    const req = new Request("http://localhost/api/payments/pay-1", {
      method: "PUT",
      body: JSON.stringify({ wasPaid: true }),
    })
    const res = await PUT(req as never, { params: Promise.resolve({ id: "pay-1" }) })
    expect(res.status).toBe(500)
  })
})
